import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { asKv } from './kv.mjs'

const N = 16384, R = 8, P = 1, KEYLEN = 64
const scryptAsync = (pw, salt, n, r, p) => new Promise((res, rej) => scrypt(pw, salt, KEYLEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))))

/** Format: scrypt$N$r$p$salt$hash (base64). Plain passwords are never stored. */
export async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, N, R, P)
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, n, r, p, salt, hash] = String(stored).split('$')
    if (scheme !== 'scrypt') return false
    const expected = Buffer.from(hash, 'base64')
    const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p))
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 12) return 'Use at least 12 characters.'
  if (pw.length > 200) return 'That password is too long.'
  if (/^(.)\1+$/.test(pw)) return 'Choose a less repetitive password.'
  return ''
}

export const ROLES = ['owner', 'editor', 'viewer']
const USERNAME = /^[a-zA-Z0-9._-]{3,40}$/

export function createAuth({ dir, kv: kvIn, env = process.env }) {
  const kv = asKv(kvIn ?? dir)
  const sessions = new Map() // sha256(token) -> { exp, username, role }
  const attempts = new Map() // ip -> { count, first }
  const TTL = Number(env.SESSION_HOURS ?? 8) * 3600 * 1000
  const WINDOW = 15 * 60 * 1000
  const MAX_ATTEMPTS = Number(env.LOGIN_MAX_ATTEMPTS ?? 5)

  const fromEnv = () => (env.ADMIN_USERNAME && env.ADMIN_PASSWORD_HASH ? { username: env.ADMIN_USERNAME, passwordHash: env.ADMIN_PASSWORD_HASH, managedByEnv: true } : null)
  async function loadOwner() {
    const e = fromEnv()
    if (e) return e
    try { return await kv.read('admin.json') } catch { return null }
  }
  async function loadOthers() {
    try { const l = await kv.read('users.json'); return Array.isArray(l) ? l : [] } catch { return [] }
  }
  async function saveOthers(list) { await kv.write('users.json', list) }
  async function allUsers() {
    const owner = await loadOwner()
    return [...(owner ? [{ ...owner, role: 'owner' }] : []), ...(await loadOthers()).filter((u) => u.role !== 'owner')]
  }

  const sha = (t) => createHash('sha256').update(t).digest('hex')
  const sameText = (a, b) => timingSafeEqual(createHash('sha256').update(String(a)).digest(), createHash('sha256').update(String(b)).digest())
  const sweep = () => { const now = Date.now(); for (const [k, v] of sessions) if (v.exp < now) sessions.delete(k) }
  const dropSessions = (username) => { for (const [k, v] of sessions) if (!username || v.username === username) sessions.delete(k) }

  return {
    configured: async () => !!(await loadOwner()),
    async setCredentials(username, password) {
      const problem = passwordProblem(password)
      if (problem) throw new Error(problem)
      await kv.init()
      await kv.write('admin.json', { username, passwordHash: await hashPassword(password), updatedAt: new Date().toISOString() })
    },
    async changePassword(current, next, username) {
      const users = await allUsers()
      const me = username ? users.find((u) => u.username === username) : users[0]
      if (!me) return { ok: false, error: 'No admin account.' }
      if (me.managedByEnv) return { ok: false, error: 'The password is managed by environment variables. Change ADMIN_PASSWORD_HASH instead.' }
      if (!(await verifyPassword(current, me.passwordHash))) return { ok: false, error: 'Current password is incorrect.' }
      const problem = passwordProblem(next)
      if (problem) return { ok: false, error: problem }
      if (me.role === 'owner') await this.setCredentials(me.username, next)
      else {
        const list = await loadOthers()
        const u = list.find((x) => x.username === me.username)
        u.passwordHash = await hashPassword(next)
        await saveOthers(list)
      }
      dropSessions(me.username)
      return { ok: true }
    },
    /** Returns { ok, retryAfter, token, role }. Failed attempts are counted per IP. */
    async login(ip, username, password) {
      const now = Date.now()
      const a = attempts.get(ip)
      if (a && now - a.first < WINDOW && a.count >= MAX_ATTEMPTS) return { ok: false, retryAfter: Math.ceil((a.first + WINDOW - now) / 1000) }
      const users = await allUsers()
      const user = typeof username === 'string' ? users.find((u) => sameText(u.username, username)) : null
      const good = !!user && typeof password === 'string' && (await verifyPassword(password, user.passwordHash))
      if (!good) {
        // Spend the same time whether or not the username exists.
        if (!user) await verifyPassword(String(password ?? ''), 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA')
        const fresh = !a || now - a.first >= WINDOW
        attempts.set(ip, { count: fresh ? 1 : a.count + 1, first: fresh ? now : a.first })
        return { ok: false }
      }
      attempts.delete(ip)
      sweep()
      const token = randomBytes(32).toString('hex')
      sessions.set(sha(token), { exp: now + TTL, username: user.username, role: user.role })
      return { ok: true, token, maxAge: Math.floor(TTL / 1000), username: user.username, role: user.role }
    },
    /** The session ({ username, role }) for a token, or null. */
    check(token) {
      if (!token) return null
      const s = sessions.get(sha(token))
      if (!s) return null
      if (s.exp < Date.now()) { sessions.delete(sha(token)); return null }
      return { username: s.username, role: s.role }
    },
    logout(token) { if (token) sessions.delete(sha(token)) },

    async listUsers() { return (await allUsers()).map((u) => ({ username: u.username, role: u.role, managedByEnv: !!u.managedByEnv })) },
    async addUser(username, password, role) {
      if (!USERNAME.test(String(username ?? ''))) return { ok: false, error: 'Use 3 to 40 letters, numbers, dots, dashes or underscores.' }
      if (!['editor', 'viewer'].includes(role)) return { ok: false, error: 'Role must be editor or viewer.' }
      const problem = passwordProblem(password)
      if (problem) return { ok: false, error: problem }
      const users = await allUsers()
      if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) return { ok: false, error: 'That username is taken.' }
      const list = await loadOthers()
      list.push({ username, role, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() })
      await saveOthers(list)
      return { ok: true }
    },
    async updateUser(username, { role, password }) {
      const list = await loadOthers()
      const u = list.find((x) => x.username === username)
      if (!u) return { ok: false, error: 'No such user.' }
      if (role !== undefined) {
        if (!['editor', 'viewer'].includes(role)) return { ok: false, error: 'Role must be editor or viewer.' }
        u.role = role
      }
      if (password !== undefined) {
        const problem = passwordProblem(password)
        if (problem) return { ok: false, error: problem }
        u.passwordHash = await hashPassword(password)
      }
      await saveOthers(list)
      dropSessions(username)
      return { ok: true }
    },
    async removeUser(username) {
      const list = await loadOthers()
      if (!list.some((x) => x.username === username)) return { ok: false, error: 'No such user.' }
      await saveOthers(list.filter((x) => x.username !== username))
      dropSessions(username)
      return { ok: true }
    },
  }
}
