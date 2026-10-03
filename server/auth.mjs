import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

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

export function createAuth({ dir, env = process.env }) {
  const adminFile = join(dir, 'admin.json')
  const sessions = new Map() // sha256(token) -> { exp }
  const attempts = new Map() // ip -> { count, first }
  const TTL = Number(env.SESSION_HOURS ?? 8) * 3600 * 1000
  const WINDOW = 15 * 60 * 1000
  const MAX_ATTEMPTS = Number(env.LOGIN_MAX_ATTEMPTS ?? 5)

  const fromEnv = () => (env.ADMIN_USERNAME && env.ADMIN_PASSWORD_HASH ? { username: env.ADMIN_USERNAME, passwordHash: env.ADMIN_PASSWORD_HASH, managedByEnv: true } : null)
  async function loadAdmin() {
    const e = fromEnv()
    if (e) return e
    if (!existsSync(adminFile)) return null
    try { return JSON.parse(await readFile(adminFile, 'utf8')) } catch { return null }
  }

  const sha = (t) => createHash('sha256').update(t).digest('hex')
  const sweep = () => { const now = Date.now(); for (const [k, v] of sessions) if (v.exp < now) sessions.delete(k) }

  return {
    configured: async () => !!(await loadAdmin()),
    async setCredentials(username, password) {
      const problem = passwordProblem(password)
      if (problem) throw new Error(problem)
      await mkdir(dir, { recursive: true })
      await writeFile(adminFile, JSON.stringify({ username, passwordHash: await hashPassword(password), updatedAt: new Date().toISOString() }), { mode: 0o600 })
      await chmod(adminFile, 0o600).catch(() => {})
    },
    async changePassword(current, next) {
      const admin = await loadAdmin()
      if (!admin) return { ok: false, error: 'No admin account.' }
      if (admin.managedByEnv) return { ok: false, error: 'The password is managed by environment variables. Change ADMIN_PASSWORD_HASH instead.' }
      if (!(await verifyPassword(current, admin.passwordHash))) return { ok: false, error: 'Current password is incorrect.' }
      const problem = passwordProblem(next)
      if (problem) return { ok: false, error: problem }
      await this.setCredentials(admin.username, next)
      sessions.clear()
      return { ok: true }
    },
    /** Returns { ok, retryAfter, token }. Failed attempts are counted per IP. */
    async login(ip, username, password) {
      const now = Date.now()
      const a = attempts.get(ip)
      if (a && now - a.first < WINDOW && a.count >= MAX_ATTEMPTS) return { ok: false, retryAfter: Math.ceil((a.first + WINDOW - now) / 1000) }
      const admin = await loadAdmin()
      const good = !!admin && typeof username === 'string' && typeof password === 'string' &&
        username.length === admin.username.length && timingSafeEqual(Buffer.from(username), Buffer.from(admin.username)) &&
        (await verifyPassword(password, admin.passwordHash))
      if (!good) {
        // Spend the same time whether or not the username exists.
        if (!admin) await verifyPassword(String(password ?? ''), 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA')
        const fresh = !a || now - a.first >= WINDOW
        attempts.set(ip, { count: fresh ? 1 : a.count + 1, first: fresh ? now : a.first })
        return { ok: false }
      }
      attempts.delete(ip)
      sweep()
      const token = randomBytes(32).toString('hex')
      sessions.set(sha(token), { exp: now + TTL })
      return { ok: true, token, maxAge: Math.floor(TTL / 1000), username: admin.username }
    },
    check(token) {
      if (!token) return false
      const s = sessions.get(sha(token))
      if (!s) return false
      if (s.exp < Date.now()) { sessions.delete(sha(token)); return false }
      return true
    },
    logout(token) { if (token) sessions.delete(sha(token)) },
  }
}
