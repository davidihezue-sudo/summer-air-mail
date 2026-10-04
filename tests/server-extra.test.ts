/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../server/index.mjs'
import { sign } from '../server/s3.mjs'
import { createInsights, toCsv } from '../server/records.mjs'
import { parseContact, createLimiter } from '../server/routes.mjs'
import { buildFeed, pageSeo } from '../shared/head.mjs'
import { baseContent } from '../src/content/bundle'

const PASSWORD = 'correct horse battery staple'
const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }

describe('AWS signature v4 (AWS documented example)', () => {
  it('reproduces the published canonical request hash and signature', () => {
    const empty = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    const r = sign({ method: 'GET', path: '/test.txt', headers: { host: 'examplebucket.s3.amazonaws.com', range: 'bytes=0-9', 'x-amz-content-sha256': empty }, region: 'us-east-1', accessKey: 'AKIAIOSFODNN7EXAMPLE', secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', date: '20130524T000000Z', payloadHash: empty })
    expect(r.canonicalHash).toBe('7344ae5b7ee6c3e7e6b0fe0640412a37625d1fbfff95c48bbb2dc43964946972')
    expect(r.signature).toBe('f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41')
  })
})

describe('pure helpers', () => {
  it('validates contact posts and flags the honeypot', () => {
    expect(parseContact({ name: '', email: 'a@b.co', message: 'hello there friend' }).error).toBeTruthy()
    expect(parseContact({ name: 'A', email: 'nope', message: 'hello there friend' }).error).toBeTruthy()
    expect(parseContact({ name: 'A', email: 'a@b.co', message: 'short' }).error).toBeTruthy()
    const ok = parseContact({ name: 'A', email: 'a@b.co', message: 'hello there friend', website: 'x', elapsed: 5000 })
    expect(ok.honeypot).toBe(true)
    expect(ok.value?.name).toBe('A')
  })
  it('rate limits per key and window', () => {
    const l = createLimiter({ max: 2, windowMs: 1000 })
    expect([l('a', 0), l('a', 1), l('a', 2), l('b', 2), l('a', 1500)]).toEqual([true, true, false, true, true])
  })
  it('neutralises spreadsheet formulas in CSV exports', () => {
    expect(toCsv([{ a: '=SUM(1)', b: 'x,"y"' }], ['a', 'b'])).toContain("'=SUM(1)")
    expect(toCsv([{ a: 'x', b: 'x,"y"' }], ['a', 'b'])).toContain('"x,""y"""')
  })
  it('insights count unique visitors per day without storing who they are', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sam-i-'))
    const i = createInsights(dir)
    await i.init()
    const t = new Date('2026-03-01T10:00:00Z')
    await i.record({ type: 'view', path: '/', ref: '', ip: '1.1.1.1', ua: 'a' }, t)
    await i.record({ type: 'view', path: '/', ref: '', ip: '1.1.1.1', ua: 'a' }, t)
    await i.record({ type: 'view', path: '/work/x', ref: 'news.example', ip: '2.2.2.2', ua: 'b' }, t)
    await i.record({ type: 'project', name: 'Spring launch' }, t)
    expect(await i.record({ type: 'bogus' }, t)).toBe(false)
    const s = i.summary(7, t)
    expect(s.views).toBe(3)
    expect(s.visitors).toBe(2)
    expect((s.events as Record<string, number>).project).toBe(1)
    await i.flush()
    const raw = JSON.stringify(i.days())
    expect(raw).not.toContain('1.1.1.1')
    expect(await i.prune(1, new Date('2026-04-01T00:00:00Z'))).toBe(1)
    rmSync(dir, { recursive: true, force: true })
  })
  it('builds a feed and per page SEO from published notes and projects', () => {
    const c: any = structuredClone(baseContent)
    c.portfolio.site.url = 'https://example.com'
    c.portfolio.profile.fullName = 'Ada'
    c.notes = [{ id: 'n1', slug: 'hello', title: 'Hello & welcome', date: '2026-01-02', summary: 'S', seoTitle: '', seoDescription: '', cover: null, tags: [], hidden: false }, { id: 'n2', slug: 'draft', title: 'Draft', date: '2026-01-03', hidden: true }]
    c.projects = [{ id: 'p1', title: 'Launch', description: 'Did a thing', hidden: false, thumbnail: { src: '/uploads/a.webp' } }]
    const feed = buildFeed(c)
    expect(feed).toContain('Hello &amp; welcome')
    expect(feed).not.toContain('Draft')
    expect(pageSeo(c, '/notes/hello')).toMatchObject({ canonical: 'https://example.com/notes/hello' })
    expect(pageSeo(c, '/notes/draft')).toEqual({ missing: true })
    expect(pageSeo(c, '/work/p1')).toMatchObject({ image: '/uploads/a.webp' })
    expect(pageSeo(c, '/')).toBeNull()
  })
})

const backends: [string, string | undefined][] = [['files', undefined]]
if (process.env.TEST_DATABASE_URL) backends.push(['postgres', process.env.TEST_DATABASE_URL])

describe.each(backends)('server features on %s', (_name, dbUrl) => {
  let dir: string, server: Server, base: string, cookie = '', ctl: any
  const sent: any[] = []
  const hooks: any[] = []
  const api = (path: string, init: RequestInit = {}, ck = cookie) => fetch(base + path, { ...init, headers: { ...H, ...(init.headers as object), ...(ck ? { cookie: ck } : {}) } })
  const login = async (username: string, password = PASSWORD) => {
    const r = await fetch(base + '/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ username, password }) })
    return r.ok ? (r.headers.get('set-cookie') ?? '').split(';')[0] : ''
  }
  const content = () => {
    const c: any = structuredClone(baseContent)
    c.portfolio.site.url = 'https://example.com'
    c.portfolio.contact.delivery = 'both'
    c.portfolio.newsletter = { ...c.portfolio.newsletter, enabled: true, mode: 'collect' }
    c.portfolio.insights.enabled = true
    c.applications = [{ id: 'a1', slug: 'acme-x7', enabled: true, expiresAt: '', company: 'Acme', hero: { headline: 'Hi Acme' } }, { id: 'a2', slug: 'old', enabled: true, expiresAt: '2001-01-01' }]
    c.shortLinks = [{ id: 's1', slug: 'cv', enabled: true, label: '', target: { type: 'section', value: 'work' } }]
    c.notes = [{ id: 'n1', slug: 'hello', title: 'Hello', date: '2026-01-02', summary: 'S', body: 'B', cover: null, tags: [], seoTitle: '', seoDescription: '', hidden: false }]
    c.projects = [{ ...c.projects[0], id: 'p1', title: 'Launch one', description: 'Description here', hidden: false }]
    return c
  }

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'sam-x-'))
    const dist = join(dir, 'dist'); mkdirSync(dist)
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html lang="en"><head><meta name="robots" content="index" /><!--head:start--><!--head:end--></head><body></body></html>')
    const fakeFetch = async (url: string, init: any) => { hooks.push({ url, init }); return new Response('', { status: 200 }) }
    const transportFactory = () => ({ sendMail: async (m: any) => { sent.push(m) } })
    const env: Record<string, string> = { SMTP_HOST: 'smtp.test', SMTP_USER: 'u', SMTP_PASS: 'p', ALERT_WEBHOOK_URL: 'https://hooks.example/x', S3_ENDPOINT: 'https://s3.example.test', S3_BUCKET: 'bk', S3_ACCESS_KEY: 'AKTEST', S3_SECRET_KEY: 'SKTEST', S3_REGION: 'us-east-1', ...(dbUrl ? { DATABASE_URL: dbUrl } : {}) }
    if (dbUrl) {
      const pg = (await import('pg' as string)).default
      const pool = new pg.Pool({ connectionString: dbUrl }); await pool.query('DROP TABLE IF EXISTS sam_kv'); await pool.end()
    }
    const app = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env, deps: { transportFactory, fetchImpl: fakeFetch } })
    ctl = app
    await app.auth.setCredentials('owner', PASSWORD)
    await new Promise<void>((ok) => { server = app.app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    cookie = await login('owner')
    await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings: { notifyEmail: 'me@example.com' } }) })
    const put = await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: content() }) })
    expect(put.status).toBe(200)
    expect((await api('/api/admin/publish', { method: 'POST', body: '{}' })).status).toBe(200)
  }, 30000)
  afterAll(async () => { server.close(); await ctl.close(); rmSync(dir, { recursive: true, force: true }) })

  it('reports storage and role in the session', async () => {
    const s = await (await api('/api/admin/session')).json()
    expect(s).toMatchObject({ role: 'owner', storage: dbUrl ? 'postgres' : 'file', canPublish: true })
  })

  it('keeps applications, short links and looks out of the public JSON', async () => {
    const r = await (await fetch(base + '/api/content')).json()
    expect(r.content.applications).toEqual([])
    expect(r.content.shortLinks).toEqual([])
    expect(JSON.stringify(r)).not.toContain('acme-x7')
  })

  it('serves an application only to someone with the slug, never expired, never indexed', async () => {
    const ok = await fetch(base + '/api/application/acme-x7')
    expect(ok.status).toBe(200)
    expect(ok.headers.get('x-robots-tag')).toContain('noindex')
    expect((await ok.json()).application.company).toBe('Acme')
    expect((await fetch(base + '/api/application/old')).status).toBe(404)
    expect((await fetch(base + '/api/application/nope')).status).toBe(404)
    const page = await fetch(base + '/for/acme-x7')
    expect(page.status).toBe(200)
    expect(await page.text()).toContain('content="noindex, nofollow"')
    expect((await fetch(base + '/for/old')).status).toBe(404)
  })

  it('redirects short links, and refuses unsafe targets and duplicate addresses when saving', async () => {
    const r = await fetch(base + '/go/cv', { redirect: 'manual' })
    expect(r.status).toBe(302)
    expect(r.headers.get('location')).toBe('/#work')
    const bad = content(); bad.shortLinks.push({ id: 's2', slug: 'bad', enabled: true, label: '', target: { type: 'url', value: 'ftp://example.com/x' } })
    expect((await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: bad }) })).status).toBe(400)
    const dup = content(); dup.notes.push({ ...dup.notes[0], id: 'n9' })
    expect((await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: dup }) })).status).toBe(400)
    expect((await fetch(base + '/go/none', { redirect: 'manual' })).status).toBe(404)
  })

  it('serves a feed, a sitemap with notes, per page share tags and real 404 statuses', async () => {
    expect(await (await fetch(base + '/feed.xml')).text()).toContain('<title>Hello</title>')
    expect(await (await fetch(base + '/sitemap.xml')).text()).toContain('/notes/hello')
    const w = await fetch(base + '/work/p1')
    expect(w.status).toBe(200)
    expect(await w.text()).toContain('og:title" content="Launch one')
    expect((await fetch(base + '/work/zzz')).status).toBe(404)
    expect((await fetch(base + '/notes/nope')).status).toBe(404)
    expect((await fetch(base + '/some/random/path')).status).toBe(404)
    expect((await fetch(base + '/')).status).toBe(200)
  })

  it('accepts a contact message, stores it, and alerts by email and webhook', async () => {
    const body = { name: 'Sam', email: 'sam@example.com', type: 'Freelance project', message: 'Hello, I would like to talk about a project.', elapsed: 6000 }
    const r = await fetch(base + '/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    expect(r.status).toBe(200)
    const inbox = await (await api('/api/admin/enquiries')).json()
    expect(inbox.items[0]).toMatchObject({ name: 'Sam', read: false })
    expect(inbox.unread).toBe(1)
    await new Promise((ok) => setTimeout(ok, 50))
    expect(sent[0]).toMatchObject({ to: 'me@example.com', replyTo: 'sam@example.com' })
    expect(hooks.length).toBeGreaterThan(0)
    expect(await (await api('/api/admin/enquiries.csv')).text()).toContain('sam@example.com')
    await api(`/api/admin/enquiries/${inbox.items[0].id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) })
    expect((await (await api('/api/admin/enquiries')).json()).unread).toBe(0)
  })

  it('treats bots and rushed posts without storing them, and rate limits', async () => {
    const post = (b: object) => fetch(base + '/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })
    const good = { name: 'Bot', email: 'b@example.com', message: 'Buy my pills now please', elapsed: 6000 }
    const before = (await (await api('/api/admin/enquiries')).json()).items.length
    expect((await post({ ...good, website: 'http://spam' })).status).toBe(200)
    expect((await post({ ...good, elapsed: 100 })).status).toBe(400)
    expect((await (await api('/api/admin/enquiries')).json()).items.length).toBe(before)
    let last = 200
    for (let i = 0; i < 6; i++) last = (await post(good)).status
    expect(last).toBe(429)
  })

  it('collects newsletter signups with consent, once per address', async () => {
    const post = (b: object) => fetch(base + '/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })
    expect((await post({ email: 'a@example.com', consent: false, elapsed: 5000 })).status).toBe(400)
    expect((await post({ email: 'a@example.com', consent: true, elapsed: 5000 })).status).toBe(200)
    expect((await post({ email: 'A@example.com', consent: true, elapsed: 5000 })).status).toBe(200)
    const l = await (await api('/api/admin/subscribers')).json()
    expect(l.items).toHaveLength(1)
    expect(await (await api('/api/admin/subscribers.csv')).text()).toContain('a@example.com')
  })

  it('records insights only when enabled and honours Do Not Track', async () => {
    const track = (b: object, h: object = {}) => fetch(base + '/api/track', { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b) })
    await track({ type: 'view', path: '/' })
    await track({ type: 'view', path: '/' }, { DNT: '1' })
    await track({ type: 'project', name: 'Launch one' })
    const s = await (await api('/api/admin/insights?range=7')).json()
    expect(s.views).toBe(1)
    expect(s.items.project['Launch one']).toBe(1)
  })

  it('keeps per item history and restores a previous version into the draft', async () => {
    const draft = (await (await api('/api/admin/draft')).json()).draft
    draft.projects[0].title = 'Renamed'
    expect((await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: draft }) })).status).toBe(200)
    const h = await (await api('/api/admin/history/item/projects/p1')).json()
    expect(h.versions[0].title).toBe('Launch one')
    const r = await (await api('/api/admin/history/item/projects/p1/restore', { method: 'POST', body: JSON.stringify({ index: 0 }) })).json()
    expect(r.draft.projects[0].title).toBe('Launch one')
  })

  it('enforces roles on the server', async () => {
    expect((await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ username: 'edi', password: PASSWORD, role: 'editor' }) })).status).toBe(200)
    expect((await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ username: 'vie', password: PASSWORD, role: 'viewer' }) })).status).toBe(200)
    const ed = await login('edi'), vi = await login('vie')
    expect(ed && vi).toBeTruthy()
    const draft = (await (await api('/api/admin/draft', {}, ed)).json()).draft
    expect((await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: draft }) }, ed)).status).toBe(200)
    expect((await api('/api/admin/publish', { method: 'POST', body: '{}' }, ed)).status).toBe(403)
    expect((await api('/api/admin/users', {}, ed)).status).toBe(403)
    expect((await api('/api/admin/settings', {}, ed)).status).toBe(403)
    expect((await api('/api/admin/backups', {}, ed)).status).toBe(403)
    expect((await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: draft }) }, vi)).status).toBe(403)
    expect((await api('/api/admin/draft', {}, vi)).status).toBe(200)
    await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings: { editorsCanPublish: true } }) })
    expect((await api('/api/admin/publish', { method: 'POST', body: '{}' }, ed)).status).toBe(200)
    expect((await api('/api/admin/users/edi', { method: 'DELETE' })).status).toBe(200)
    expect((await api('/api/admin/draft', {}, ed)).status).toBe(401)
  })

  it('makes a backup zip on demand and on schedule, without credentials in it', async () => {
    const dl = await api('/api/admin/backups/download')
    expect(dl.status).toBe(200)
    const buf = Buffer.from(await dl.arrayBuffer())
    expect(buf.subarray(0, 2).toString()).toBe('PK')
    const text = buf.toString('latin1')
    expect(text).toContain('content.json')
    expect(text).not.toContain('admin.json')
    expect(text).not.toContain('users.json')
    await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings: { backups: { s3: true, keep: 3 } } }) })
    const run = await (await api('/api/admin/backups/run', { method: 'POST', body: '{}' })).json()
    expect(run.result.ok).toBe(true)
    expect(run.result.uploaded).toBe(true)
    const up = hooks.find((h) => String(h.url).startsWith('https://s3.example.test/bk/backups/backup-'))
    expect(up.init.method).toBe('PUT')
    expect(up.init.headers.authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AKTEST\/\d{8}\/us-east-1\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/)
    expect(up.init.headers['x-amz-content-sha256']).toMatch(/^[0-9a-f]{64}$/)
    expect(existsSync(join(dir, 'data', 'backups'))).toBe(true)
    expect(readdirSync(join(dir, 'data', 'backups')).length).toBe(1)
  })

  it('shows a maintenance page status when switched on, except for the owner', async () => {
    const d = (await (await api('/api/admin/draft')).json()).draft
    d.portfolio.maintenance.enabled = true
    d.portfolio.maintenance.status503 = true
    await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: d }) })
    await api('/api/admin/publish', { method: 'POST', body: '{}' })
    expect((await fetch(base + '/')).status).toBe(503)
    const r = await fetch(base + '/', { headers: { cookie } })
    expect(r.status).toBe(200)
    expect(await r.text()).toContain('sam-owner')
  })
})
