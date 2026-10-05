/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import sharp from 'sharp'
import { createApp } from '../server/index.mjs'
import { buildMeta, ogCardUrl, pageSeo } from '../shared/head.mjs'
import { baseContent } from '../src/content/bundle'

describe('card addresses', () => {
  const site = { portfolio: { site: { url: 'https://ada.example' }, profile: { fullName: 'Ada' }, seo: { title: 'Ada | Portfolio' } }, projects: [{ id: 'p 1', title: 'P', description: 'd', thumbnail: { src: '/uploads/a.webp' } }, { id: 'p2', title: 'Q', seo: { image: 'https://cdn.example/q.png' } }], notes: [{ slug: 'hello', title: 'Hello', summary: 's' }] }
  it('uses the automatic card unless the owner chose an image, and only when the site has a public address', () => {
    expect(ogCardUrl(site.portfolio, 'home')).toBe('https://ada.example/og/home.png')
    expect(ogCardUrl({ site: { url: '' } }, 'home')).toBe('')
    expect(buildMeta(site.portfolio).image).toBe('https://ada.example/og/home.png')
    expect(buildMeta({ ...site.portfolio, seo: { ogImage: '/uploads/mine.webp' } }).image).toBe('https://ada.example/uploads/mine.webp')
    expect(pageSeo(site, '/work/p%201')).toMatchObject({ image: 'https://ada.example/og/work-p%201.png' })
    expect(pageSeo(site, '/work/p2')).toMatchObject({ image: 'https://cdn.example/q.png' })
    expect(pageSeo(site, '/notes/hello')).toMatchObject({ image: 'https://ada.example/og/note-hello.png' })
  })
  it('falls back to the project picture when there is no public address to serve a card from', () => {
    const local = { ...site, portfolio: { ...site.portfolio, site: { url: '' } } }
    expect(pageSeo(local, '/work/p%201')).toMatchObject({ image: '/uploads/a.webp' })
    expect(buildMeta(local.portfolio).image).toBe('')
  })
})

describe('preview card route', () => {
  let dir: string
  let server: Server
  let base: string
  let cookie = ''
  const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'sam-og-'))
    const dist = join(dir, 'dist'); mkdirSync(join(dist, 'images'), { recursive: true })
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html lang="en"><head><!--head:start--><!--head:end--></head><body></body></html>')
    writeFileSync(join(dist, 'images', 'cover.png'), await sharp({ create: { width: 400, height: 500, channels: 3, background: '#2A8DB0' } }).png().toBuffer())
    const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env: {} })
    await auth.setCredentials('owner', 'correct horse battery staple')
    await new Promise<void>((ok) => { server = app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })
    cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
    const c = structuredClone(baseContent) as any
    c.portfolio.profile.fullName = 'Ada Lovelace'
    c.portfolio.site.url = 'https://ada.example'
    c.projects = [
      { ...c.projects[0], id: 'live', title: 'Lead lifecycle redesign', description: 'A CRM project', hidden: false, thumbnail: { src: '/images/cover.png', alt: '' } },
      { ...c.projects[0], id: 'secret', title: 'Under NDA', hidden: true },
    ]
    c.notes = [{ id: 'n1', slug: 'hello', title: 'Hello world', summary: 'A note', date: '2026-01-01', hidden: false, tags: [] }]
    const d = await (await fetch(base + '/api/admin/draft', { headers: { ...H, cookie } })).json()
    await fetch(base + '/api/admin/draft', { method: 'PUT', headers: { ...H, cookie }, body: JSON.stringify({ content: c, baseRev: d.rev ?? 0 }) })
    expect((await fetch(base + '/api/admin/publish', { method: 'POST', headers: { ...H, cookie }, body: '{}' })).status).toBe(200)
  })
  afterAll(() => { server.close(); rmSync(dir, { recursive: true, force: true }) })

  it('draws a 1200 by 630 PNG for the home page, a project and a note, and caches it', async () => {
    for (const key of ['home', 'work-live', 'note-hello']) {
      const r = await fetch(`${base}/og/${key}.png`)
      expect(r.status, key).toBe(200)
      expect(r.headers.get('content-type')).toBe('image/png')
      expect(r.headers.get('cache-control')).toContain('max-age=3600')
      const buf = Buffer.from(await r.arrayBuffer())
      const meta = await sharp(buf).metadata()
      expect([meta.format, meta.width, meta.height], key).toEqual(['png', 1200, 630])
    }
    const a = Buffer.from(await (await fetch(`${base}/og/work-live.png`)).arrayBuffer())
    const b = Buffer.from(await (await fetch(`${base}/og/work-live.png`)).arrayBuffer())
    expect(a.equals(b)).toBe(true)
  })
  it('puts the project picture on its card and the home card is different', async () => {
    const withPic = Buffer.from(await (await fetch(`${base}/og/work-live.png`)).arrayBuffer())
    const { data, info } = await sharp(withPic).raw().toBuffer({ resolveWithObject: true })
    const px = (x: number, y: number) => [data[(y * info.width + x) * info.channels], data[(y * info.width + x) * info.channels + 1], data[(y * info.width + x) * info.channels + 2]]
    expect(px(960, 300)).toEqual([0x2a, 0x8d, 0xb0]) // the project cover, on the right
    const home = Buffer.from(await (await fetch(`${base}/og/home.png`)).arrayBuffer())
    expect(home.equals(withPic)).toBe(false)
  })
  it('never draws a card for a hidden project, a missing page or an odd key', async () => {
    for (const key of ['work-secret', 'work-nope', 'note-nope', 'other', '..%2Fsecret']) expect((await fetch(`${base}/og/${key}.png`)).status, key).toBe(404)
  })
  it('points the page head at the card', async () => {
    const html = await (await fetch(`${base}/work/live`)).text()
    expect(html).toContain('property="og:image" content="https://ada.example/og/work-live.png"')
    expect((await (await fetch(`${base}/`)).text())).toContain('https://ada.example/og/home.png')
  })
  it('ships the three fonts with their licences', () => {
    for (const f of ['Italiana-Regular.ttf', 'PinyonScript-Regular.ttf', 'Figtree-Medium.ttf', 'Figtree-Bold.ttf']) expect(readFileSync(join(__dirname, '..', 'server', 'fonts', f)).length).toBeGreaterThan(10000)
    const lic = readFileSync(join(__dirname, '..', 'server', 'fonts', 'LICENSES.md'), 'utf8')
    for (const n of ['Italiana', 'Figtree', 'Pinyon']) expect(lic).toContain(n)
    expect(lic).toContain('SIL OPEN FONT LICENSE')
  })
})
