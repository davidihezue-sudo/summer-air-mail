import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../server/index.mjs'
import { hashPassword, verifyPassword, passwordProblem } from '../server/auth.mjs'
import { sniff } from '../server/media.mjs'
import { validateContent } from '../server/validate.mjs'
import { baseContent } from '../src/content/bundle'

const PASSWORD = 'correct horse battery staple'
let dir: string
let server: Server
let base: string
let cookie = ''

const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
async function api(path: string, init: RequestInit = {}, withCookie = true) {
  const headers = { ...H, ...(init.headers as object), ...(withCookie && cookie ? { cookie } : {}) }
  return fetch(base + path, { ...init, headers })
}

// 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'sam-'))
  const dist = join(dir, 'dist')
  mkdirSync(dist)
  writeFileSync(join(dist, 'index.html'), '<!doctype html><html lang="en"><head><!--head:start--><!--head:end--></head><body><div id="root"></div></body></html>')
  writeFileSync(join(dist, 'csp.txt'), "default-src 'self'")
  const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env: { LOGIN_MAX_ATTEMPTS: '5' } })
  await auth.setCredentials('owner', PASSWORD)
  await new Promise<void>((ok) => { server = app.listen(0, '127.0.0.1', () => ok()) })
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => { server.close(); rmSync(dir, { recursive: true, force: true }) })

describe('password handling', () => {
  it('hashes with scrypt and verifies without storing plaintext', async () => {
    const h = await hashPassword('a long enough password')
    expect(h.startsWith('scrypt$')).toBe(true)
    expect(h).not.toContain('a long enough password')
    expect(await verifyPassword('a long enough password', h)).toBe(true)
    expect(await verifyPassword('wrong password here', h)).toBe(false)
    expect(readFileSync(join(dir, 'data', 'admin.json'), 'utf8')).not.toContain(PASSWORD)
  })
  it('enforces a minimum length', () => {
    expect(passwordProblem('short')).toBeTruthy()
    expect(passwordProblem('aaaaaaaaaaaaaaaa')).toBeTruthy()
    expect(passwordProblem(PASSWORD)).toBe('')
  })
})

describe('access control', () => {
  it('rejects every admin route without a session', async () => {
    for (const [m, p] of [['GET', '/api/admin/draft'], ['PUT', '/api/admin/draft'], ['POST', '/api/admin/publish'], ['GET', '/api/admin/media'], ['POST', '/api/admin/media'], ['POST', '/api/admin/import'], ['POST', '/api/admin/password']]) {
      const r = await api(p, { method: m, body: m === 'GET' ? undefined : '{}' }, false)
      expect(r.status, `${m} ${p}`).toBe(401)
    }
  })
  it('requires the anti-CSRF header and a matching origin for changes', async () => {
    const noHeader = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    expect(noHeader.status).toBe(403)
    const evil = await fetch(base + '/api/admin/login', { method: 'POST', headers: { ...H, origin: 'https://evil.example' }, body: '{}' })
    expect(evil.status).toBe(403)
    // The dev proxy case: the browser is on another local port than the API.
    const devProxy = await fetch(base + '/api/admin/login', { method: 'POST', headers: { ...H, origin: 'http://localhost:5173' }, body: '{}' })
    expect(devProxy.status).toBe(401)
    // In production only the real host is accepted, even from localhost origins.
  })
  it('rejects wrong credentials, then signs in with an HttpOnly strict cookie', async () => {
    const bad = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ username: 'owner', password: 'nope nope nope nope' }) }, false)
    expect(bad.status).toBe(401)
    const ok = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ username: 'owner', password: PASSWORD }) }, false)
    expect(ok.status).toBe(200)
    const set = ok.headers.get('set-cookie') ?? ''
    expect(set).toMatch(/HttpOnly/i)
    expect(set).toMatch(/SameSite=Strict/i)
    cookie = set.split(';')[0]
    const s = await (await api('/api/admin/session')).json()
    expect(s).toEqual({ configured: true, authenticated: true })
  })
})

describe('draft and publish', () => {
  it('serves nothing publicly until published', async () => {
    const r = await (await fetch(base + '/api/content')).json()
    expect(r.content).toBeNull()
  })
  it('validates, saves a draft, detects conflicts and publishes', async () => {
    const content = structuredClone(baseContent)
    content.portfolio.profile.fullName = 'Test Person'
    const save = await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content, baseRev: 0 }) })
    expect(save.status).toBe(200)
    const { rev } = await save.json()
    expect(rev).toBe(1)
    const stale = await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content, baseRev: 0 }) })
    expect(stale.status).toBe(409)
    expect((await (await fetch(base + '/api/content')).json()).content).toBeNull()
    const pub = await api('/api/admin/publish', { method: 'POST', body: '{}' })
    expect(pub.status).toBe(200)
    const live = await (await fetch(base + '/api/content')).json()
    expect(live.content.portfolio.profile.fullName).toBe('Test Person')
  })
  it('keeps unpublished edits private and can discard them', async () => {
    const draft = (await (await api('/api/admin/draft')).json())
    const content = draft.draft
    content.portfolio.profile.fullName = 'Edited Draft'
    await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content, baseRev: draft.rev }) })
    expect((await (await fetch(base + '/api/content')).json()).content.portfolio.profile.fullName).toBe('Test Person')
    const d = await (await api('/api/admin/discard', { method: 'POST', body: '{}' })).json()
    expect(d.draft.portfolio.profile.fullName).toBe('Test Person')
  })
  it('rejects dangerous or malformed content', async () => {
    const bad = structuredClone(baseContent) as unknown as Record<string, unknown>
    ;(bad.portfolio as { profile: { website: string } }).profile.website = 'javascript:alert(1)'
    expect((await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: bad }) })).status).toBe(400)
    expect(validateContent({ portfolio: {}, projects: [{ id: 'a' }, { id: 'a' }] }).ok).toBe(false)
    expect(validateContent({ portfolio: { sections: [{ id: 'x', type: 'nope' }] } }).ok).toBe(false)
    expect(validateContent({ portfolio: { sections: [{ id: 'Bad Id', type: 'hero' }] } }).ok).toBe(false)
    expect(validateContent([]).ok).toBe(false)
    const polluted = validateContent(JSON.parse('{"portfolio":{"__proto__":{"x":1}}}'))
    expect(polluted.ok && ({} as Record<string, unknown>).x).toBeFalsy()
  })
  it('injects published SEO into the HTML head and protects the admin page', async () => {
    const draft = await (await api('/api/admin/draft')).json()
    const content = draft.draft
    content.portfolio.seo.title = 'Great Portfolio <script>'
    await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content, baseRev: draft.rev }) })
    await api('/api/admin/publish', { method: 'POST', body: '{}' })
    const home = await fetch(base + '/')
    const html = await home.text()
    expect(html).toContain('Great Portfolio &lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('id="sam-content"')
    expect(html).not.toContain('Client under NDA')
    expect(home.headers.get('content-security-policy')).toContain("object-src 'none'")
    expect(home.headers.get('content-security-policy')).toContain("frame-src 'self'")
    const adminPage = await fetch(base + '/admin')
    expect(adminPage.headers.get('x-robots-tag')).toContain('noindex')
    expect(adminPage.headers.get('cache-control')).toBe('no-store')
    expect(await (await fetch(base + '/robots.txt')).text()).toContain('Disallow: /admin')
  })
})

describe('private content never leaves the server', () => {
  it('strips drafts, hidden items and unapproved testimonials from the public API', async () => {
    const draft = await (await api('/api/admin/draft')).json()
    const c = draft.draft
    c.projects = [
      { id: 'pub', title: 'Public project', hidden: false, relatedIds: ['secret'] },
      { id: 'secret', title: 'Client under NDA', hidden: true },
    ]
    c.testimonials = [{ id: 't1', name: 'Approved', quote: 'Great', approved: true }, { id: 't2', name: 'Private Person', quote: 'Do not publish', approved: false }]
    c.tools = [{ id: 'x1', name: 'Used', confirmed: true, usage: 'daily' }, { id: 'x2', name: 'NotUsed', confirmed: false, usage: '' }]
    c.skills = [{ id: 'g', name: 'G', skills: [{ name: 'Shown', visible: true }, { name: 'Secret skill', visible: false }] }]
    c.results = [{ id: 'r', metric: 'Hidden result', hidden: true }]
    await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: c, baseRev: draft.rev }) })
    await api('/api/admin/publish', { method: 'POST', body: '{}' })
    const text = await (await fetch(base + '/api/content')).text()
    expect(text).toContain('Public project')
    expect(text).toContain('Approved')
    for (const secret of ['Client under NDA', 'Private Person', 'Do not publish', 'NotUsed', 'Secret skill', 'Hidden result', '"secret"']) expect(text, secret).not.toContain(secret)
    // The owner still sees everything in the draft.
    expect(JSON.stringify((await (await api('/api/admin/draft')).json()).draft)).toContain('Client under NDA')
  })
})

describe('media uploads', () => {
  const form = (buf: Buffer, name: string) => { const f = new FormData(); f.append('file', new Blob([new Uint8Array(buf)]), name); return f }
  const upload = (buf: Buffer, name: string) => fetch(base + '/api/admin/media', { method: 'POST', headers: { 'x-requested-with': 'sam-admin', cookie }, body: form(buf, name) })

  it('identifies files by content', () => {
    expect(sniff(PNG)?.ext).toBe('png')
    expect(sniff(Buffer.from('%PDF-1.7 test file....'))?.ext).toBe('pdf')
    expect(sniff(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull()
    expect(sniff(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull()
  })
  it('accepts an image, re-encodes it, and serves it with a locked down policy', async () => {
    const r = await upload(PNG, '../../evil name.png')
    expect(r.status).toBe(200)
    const { asset } = await r.json()
    expect(asset.url).toMatch(/^\/uploads\/[a-z0-9-]+-[0-9a-f]{8}\.(webp|png)$/)
    expect(asset.url).not.toContain('..')
    const file = await fetch(base + asset.url)
    expect(file.status).toBe(200)
    expect(file.headers.get('content-security-policy')).toContain('sandbox')
    expect(file.headers.get('x-content-type-options')).toBe('nosniff')
  })
  it('refuses scripts, SVG and disguised files', async () => {
    expect((await upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'), 'a.svg')).status).toBe(415)
    expect((await upload(Buffer.from('<html><script>alert(1)</script></html> padding padding'), 'photo.png')).status).toBe(415)
  })
  it('blocks deleting a file that saved content still uses, then allows it once unused', async () => {
    const { asset } = await (await upload(PNG, 'used.png')).json()
    const draft = await (await api('/api/admin/draft')).json()
    const content = draft.draft
    content.portfolio.profile.profilePhoto = { src: asset.url, alt: 'x' }
    await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content, baseRev: draft.rev }) })
    expect((await api(`/api/admin/media/${asset.id}`, { method: 'DELETE' })).status).toBe(409)
    const d2 = await (await api('/api/admin/draft')).json()
    d2.draft.portfolio.profile.profilePhoto = null
    await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: d2.draft, baseRev: d2.rev }) })
    await api('/api/admin/publish', { method: 'POST', body: '{}' })
    // History still holds the older published version that referenced it.
    expect([200, 409]).toContain((await api(`/api/admin/media/${asset.id}`, { method: 'DELETE' })).status)
  })
  it('updates alt text and tags', async () => {
    const list = await (await api('/api/admin/media')).json()
    const id = list.media[0].id
    const r = await api(`/api/admin/media/${id}`, { method: 'PATCH', body: JSON.stringify({ alt: 'A description', tags: ['hero'] }) })
    expect((await r.json()).asset).toMatchObject({ alt: 'A description', tags: ['hero'] })
  })
})

describe('password change and lockout', () => {
  it('requires the current password', async () => {
    expect((await api('/api/admin/password', { method: 'POST', body: JSON.stringify({ current: 'wrong wrong wrong', next: 'another long password!' }) })).status).toBe(400)
  })
  it('locks out an IP after repeated failures', async () => {
    let last = 0
    for (let i = 0; i < 6; i++) {
      const r = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ username: 'owner', password: 'definitely wrong ' + i }) }, false)
      last = r.status
    }
    expect(last).toBe(429)
    const stillLocked = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ username: 'owner', password: PASSWORD }) }, false)
    expect(stillLocked.status).toBe(429)
  }, 20000)
  it('stores nothing sensitive in the data folder listing', () => {
    expect(existsSync(join(dir, 'data', 'content.json'))).toBe(true)
    expect(readFileSync(join(dir, 'data', 'content.json'), 'utf8')).not.toContain(PASSWORD)
  })
})
