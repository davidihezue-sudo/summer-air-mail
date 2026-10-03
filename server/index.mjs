import express from 'express'
import compression from 'compression'
import multer from 'multer'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStore } from './store.mjs'
import { createAuth } from './auth.mjs'
import { createMedia } from './media.mjs'
import { validateContent } from './validate.mjs'
import { publicView } from './publicView.mjs'
import { buildCsp, buildRobots, buildSitemap, injectHead } from '../shared/head.mjs'

function parseCookies(header = '') {
  const out = {}
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

const COOKIE = 'sam_session'

/** @param {{ dataDir?: string, distDir?: string, env?: Record<string, string | undefined> }} [options] */
export async function createApp({ dataDir, distDir, env = process.env } = {}) {
  dataDir = resolve(dataDir ?? env.DATA_DIR ?? 'data')
  distDir = resolve(distDir ?? 'dist')
  const store = createStore(dataDir)
  const auth = createAuth({ dir: dataDir, env })
  const media = createMedia(dataDir)
  await Promise.all([store.init(), media.init()])

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

  /* ---------- public content ---------- */
  app.get('/api/content', (_req, res) => {
    const pub = store.getPublished()
    res.set('Cache-Control', 'no-cache')
    res.json({ content: publicView(pub?.content) ?? null, rev: pub?.rev ?? 0, publishedAt: pub?.publishedAt ?? null })
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
        const allowed = [`http://${req.headers.host}`, `https://${req.headers.host}`, ...(env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [])]
        if (!allowed.includes(origin)) return res.status(403).json({ error: 'Cross-origin request blocked.' })
      }
    }
    next()
  })

  const tokenOf = (req) => parseCookies(req.headers.cookie)[COOKIE]
  const requireAuth = (req, res, next) => (auth.check(tokenOf(req)) ? next() : res.status(401).json({ error: 'Please sign in.' }))

  admin.get('/session', async (req, res) => {
    res.json({ configured: await auth.configured(), authenticated: auth.check(tokenOf(req)) })
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
    res.json({ ok: true })
  })

  admin.post('/logout', (req, res) => {
    auth.logout(tokenOf(req))
    res.clearCookie(COOKIE, { path: '/' })
    res.json({ ok: true })
  })

  admin.use(requireAuth)

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

  admin.post('/publish', async (_req, res) => {
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

  admin.post('/import', async (req, res) => {
    const v = validateContent(req.body?.content)
    if (!v.ok) return res.status(400).json({ error: v.error })
    const d = await store.importDraft(v.content)
    res.json({ draft: d.content, rev: d.rev, ...store.status() })
  })

  admin.post('/password', async (req, res) => {
    const r = await auth.changePassword(String(req.body?.current ?? ''), String(req.body?.next ?? ''))
    if (!r.ok) return res.status(400).json({ error: r.error })
    res.clearCookie(COOKIE, { path: '/' })
    res.json({ ok: true })
  })

  /* ---------- media library ---------- */
  const maxMb = Number(env.MAX_UPLOAD_MB ?? 60)
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxMb * 1024 * 1024, files: 1, fields: 8 } })
  admin.get('/media', (_req, res) => res.json({ media: media.list() }))
  admin.post('/media', (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? `That file is larger than ${maxMb} MB.` : 'Upload failed.' })
      if (!req.file) return res.status(400).json({ error: 'Choose a file to upload.' })
      try {
        res.json({ asset: await media.add(req.file.buffer, req.file.originalname, req.body) })
      } catch (e) {
        res.status(e.status ?? 500).json({ error: e.status ? e.message : 'Could not process that file.' })
      }
    })
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

  admin.use((_req, res) => res.status(404).json({ error: 'Not found.' }))
  app.use('/api/admin', admin)
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }))

  /* ---------- the website ---------- */
  const portfolioNow = () => store.getPublished()?.content?.portfolio ?? null
  let tplCache = null
  const template = async () => {
    if (!tplCache) tplCache = await readFile(join(distDir, 'index.html'), 'utf8')
    return tplCache
  }
  const fallbackCsp = async () => buildCsp({})

  app.get('/robots.txt', async (_req, res) => {
    const p = portfolioNow()
    if (p) return res.type('text/plain').send(buildRobots(p))
    res.type('text/plain').send(existsSync(join(distDir, 'robots.txt')) ? await readFile(join(distDir, 'robots.txt'), 'utf8') : 'User-agent: *\nDisallow: /admin\n')
  })
  app.get('/sitemap.xml', async (_req, res) => {
    const p = portfolioNow()
    const xml = p ? buildSitemap(p) : existsSync(join(distDir, 'sitemap.xml')) ? await readFile(join(distDir, 'sitemap.xml'), 'utf8') : ''
    if (xml) res.type('application/xml').send(xml)
    else res.status(404).end()
  })

  if (existsSync(distDir)) {
    app.use(express.static(distDir, {
      index: false, dotfiles: 'deny',
      setHeaders: (res, path) => { if (path.includes(`${join(distDir, 'assets')}`)) res.set('Cache-Control', 'public, max-age=31536000, immutable') },
    }))
    app.get(/^(?!\/(api|uploads)\/).*/, async (req, res) => {
      try {
        const p = portfolioNow()
        let html = p ? injectHead(await template(), p) : await template()
        // Ship the published content inside the page so the site can render without a second request.
        const isAdminPath = req.path === '/admin' || req.path.startsWith('/admin/')
        const pub = store.getPublished()
        if (pub && !isAdminPath) {
          const json = JSON.stringify(publicView(pub.content)).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '')
          html = html.replace('</head>', `<script id="sam-content" type="application/json">${json}</script></head>`)
        }
        const isAdmin = req.path === '/admin' || req.path.startsWith('/admin/')
        res.set('Content-Security-Policy', p ? buildCsp(p) : await fallbackCsp())
        if (isAdmin) res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' })
        else res.set('Cache-Control', 'no-cache')
        res.type('html').send(html)
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

  return { app, store, auth, media, dataDir }
}

export async function start(env = process.env) {
  const { app, auth, dataDir } = await createApp({ env })
  const port = Number(env.PORT ?? 8787)
  const host = env.HOST ?? (env.PORT ? '0.0.0.0' : '127.0.0.1')
  if (!(await auth.configured())) {
    console.warn('\nNo admin account yet. Create one with:  npm run admin:setup\n')
  }
  const server = app.listen(port, host, () => console.log(`Portfolio server on http://${host}:${port}  (data: ${dataDir})`))
  const stop = () => server.close(() => process.exit(0))
  process.on('SIGTERM', stop)
  process.on('SIGINT', stop)
  return server
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  start().catch((e) => { console.error(e.message); process.exit(1) })
}
