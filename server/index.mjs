import './loadenv.mjs'
import express from 'express'
import compression from 'compression'
import multer from 'multer'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStore } from './store.mjs'
import { createAuth } from './auth.mjs'
import { createMedia } from './media.mjs'
import { validateContent } from './validate.mjs'
import { publicView } from './publicView.mjs'
import { createKv } from './kv.mjs'
import { createEnquiries, createEndorsements, createSubscribers, createInsights, createSnapshots, createSettings } from './records.mjs'
import { createMailer } from './mailer.mjs'
import { createBackups, backupStream } from './backup.mjs'
import { createLimiter, parseContact, parseEndorsement } from './routes.mjs'
import { s3FromEnv } from './s3.mjs'
import { restoreBackup } from './restore.mjs'
import { renderCard, readPicture } from './ogcard.mjs'
import { buildDigest, digestDue, localParts } from './digest.mjs'
import { buildCsp, buildManifest, buildRobots, buildFeed, buildFullSitemap, injectHead, pageSeo, withSeo } from '../shared/head.mjs'

function parseCookies(header = '') {
  const out = {}
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

const COOKIE = 'sam_session'

/**
 * Where uploads and file records live when DATA_DIR is not set. An existing ./data folder keeps working.
 * Otherwise a folder in the user's home directory is used, so unzipping a new version of the project
 * somewhere else never starts you from an empty site.
 */
export function defaultDataDir() {
  return existsSync(resolve('data')) ? resolve('data') : join(homedir(), '.summer-air-mail')
}

/** @param {{ dataDir?: string, distDir?: string, env?: Record<string, string | undefined>, deps?: { transportFactory?: Function, fetchImpl?: Function } }} [options] */
export async function createApp({ dataDir, distDir, env = process.env, deps = {} } = {}) {
  dataDir = resolve(dataDir ?? env.DATA_DIR ?? defaultDataDir())
  distDir = resolve(distDir ?? 'dist')
  const kv = await createKv({ dataDir, env })
  const snapshots = createSnapshots(kv)
  const store = createStore(kv, { onSave: (before, after) => snapshots.record(before, after) })
  const auth = createAuth({ kv, env })
  // On the live site the address can come from SITE_URL until it is typed into the admin (SEO page), so search and sharing tags are right from the start.
  const siteUrl = String(env.SITE_URL ?? '').replace(/\/$/, '')
  const getPublished = () => {
    const pub = store.getPublished()
    if (!pub || !siteUrl || pub.content?.portfolio?.site?.url) return pub
    return { ...pub, content: { ...pub.content, portfolio: { ...pub.content.portfolio, site: { ...pub.content.portfolio.site, url: siteUrl } } } }
  }
  const media = createMedia(dataDir, kv)
  const enquiries = createEnquiries(kv)
  const endorsements = createEndorsements(kv)
  const subscribers = createSubscribers(kv)
  const insights = createInsights(kv)
  const settings = createSettings(kv)
  const mailer = createMailer(env, deps)
  await Promise.all([store.init(), media.init(), snapshots.init(), enquiries.init(), endorsements.init(), subscribers.init(), insights.init(), settings.init()])
  const backups = createBackups({ dataDir, kv, env, getSettings: settings.get, fetchImpl: deps.fetchImpl })
  backups.schedule()
  const pruneTimer = setInterval(() => {
    void enquiries.prune(settings.get().enquiryRetentionDays)
    void insights.prune(getPublished()?.content?.portfolio?.insights?.retentionDays ?? 365)
  }, 6 * 3600 * 1000)
  pruneTimer.unref?.()

  /** The weekly summary. Checked every 15 minutes; sent once in the chosen week, only when it actually reached email or the webhook. */
  async function sendDigest({ force = false } = {}) {
    const st = settings.get()
    const now = new Date()
    if (!force && !digestDue(st.digest, now)) return null
    const { subject, text } = buildDigest({ insights, enquiries, content: getPublished()?.content, now })
    const delivered = await mailer.notify({ to: st.notifyEmail, subject, text })
    if (!force && (delivered.email || delivered.webhook)) await settings.markDigestSent(localParts(now, st.digest.timezone).date)
    return { delivered, subject, text }
  }
  const digestTimer = setInterval(() => { void sendDigest().catch((e) => console.error('Weekly summary failed:', e.message)) }, 15 * 60 * 1000)
  digestTimer.unref?.()

  const app = express()
  app.disable('x-powered-by')
  if (env.TRUST_PROXY) app.set('trust proxy', Number(env.TRUST_PROXY) || 1)

  const secureCookie = (req) => env.COOKIE_SECURE === 'true' || req.secure || req.headers['x-forwarded-proto'] === 'https'

  app.use(compression())
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
    })
    if (secureCookie(req)) res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
    next()
  })

  /* ---------- uploaded media (public once uploaded; names are unguessable) ---------- */
  app.use('/uploads', express.static(media.uploads, {
    maxAge: '365d', immutable: true, index: false, dotfiles: 'deny',
    setHeaders: (res) => res.set('Content-Security-Policy', "default-src 'none'; sandbox"),
  }))

  app.get('/healthz', (_req, res) => res.type('text').send('ok'))

  /* ---------- public content ---------- */
  app.get('/api/content', (_req, res) => {
    const pub = getPublished()
    res.set('Cache-Control', 'no-cache')
    res.json({ content: publicView(pub?.content) ?? null, rev: pub?.rev ?? 0, publishedAt: pub?.publishedAt ?? null })
  })

  /* ---------- public forms and tracking ---------- */
  const publicJson = express.json({ limit: '32kb' })
  const published = () => getPublished()?.content ?? null
  const contactLimit = createLimiter({ max: 5, windowMs: 3600 * 1000 })
  const endorseLimit = createLimiter({ max: 3, windowMs: 3600 * 1000 })
  const subscribeLimit = createLimiter({ max: 5, windowMs: 3600 * 1000 })
  const trackLimit = createLimiter({ max: 120, windowMs: 60 * 1000 })
  const MIN_FILL_MS = 2500

  app.post('/api/contact', publicJson, async (req, res) => {
    const c = published()?.portfolio?.contact
    if (!c || c.delivery === 'client') return res.status(404).json({ error: 'Not available.' })
    if (!contactLimit(req.ip ?? 'x')) return res.status(429).json({ error: 'Too many messages from this connection. Please try again later.' })
    const r = parseContact(req.body)
    if (r.error) return res.status(400).json({ error: r.error })
    if (r.honeypot) return res.json({ ok: true }) // look successful to bots, store nothing
    if (r.elapsed < MIN_FILL_MS) return res.status(400).json({ error: 'Please take a moment and send again.' })
    const item = await enquiries.add(r.value)
    const st = settings.get()
    if (st.notifyOnEnquiry) {
      void mailer.notify({
        to: st.notifyEmail, replyTo: r.value.email, subject: `New enquiry from ${r.value.name}`,
        text: `${r.value.name} <${r.value.email}>\n${r.value.type}${r.value.budget ? ` | ${r.value.budget}` : ''}${r.value.company ? ` | ${r.value.company}` : ''}\n\n${r.value.message}`,
      })
    }
    res.json({ ok: true, id: item.id })
  })

  app.post('/api/endorse', publicJson, async (req, res) => {
    const e = published()?.portfolio?.endorsements
    if (!e?.enabled) return res.status(404).json({ error: 'Not available.' })
    if (!endorseLimit(req.ip ?? 'x')) return res.status(429).json({ error: 'Too many attempts from this connection. Please try again later.' })
    const r = parseEndorsement(req.body)
    if (r.error) return res.status(400).json({ error: r.error })
    if (r.honeypot) return res.json({ ok: true })
    if (r.elapsed < MIN_FILL_MS) return res.status(400).json({ error: 'Please take a moment and send again.' })
    await endorsements.add(r.value)
    const st = settings.get()
    if (st.notifyOnEnquiry) void mailer.notify({ to: st.notifyEmail, subject: `New recommendation from ${r.value.name}`, text: `${r.value.quote}\n\nIt is waiting for your approval in the Inbox, under Recommendations.` })
    res.json({ ok: true })
  })

  app.post('/api/subscribe', publicJson, async (req, res) => {
    const n = published()?.portfolio?.newsletter
    if (!n?.enabled || n.mode !== 'collect') return res.status(404).json({ error: 'Not available.' })
    if (!subscribeLimit(req.ip ?? 'x')) return res.status(429).json({ error: 'Too many attempts. Please try again later.' })
    const b = req.body ?? {}
    if (String(b.website ?? '').trim()) return res.json({ ok: true })
    if (b.consent !== true) return res.status(400).json({ error: 'Please tick the consent box.' })
    if (!/^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/.test(String(b.email ?? '').trim())) return res.status(400).json({ error: 'Please enter a valid email address.' })
    if ((Number(b.elapsed) || 0) < 1200) return res.status(400).json({ error: 'Please try again.' })
    const r = await subscribers.add(b.email, n.consentText)
    if (r.ok && settings.get().notifyOnSubscriber) void mailer.notify({ to: settings.get().notifyEmail, subject: 'New newsletter subscriber', text: String(b.email).slice(0, 254) })
    res.json({ ok: true }) // the same answer for a repeat signup, so addresses cannot be probed
  })

  app.post('/api/track', publicJson, async (req, res) => {
    const i = published()?.portfolio?.insights
    res.status(204).end()
    if (!i?.enabled || (i.respectDoNotTrack && req.headers.dnt === '1') || !trackLimit(req.ip ?? 'x')) return
    const b = req.body ?? {}
    // The owner's own visits (a signed-in browser, or the network they signed in from) are counted apart, or dropped if the owner prefers.
    const countOwn = i.countOwn !== false
    const own = b.own === true || insights.isHome(req.ip)
    if (own && !countOwn) return
    await insights.record({ type: b.type, path: b.path, ref: b.ref, name: b.name, ip: req.ip, ua: req.headers['user-agent'] ?? '', own })
  })

  /** A tailored application link. Only someone who knows the slug can fetch it; it is never in the public JSON. */
  app.get('/api/application/:slug', (req, res) => {
    const pubc = getPublished()?.content
    const a = (pubc?.applications ?? []).find((x) => x.slug === req.params.slug)
    const expired = a?.expiresAt && Date.parse(a.expiresAt) + 864e5 < Date.now()
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' })
    if (!a || a.enabled === false || expired) return res.status(404).json({ error: 'This link is not available.' })
    res.json({ application: { ...a, look: (pubc?.looks ?? []).find((l) => l.id === a.lookId) ?? null } })
  })

  /** Short links resolve on the server, so they work in social bios and print. */
  app.get('/go/:slug', (req, res) => {
    const c = published()
    const l = (c?.shortLinks ?? []).find((x) => x.slug === req.params.slug && x.enabled !== false)
    if (!l) return res.status(404).type('text').send('Link not found.')
    const { type, value } = l.target ?? {}
    const to = type === 'url' ? (/^https?:\/\//i.test(value) ? value : '/')
      : type === 'section' ? `/#${encodeURIComponent(value)}`
      : type === 'project' ? `/work/${encodeURIComponent(value)}`
      : type === 'note' ? `/notes/${encodeURIComponent(value)}`
      : type === 'application' ? `/for/${encodeURIComponent(value)}`
      : type === 'profile' ? '/profile' : '/'
    const own = insights.isHome(req.ip)
    if (!(own && published()?.portfolio?.insights?.countOwn === false)) void insights.record({ type: 'share', name: `/go/${l.slug}`, ip: req.ip, ua: req.headers['user-agent'] ?? '', own }).catch(() => {})
    res.set('Cache-Control', 'no-store').redirect(302, to)
  })

  /** Optional public visit counts, only when the owner switched the panel on. Application links and the admin never appear. */
  app.get('/api/stats', (_req, res) => {
    const s = published()?.portfolio?.publicStats
    res.set('Cache-Control', 'public, max-age=300')
    if (!s?.enabled) return res.status(404).json({ error: 'Not available.' })
    const range = [7, 30, 90].includes(Number(s.rangeDays)) ? Number(s.rangeDays) : 30
    const sum = insights.summary(range)
    const topPages = s.showTopPages === false ? [] : Object.entries(sum.paths).filter(([p]) => !/^\/(for|admin|go)(\/|$)/.test(p)).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, views]) => ({ path, views }))
    res.json({ range, visitors: sum.visitors, views: s.showViews === false ? null : sum.views, series: sum.series.map((d) => ({ day: d.day, views: d.views })), topPages, updated: new Date().toISOString() })
  })

  app.get('/feed.xml', (_req, res) => {
    const xml = buildFeed(published())
    if (xml) res.type('application/rss+xml').send(xml)
    else res.status(404).type('text').send('No feed.')
  })

  /* ---------- admin API ---------- */
  const admin = express.Router()
  admin.use(express.json({ limit: '4mb' }))
  admin.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Cross-site requests cannot set this header without a CORS preflight, which this server never grants.
      if (req.headers['x-requested-with'] !== 'sam-admin') return res.status(403).json({ error: 'Missing request header.' })
      const origin = req.headers.origin
      if (origin) {
        const hosts = [req.headers.host, req.headers['x-forwarded-host']].filter(Boolean)
        const allowed = [...hosts.flatMap((h) => [`http://${h}`, `https://${h}`]), ...(env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [])]
        // Local development only: the Vite dev server and the API run on different ports of the same machine.
        let local = false
        if (env.NODE_ENV !== 'production') {
          try { local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname) } catch { /* not a URL */ }
        }
        if (!local && !allowed.includes(origin)) return res.status(403).json({ error: 'Cross-origin request blocked. If you use a custom domain behind a proxy, set TRUST_PROXY=1 or ALLOWED_ORIGINS.' })
      }
    }
    next()
  })

  const tokenOf = (req) => parseCookies(req.headers.cookie)[COOKIE]
  const requireAuth = (req, res, next) => {
    const me = auth.check(tokenOf(req))
    if (!me) return res.status(401).json({ error: 'Please sign in.' })
    req.me = me
    next()
  }
  /** owner: everything. editor: content, media and inbox; publishing only if the owner allows it. viewer: read only. */
  const can = (me, action) => {
    if (me.role === 'owner') return true
    if (me.role === 'viewer') return action === 'read'
    if (action === 'publish') return settings.get().editorsCanPublish
    return action === 'read' || action === 'edit'
  }
  const need = (action) => (req, res, next) => (can(req.me, action) ? next() : res.status(403).json({ error: 'Your role does not allow that.' }))
  const ownerOnly = (req, res, next) => (req.me.role === 'owner' ? next() : res.status(403).json({ error: 'Only the owner can do that.' }))

  admin.get('/session', async (req, res) => {
    const me = auth.check(tokenOf(req))
    if (me) void insights.markHome(req.ip)
    res.json({ configured: await auth.configured(), authenticated: !!me, username: me?.username ?? '', role: me?.role ?? '', canPublish: me ? can(me, 'publish') : false, storage: kv.kind })
  })

  admin.post('/login', async (req, res) => {
    const { username, password } = req.body ?? {}
    const r = await auth.login(req.ip ?? 'unknown', username, password)
    if (!r.ok) {
      if (r.retryAfter) {
        res.set('Retry-After', String(r.retryAfter))
        return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(r.retryAfter / 60)} minutes.` })
      }
      await new Promise((ok) => setTimeout(ok, 350))
      return res.status(401).json({ error: 'Incorrect username or password.' })
    }
    res.cookie(COOKIE, r.token, { httpOnly: true, sameSite: 'strict', secure: secureCookie(req), maxAge: r.maxAge * 1000, path: '/' })
    void insights.markHome(req.ip)
    res.json({ ok: true, role: r.role })
  })

  admin.post('/logout', (req, res) => {
    auth.logout(tokenOf(req))
    res.clearCookie(COOKIE, { path: '/' })
    res.json({ ok: true })
  })

  admin.use(requireAuth)
  // Anything that changes data needs at least the editor role (or owner). Routes tighten this below.
  admin.use((req, res, next) => (req.method === 'GET' || req.method === 'HEAD' || req.path === '/password' || can(req.me, 'edit') ? next() : res.status(403).json({ error: 'Your role is read only.' })))

  admin.get('/draft', (_req, res) => {
    const d = store.getDraft()
    res.json({ draft: d?.content ?? null, rev: d?.rev ?? 0, ...store.status() })
  })

  admin.put('/draft', async (req, res) => {
    const v = validateContent(req.body?.content)
    if (!v.ok) return res.status(400).json({ error: v.error })
    const r = await store.saveDraft(v.content, typeof req.body.baseRev === 'number' ? req.body.baseRev : undefined)
    if (r.conflict) return res.status(409).json({ error: 'This draft was changed in another tab or window. Reload to get the latest version.', rev: r.rev })
    res.json({ rev: r.rev, ...store.status() })
  })

  admin.post('/publish', need('publish'), async (_req, res) => {
    const p = await store.publish()
    if (!p) return res.status(400).json({ error: 'Nothing to publish yet. Save the draft first.' })
    res.json({ publishedAt: p.publishedAt, ...store.status() })
  })

  admin.post('/discard', async (_req, res) => {
    const d = await store.discardDraft()
    res.json({ draft: d?.content ?? null, rev: d?.rev ?? 0, ...store.status() })
  })

  admin.get('/history', (_req, res) => res.json({ history: store.history() }))
  admin.post('/restore', async (req, res) => {
    const d = await store.restore(String(req.body?.id ?? ''))
    if (!d) return res.status(404).json({ error: 'That version no longer exists.' })
    res.json({ draft: d.content, rev: d.rev, ...store.status() })
  })

  admin.post('/import', need('edit'), async (req, res) => {
    const v = validateContent(req.body?.content)
    if (!v.ok) return res.status(400).json({ error: v.error })
    const d = await store.importDraft(v.content)
    res.json({ draft: d.content, rev: d.rev, ...store.status() })
  })

  admin.post('/password', async (req, res) => {
    const r = await auth.changePassword(String(req.body?.current ?? ''), String(req.body?.next ?? ''), req.me.username)
    if (!r.ok) return res.status(400).json({ error: r.error })
    res.clearCookie(COOKIE, { path: '/' })
    res.json({ ok: true })
  })

  /* ---------- media library ---------- */
  const maxMb = Number(env.MAX_UPLOAD_MB ?? 60)
  const maxVideoMb = Number(env.MAX_VIDEO_MB ?? 2000)
  const upload = multer({
    storage: multer.diskStorage({ destination: (_req, _f, cb) => cb(null, media.tmpDir), filename: (_req, _f, cb) => cb(null, `up-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`) }),
    limits: { fileSize: maxVideoMb * 1024 * 1024, files: 1, fields: 8 },
  })
  admin.get('/media', (_req, res) => res.json({ media: media.list() }))
  admin.post('/media', (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? `That file is larger than ${maxVideoMb} MB.` : 'Upload failed.' })
      if (!req.file) return res.status(400).json({ error: 'Choose a file to upload.' })
      try {
        const r = await media.addFromDisk(req.file.path, req.file.originalname, req.body, { maxPlainBytes: maxMb * 1024 * 1024 })
        if (r.job) res.status(202).json(r)
        else res.json(r)
      } catch (e) {
        res.status(e.status ?? 500).json({ error: e.status ? e.message : 'Could not process that file.' })
      }
    })
  })
  admin.get('/media/jobs/:id', (req, res) => {
    const j = media.job(req.params.id)
    if (j) res.json({ job: j })
    else res.status(404).json({ error: 'Not found.' })
  })
  admin.patch('/media/:id', async (req, res) => {
    const a = await media.update(req.params.id, req.body ?? {})
    if (a) res.json({ asset: a })
    else res.status(404).json({ error: 'Not found.' })
  })
  admin.delete('/media/:id', async (req, res) => {
    const r = await media.remove(req.params.id, (url) => store.allContentStrings().includes(url))
    if (r.ok) res.json({ ok: true })
    else res.status(r.status).json({ error: r.error })
  })

  /* ---------- inbox, subscribers, insights ---------- */
  admin.get('/enquiries', (_req, res) => res.json({ items: enquiries.list(), unread: enquiries.unread(), due: enquiries.due().length }))
  admin.get('/endorsements', (_req, res) => res.json({ items: endorsements.list(), pending: endorsements.pending() }))
  admin.patch('/endorsements/:id', async (req, res) => {
    const r = await endorsements.setStatus(req.params.id, req.body?.status)
    return r.ok ? res.json({ ok: true, item: r.item, pending: endorsements.pending() }) : res.status(r.status).json({ error: r.error })
  })
  admin.delete('/endorsements/:id', async (req, res) => ((await endorsements.remove(req.params.id)) ? res.json({ ok: true, pending: endorsements.pending() }) : res.status(404).json({ error: 'Not found.' })))
  admin.get('/enquiries.csv', (_req, res) => res.type('text/csv').set('Content-Disposition', 'attachment; filename="enquiries.csv"').send(enquiries.csv()))
  admin.patch('/enquiries/:id', async (req, res) => {
    const b = req.body ?? {}
    const patch = {}
    for (const k of ['read', 'stage', 'notes', 'followUp']) if (k in b) patch[k] = b[k]
    const r = await enquiries.update(req.params.id, patch)
    if (!r.ok) return res.status(r.status).json({ error: r.error })
    res.json({ ok: true, item: r.item, unread: enquiries.unread(), due: enquiries.due().length })
  })
  admin.delete('/enquiries/:id', async (req, res) => ((await enquiries.remove(req.params.id)) ? res.json({ ok: true }) : res.status(404).json({ error: 'Not found.' })))
  admin.get('/subscribers', (_req, res) => res.json({ items: subscribers.list() }))
  admin.get('/subscribers.csv', (_req, res) => res.type('text/csv').set('Content-Disposition', 'attachment; filename="subscribers.csv"').send(subscribers.csv()))
  admin.delete('/subscribers/:id', async (req, res) => ((await subscribers.remove(req.params.id)) ? res.json({ ok: true }) : res.status(404).json({ error: 'Not found.' })))
  admin.get('/insights', (req, res) => res.json(insights.summary(Math.max(7, Math.min(365, Number(req.query.range) || 30)))))
  admin.delete('/insights/home', ownerOnly, async (_req, res) => { await insights.forgetHome(); res.json({ ok: true }) })

  /* ---------- undo for a single item ---------- */
  admin.get('/history/item/:collection/:id', (req, res) => res.json({ versions: snapshots.list(req.params.collection, req.params.id) }))
  admin.post('/history/item/:collection/:id/restore', async (req, res) => {
    const snap = snapshots.get(req.params.collection, req.params.id, Number(req.body?.index))
    const d = store.getDraft()
    if (!snap || !d || !Array.isArray(d.content[req.params.collection])) return res.status(404).json({ error: 'That version no longer exists.' })
    const content = structuredClone(d.content)
    const i = content[req.params.collection].findIndex((x) => x.id === req.params.id)
    if (i < 0) content[req.params.collection].push(snap)
    else content[req.params.collection][i] = snap
    const r = await store.saveDraft(content)
    res.json({ draft: content, rev: r.rev, ...store.status() })
  })

  /* ---------- owner: users, settings, backups ---------- */
  admin.get('/users', ownerOnly, async (_req, res) => res.json({ users: await auth.listUsers() }))
  admin.post('/users', ownerOnly, async (req, res) => {
    const r = await auth.addUser(req.body?.username, req.body?.password, req.body?.role)
    return r.ok ? res.json({ users: await auth.listUsers() }) : res.status(400).json({ error: r.error })
  })
  admin.patch('/users/:username', ownerOnly, async (req, res) => {
    const r = await auth.updateUser(req.params.username, { role: req.body?.role, password: req.body?.password })
    return r.ok ? res.json({ users: await auth.listUsers() }) : res.status(400).json({ error: r.error })
  })
  admin.delete('/users/:username', ownerOnly, async (req, res) => {
    const r = await auth.removeUser(req.params.username)
    return r.ok ? res.json({ users: await auth.listUsers() }) : res.status(400).json({ error: r.error })
  })
  const envInfo = () => ({ emailConfigured: mailer.emailConfigured, webhookConfigured: mailer.webhookConfigured, s3Configured: !!s3FromEnv(env), storage: kv.kind, dataDir })
  admin.get('/settings', ownerOnly, (_req, res) => res.json({ settings: settings.get(), env: envInfo() }))
  admin.put('/settings', ownerOnly, async (req, res) => {
    const next = await settings.set(req.body?.settings ?? {})
    backups.schedule()
    res.json({ settings: next, env: envInfo() })
  })
  admin.post('/settings/test-digest', ownerOnly, async (_req, res) => {
    const r = await sendDigest({ force: true })
    res.json({ delivered: r.delivered, subject: r.subject, text: r.text })
  })
  admin.post('/settings/test-alert', ownerOnly, async (_req, res) => {
    const r = await mailer.notify({ to: settings.get().notifyEmail, subject: 'Test alert from your portfolio', text: 'If you can read this, alerts are working.' })
    res.json(r)
  })
  admin.get('/backups', ownerOnly, async (_req, res) => res.json({ backups: await backups.list(), status: backups.status() }))
  admin.post('/backups/run', ownerOnly, async (_req, res) => res.json({ result: await backups.run(), backups: await backups.list() }))
  admin.get('/backups/download', ownerOnly, (_req, res) => {
    res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="portfolio-backup-${new Date().toISOString().slice(0, 10)}.zip"` })
    backupStream(dataDir, kv).on('error', () => res.destroy()).pipe(res)
  })
  // Put a backup zip back: content, messages, settings and every uploaded file. Sign-in details are never touched.
  admin.post('/backups/restore', ownerOnly, express.raw({ type: ['application/zip', 'application/octet-stream', 'application/x-zip-compressed'], limit: `${Math.min(maxVideoMb, 1000)}mb` }), async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Choose a backup zip to restore.' })
    try {
      const r = await restoreBackup(req.body, { kv, dataDir })
      await Promise.all([store.init(), media.init(), snapshots.init(), enquiries.init(), endorsements.init(), subscribers.init(), insights.init(), settings.init()])
      backups.schedule()
      res.json({ ok: true, ...r })
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.status ? e.message : 'The backup could not be restored.' })
    }
  })
  admin.get('/backups/file/:name', ownerOnly, (req, res) => {
    const p = backups.path(req.params.name)
    if (!p || !existsSync(p)) return res.status(404).json({ error: 'Not found.' })
    res.download(p)
  })

  admin.use((_req, res) => res.status(404).json({ error: 'Not found.' }))
  app.use('/api/admin', admin)
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }))

  /* ---------- the website ---------- */
  const portfolioNow = () => getPublished()?.content?.portfolio ?? null
  let tplCache = null
  const template = async () => {
    if (!tplCache) tplCache = await readFile(join(distDir, 'index.html'), 'utf8')
    return tplCache
  }
  const fallbackCsp = async () => buildCsp({})

  /** The automatic share preview card for a page. Drawn once per published version and kept in memory. */
  const cardCache = new Map()
  const filePath = (src) => {
    const roots = [['/uploads/', media.uploads], ['/images/', join(distDir, 'images')]]
    for (const [prefix, root] of roots) {
      if (!String(src).startsWith(prefix)) continue
      const full = resolve(root, decodeURIComponent(String(src).slice(prefix.length).split('?')[0]))
      if (full.startsWith(resolve(root) + sep)) return full
    }
    return ''
  }
  app.get(/^\/og\/([\w%.-]{1,160})\.png$/, async (req, res) => {
    try {
      const pub = getPublished()
      const c = pub?.content
      if (!c) return res.status(404).end()
      const key = decodeURIComponent(req.params[0])
      const p = c.portfolio
      const host = (p.site?.url ? new URL(p.site.url).host : req.hostname) || ''
      const name = p.profile?.preferredName || p.profile?.fullName || ''
      let card
      let m
      if (key === 'home') card = { title: p.profile?.fullName || p.seo?.title || '', kicker: 'Portfolio', subtitle: p.profile?.title || p.seo?.description || '', src: p.profile?.profilePhoto?.src }
      else if ((m = /^work-(.+)$/.exec(key))) {
        const x = (c.projects ?? []).find((q) => q.id === m[1] && q.hidden !== true)
        if (x) card = { title: x.title, kicker: x.caseStudy ? 'Case study' : x.category || 'Project', subtitle: x.description || x.client, src: x.thumbnail?.src }
      } else if ((m = /^note-(.+)$/.exec(key))) {
        const n = (c.notes ?? []).find((q) => q.slug === m[1] && q.hidden !== true && q.title)
        if (n) card = { title: n.title, kicker: 'Note', subtitle: n.summary, src: n.cover?.src }
      }
      if (!card) return res.status(404).end()
      const stamp = `${key}|${pub.rev}|${host}`
      let png = cardCache.get(stamp)
      if (!png) {
        const file = card.src ? filePath(card.src) : ''
        png = await renderCard({ title: card.title, kicker: card.kicker, subtitle: card.subtitle, name, host, image: file ? await readPicture(file) : null })
        cardCache.set(stamp, png)
        if (cardCache.size > 100) cardCache.delete(cardCache.keys().next().value)
      }
      res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' }).send(png)
    } catch (e) {
      console.error('Preview card failed:', e.message)
      res.status(500).end()
    }
  })

  app.get('/robots.txt', async (_req, res) => {
    const p = portfolioNow()
    if (p) return res.type('text/plain').send(buildRobots(p))
    res.type('text/plain').send(existsSync(join(distDir, 'robots.txt')) ? await readFile(join(distDir, 'robots.txt'), 'utf8') : 'User-agent: *\nDisallow: /admin\n')
  })
  app.get('/sitemap.xml', async (_req, res) => {
    const p = portfolioNow()
    const xml = p ? buildFullSitemap(getPublished().content) : existsSync(join(distDir, 'sitemap.xml')) ? await readFile(join(distDir, 'sitemap.xml'), 'utf8') : ''
    if (xml) res.type('application/xml').send(xml)
    else res.status(404).end()
  })

  // Names follow the published settings; colours come from the manifest the build wrote from the design tokens.
  app.get('/manifest.webmanifest', async (_req, res) => {
    let built = {}
    try { built = JSON.parse(await readFile(join(distDir, 'manifest.webmanifest'), 'utf8')) } catch { /* not built yet */ }
    const p = portfolioNow()
    const manifest = p ? buildManifest(p, { theme: built.theme_color, background: built.background_color }) : built
    if (!p && !Object.keys(built).length) return res.status(404).end()
    res.set('Cache-Control', 'no-cache').type('application/manifest+json').send(JSON.stringify(manifest))
  })

  if (existsSync(distDir)) {
    app.use(express.static(distDir, {
      index: false, dotfiles: 'deny',
      setHeaders: (res, path) => {
        if (path.includes(`${join(distDir, 'assets')}`)) res.set('Cache-Control', 'public, max-age=31536000, immutable')
        // Home-screen icons keep their names, so a week is long enough to save requests and short enough to pick up a new icon.
        else if (/(^|[\\/])(apple-touch-icon|icon-\d+|icon-maskable-\d+)\.png$/.test(path)) res.set('Cache-Control', 'public, max-age=604800')
      },
    }))
    app.get(/^(?!\/(api|uploads)\/).*/, async (req, res) => {
      try {
        const pub = getPublished()
        const c = pub?.content ?? null
        const p = c?.portfolio ?? null
        const isAdmin = req.path === '/admin' || req.path.startsWith('/admin/')
        const owner = !!auth.check(parseCookies(req.headers.cookie)[COOKIE])
        let status = 200
        let headP = p
        const noindex = []
        if (p && !isAdmin) {
          const seo = pageSeo(c, req.path)
          if (seo?.missing) status = 404
          else if (seo) headP = withSeo(p, seo)
          const m = /^\/for\/([^/]+)\/?$/.exec(req.path)
          if (m) {
            noindex.push('application')
            const a = (c.applications ?? []).find((x) => x.slug === decodeURIComponent(m[1]))
            if (!a || a.enabled === false || (a.expiresAt && Date.parse(a.expiresAt) + 864e5 < Date.now())) status = 404
          } else if (req.path !== '/' && !seo && !/^\/(go|feed\.xml)/.test(req.path)) status = 404
          if (p.maintenance?.enabled && !owner && p.maintenance.status503) status = 503
        }
        let html = headP ? injectHead(await template(), headP) : await template()
        if (noindex.length) html = html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow" />')
        if (owner) html = html.replace('</head>', '<meta name="sam-owner" content="1" /></head>')
        // Ship the published content inside the page so the site can render without a second request.
        if (pub && !isAdmin) {
          const json = JSON.stringify(publicView(pub.content)).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '')
          html = html.replace('</head>', `<script id="sam-content" type="application/json">${json}</script></head>`)
        }
        res.set('Content-Security-Policy', p ? buildCsp(p) : await fallbackCsp())
        if (isAdmin || noindex.length) res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' })
        else res.set('Cache-Control', 'no-cache')
        res.status(status).type('html').send(html)
      } catch {
        res.status(500).send('Site is not built. Run npm run build.')
      }
    })
  } else {
    app.get('/', (_req, res) => res.type('text').send('API is running. Build the site with npm run build, or use npm run dev for development.'))
  }

  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'That request is too large.' })
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'Invalid JSON.' })
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  })

  return { app, store, auth, media, dataDir, kv, enquiries, endorsements, subscribers, insights, settings, backups, snapshots, sendDigest, close: async () => { backups.stop(); clearInterval(pruneTimer); clearInterval(digestTimer); await kv.close() } }
}

export async function start(env = process.env) {
  const { app, auth, dataDir } = await createApp({ env })
  const port = Number(env.PORT ?? 8787)
  const host = env.HOST ?? (env.PORT ? '0.0.0.0' : '127.0.0.1')
  const storage = env.DATABASE_URL ? 'Postgres database' : `files in ${dataDir}`
  console.log(`Storing your content in: ${storage}`)
  if (!(await auth.configured())) {
    console.warn('\nNo admin account yet. Create one with:  npm run admin:setup\n')
  }
  const server = app.listen(port, host, () => console.log(`Portfolio server on http://${host}:${port}  (data: ${dataDir})`))
  server.requestTimeout = 0 // big video uploads on a slow connection must not be cut off
  server.headersTimeout = 60000
  const stop = () => server.close(() => process.exit(0))
  process.on('SIGTERM', stop)
  process.on('SIGINT', stop)
  return server
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  start().catch((e) => { console.error(e.message); process.exit(1) })
}
