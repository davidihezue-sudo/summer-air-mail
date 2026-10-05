/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import sharp from 'sharp'
import { createApp } from '../server/index.mjs'
import { appNames, buildHeadTags, buildManifest } from '../shared/head.mjs'
import { THEMES } from '../src/themes'
import { portfolio } from '../src/content/portfolio.config'
import { baseContent } from '../src/content/bundle'

const sand = THEMES.summer.colors.sand
const pub = (f: string) => join(__dirname, '..', 'public', f)
const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }

describe('home-screen icons', () => {
  it.each([['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512]])('%s is a %i px square PNG', async (file, size) => {
    const m = await sharp(pub(file)).metadata()
    expect(m.format).toBe('png')
    expect([m.width, m.height]).toEqual([size, size])
  })
  it('the standard icons are the favicon artwork and the apple icon has no transparent corners', async () => {
    const corner = async (f: string) => (await sharp(pub(f)).ensureAlpha().raw().toBuffer()).readUInt8(3)
    expect(await corner('icon-512.png')).toBe(0) // the favicon's rounded corner, unchanged
    expect(await corner('apple-touch-icon.png')).toBe(255) // iOS would paint transparency black
    expect(await corner('icon-maskable-512.png')).toBe(255) // full bleed so any mask shape is filled
  })
  it('the maskable icon keeps the artwork inside the safe circle', async () => {
    const { data, info } = await sharp(pub('icon-maskable-512.png')).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const bg = [data[0], data[1], data[2]]
    const radius = info.width * 0.4
    let worst = 0
    for (let y = 0; y < info.height; y += 2) for (let x = 0; x < info.width; x += 2) {
      const i = (y * info.width + x) * 3
      const isBg = Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) < 24
      // The green card is the artwork that must survive cropping; the cream mat around it may be cut.
      if (!isBg && data[i + 1] > data[i] + 40 && data[i + 1] > data[i + 2] + 20 && data[i] < 40) worst = Math.max(worst, Math.hypot(x - 256, y - 256))
    }
    expect(worst).toBeGreaterThan(0)
    expect(worst).toBeLessThanOrEqual(radius + 3)
  })
})

describe('manifest', () => {
  it('takes names from the existing settings and colours from the tokens', () => {
    const m: any = buildManifest({ seo: { title: 'Ada Lovelace | Marketing' }, profile: { fullName: 'Ada Lovelace', preferredName: 'Ada' }, site: { locale: 'en-CA' } }, { theme: sand, background: sand })
    expect(m).toMatchObject({ name: 'Ada Lovelace | Marketing', short_name: 'Ada', display: 'standalone', start_url: '/', scope: '/', theme_color: sand, background_color: sand, lang: 'en-CA' })
    expect(m.icons.map((i: any) => `${i.sizes} ${i.purpose}`)).toEqual(['192x192 any', '512x512 any', '512x512 maskable'])
  })
  it('falls back sensibly and never invents a name', () => {
    expect(appNames({ profile: { fullName: 'Ada Lovelace' } })).toEqual({ name: 'Ada Lovelace', shortName: 'Ada Lovelace' })
    expect(appNames({})).toEqual({ name: 'Portfolio', shortName: 'Portfolio' })
  })
  it('escapes the app title in the head tags', () => {
    expect(buildHeadTags({ seo: { title: 'x' }, profile: { preferredName: 'A"<b>' } })).toContain('<meta name="apple-mobile-web-app-title" content="A&quot;&lt;b&gt;" />')
  })
})

describe('index.html head', () => {
  const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8')
  it('declares the icon, manifest, theme colour and standalone tags', () => {
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />')
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    expect(html).toContain('<meta name="theme-color" content="%THEME_COLOR%" />')
    expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />')
    expect(html).toContain('<meta name="mobile-web-app-capable" content="yes" />')
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />')
  })
})

describe('server', () => {
  let dir: string
  let server: Server
  let base: string
  let cookie = ''
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'sam-pwa-'))
    const dist = join(dir, 'dist')
    mkdirSync(dist)
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html lang="en"><head><!--head:start--><!--head:end--></head><body></body></html>')
    writeFileSync(join(dist, 'manifest.webmanifest'), JSON.stringify(buildManifest(portfolio, { theme: sand, background: sand })))
    for (const f of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) writeFileSync(join(dist, f), readFileSync(pub(f)))
    const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env: {} })
    await auth.setCredentials('owner', 'correct horse battery staple')
    await new Promise<void>((ok) => { server = app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })
    cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
  })
  afterAll(() => { server.close(); rmSync(dir, { recursive: true, force: true }) })

  it('serves the built manifest before anything is published', async () => {
    const r = await fetch(base + '/manifest.webmanifest')
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toContain('application/manifest+json')
    expect(r.headers.get('cache-control')).toBe('no-cache')
    expect((await r.json()).theme_color).toBe(sand)
  })
  it('follows the published names and keeps the token colours', async () => {
    const draft = await (await fetch(base + '/api/admin/draft', { headers: { ...H, cookie } })).json()
    const c = structuredClone(baseContent) as any
    c.portfolio.seo.title = 'Ada Lovelace | Portfolio'
    c.portfolio.profile.fullName = 'Ada Lovelace'
    c.portfolio.profile.preferredName = 'Ada'
    await fetch(base + '/api/admin/draft', { method: 'PUT', headers: { ...H, cookie }, body: JSON.stringify({ content: c, baseRev: draft.rev ?? 0 }) })
    expect((await fetch(base + '/api/admin/publish', { method: 'POST', headers: { ...H, cookie }, body: '{}' })).status).toBe(200)
    const m = await (await fetch(base + '/manifest.webmanifest')).json()
    expect(m).toMatchObject({ name: 'Ada Lovelace | Portfolio', short_name: 'Ada', display: 'standalone', start_url: '/', theme_color: sand, background_color: sand })
    const html = await (await fetch(base + '/')).text()
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="Ada" />')
  })
  it('serves the icons as PNG with a week of caching', async () => {
    for (const f of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) {
      const r = await fetch(`${base}/${f}`)
      expect(r.status).toBe(200)
      expect(r.headers.get('content-type')).toBe('image/png')
      expect(r.headers.get('cache-control')).toBe('public, max-age=604800')
    }
  })
})
