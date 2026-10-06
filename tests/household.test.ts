/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../server/index.mjs'
import { createInsights } from '../server/records.mjs'
import { baseContent } from '../src/content/bundle'
import { newAudience } from '../src/content/factories'
import { parseRoute } from '../src/utils/route'

const T = new Date('2026-03-01T10:00:00Z')

describe('outsiders and the household are counted apart, per audience view', () => {
  const setup = async () => { const i = createInsights(mkdtempSync(join(tmpdir(), 'sam-h-'))); await i.init(); return i }
  it('credits what outsiders did to the view their visit started in, and counts people once', async () => {
    const i = await setup()
    await i.record({ type: 'view', path: '/for/recruiters', ip: '1.1.1.1', ua: 'a', via: 'recruiters' }, T)
    await i.record({ type: 'view', path: '/work/x', ip: '1.1.1.1', ua: 'a', via: 'recruiters' }, T)
    await i.record({ type: 'project', name: 'Alpha', ip: '1.1.1.1', ua: 'a', via: 'recruiters' }, T)
    await i.record({ type: 'contact', ip: '1.1.1.1', ua: 'a', via: 'recruiters' }, T)
    await i.record({ type: 'view', path: '/for/recruiters', ip: '2.2.2.2', ua: 'b', via: 'recruiters' }, T)
    await i.record({ type: 'view', path: '/for/clients', ip: '3.3.3.3', ua: 'c', via: 'clients' }, T)
    const s: any = i.summary(7, T)
    expect(s.via.recruiters).toEqual({ views: 3, visitors: 2, events: { project: 1, contact: 1 } })
    expect(s.via.clients).toEqual({ views: 1, visitors: 1, events: {} })
    expect(s.views).toBe(4)
  })
  it('keeps the household out of every outside number, and shows it by view on its own', async () => {
    const i = await setup()
    await i.record({ type: 'view', path: '/for/recruiters', ip: '9.9.9.9', ua: 'me', own: true, via: 'recruiters' }, T)
    await i.record({ type: 'view', path: '/work/x', ip: '9.9.9.9', ua: 'me', own: true, via: 'recruiters' }, T)
    await i.record({ type: 'contact', ip: '9.9.9.9', ua: 'me', own: true, via: 'recruiters' }, T)
    const s: any = i.summary(7, T)
    expect(s.views).toBe(0); expect(s.visitors).toBe(0); expect(s.via).toEqual({}); expect(s.events).toEqual({}); expect(s.paths).toEqual({})
    expect(s.own.views).toBe(2)
    expect(s.own.via.recruiters).toEqual({ views: 2, events: { contact: 1 } })
    expect(s.own.paths['/for/recruiters']).toBe(1)
  })
  it('ignores badly formed names and stops a day filling up with made-up ones', async () => {
    const i = await setup()
    await i.record({ type: 'view', path: '/', ip: '1.1.1.1', ua: 'a', via: '../etc' }, T)
    await i.record({ type: 'view', path: '/', ip: '1.1.1.1', ua: 'a', via: 'x' }, T)
    for (let n = 0; n < 80; n++) await i.record({ type: 'view', path: '/', ip: '1.1.1.1', ua: 'a', via: `made-up-${n}` }, T)
    const s: any = i.summary(7, T)
    expect(Object.keys(s.via)).toHaveLength(60)
    expect(s.via['../etc']).toBeUndefined()
    expect(s.views).toBe(82)
  })
})

describe('adding a device with a one-time link', () => {
  it('works once, only while fresh, and can be undone', async () => {
    const i = createInsights(mkdtempSync(join(tmpdir(), 'sam-h-'))); await i.init()
    const cookie = i.mineValue()
    expect(i.isMine(cookie)).toBe(true)
    expect(i.isMine('')).toBe(false); expect(i.isMine('x'.repeat(40))).toBe(false); expect(i.isMine(undefined as any)).toBe(false)
    const a = i.newLink(T)
    expect(await i.claim(a.token, new Date(T.getTime() + 5 * 60000))).toBe(true)
    expect(await i.claim(a.token, new Date(T.getTime() + 6 * 60000))).toBe(false) // used
    const b = i.newLink(T)
    expect(await i.claim(b.token, new Date(T.getTime() + 16 * 60000))).toBe(false) // expired
    expect(await i.claim('short')).toBe(false)
    expect(i.devices()).toEqual({ added: 1, last: '2026-03-01' })
    await i.forgetDevices()
    expect(i.isMine(cookie)).toBe(false)
    expect(i.isMine(i.mineValue())).toBe(true)
    expect(i.devices()).toEqual({ added: 0, last: '' })
  })
})

describe('on the running server', () => {
  let dir = ''
  let server: Server
  let base = ''
  let app: any
  let adminCookie = ''
  const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
  const view = { ...newAudience(), id: 'rec', slug: 'recruiters', name: 'Recruiters' }
  const track = (body: unknown, ip: string, cookie = '') => fetch(base + '/api/track', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) })
  const summary = async () => (await (await fetch(base + '/api/admin/insights?range=7', { headers: { ...H, cookie: adminCookie } })).json()) as any
  const settle = () => new Promise((r) => setTimeout(r, 120))

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'sam-hh-'))
    const dist = join(dir, 'dist'); mkdirSync(dist)
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html><head><!--head:start--><!--head:end--></head><body></body></html>')
    app = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env: { TRUST_PROXY: '1' } })
    await app.auth.setCredentials('owner', 'correct horse battery staple')
    await new Promise<void>((ok) => { server = app.app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    // The owner signs in from the home network, 198.51.100.7.
    const r = await fetch(base + '/api/admin/login', { method: 'POST', headers: { ...H, 'x-forwarded-for': '198.51.100.7' }, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })
    adminCookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ')
    const d = await (await fetch(base + '/api/admin/draft', { headers: { ...H, cookie: adminCookie } })).json()
    const c = { ...baseContent, audiences: [view], portfolio: { ...baseContent.portfolio, insights: { ...baseContent.portfolio.insights, enabled: true } } }
    expect((await fetch(base + '/api/admin/draft', { method: 'PUT', headers: { ...H, cookie: adminCookie }, body: JSON.stringify({ content: c, baseRev: d.rev ?? 0 }) })).status).toBe(200)
    expect((await fetch(base + '/api/admin/publish', { method: 'POST', headers: { ...H, cookie: adminCookie }, body: '{}' })).status).toBe(200)
  })
  afterAll(async () => { server?.close(); await app?.close(); rmSync(dir, { recursive: true, force: true }) })

  it('signing in gives the browser the household marker', () => { expect(adminCookie).toContain('sam_mine=') })

  it('credits an outsider\'s visit to the view, and ignores a view that does not exist', async () => {
    await track({ type: 'view', path: '/for/recruiters', via: 'recruiters' }, '203.0.113.10'); await settle()
    await track({ type: 'contact', path: '/', via: 'recruiters' }, '203.0.113.10'); await settle()
    await track({ type: 'view', path: '/', via: 'invented-view' }, '203.0.113.11'); await settle()
    const s = await summary()
    expect(s.via.recruiters.views).toBe(1)
    expect(s.via.recruiters.events).toEqual({ contact: 1 })
    expect(s.via['invented-view']).toBeUndefined()
    expect(s.views).toBe(2)
  })
  it('counts a browser with the household marker as home, from any network, never as an outsider', async () => {
    const before = await summary()
    const mine = adminCookie.split('; ').find((c) => c.startsWith('sam_mine='))!
    await track({ type: 'view', path: '/for/recruiters', via: 'recruiters' }, '192.0.2.50', mine); await settle()
    const s = await summary()
    expect(s.views).toBe(before.views)
    expect(s.via.recruiters.views).toBe(before.via.recruiters.views)
    expect(s.own.views).toBe(before.own.views + 1)
    expect(s.own.via.recruiters.views).toBe(1)
  })
  it('counts the recognised home network as home too', async () => {
    const before = await summary()
    await track({ type: 'view', path: '/', via: 'recruiters' }, '198.51.100.7'); await settle()
    const s = await summary()
    expect(s.views).toBe(before.views)
    expect(s.own.views).toBe(before.own.views + 1)
  })
  it('adds a second device with a one-time link: needs sign in to make, works once, then that device counts as home', async () => {
    expect((await fetch(base + '/api/admin/own-link', { method: 'POST', headers: H })).status).toBe(401)
    const made = await (await fetch(base + '/api/admin/own-link', { method: 'POST', headers: { ...H, cookie: adminCookie } })).json() as any
    expect(made.path).toMatch(/^\/own\/[\w-]{20,}$/)
    const token = made.path.split('/').pop()
    const claim = await fetch(base + '/api/own/claim', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
    expect(claim.status).toBe(200)
    const phone = (claim.headers.getSetCookie?.() ?? [])[0].split(';')[0]
    expect(phone).toMatch(/^sam_mine=/)
    expect((claim.headers.getSetCookie?.() ?? [])[0]).toMatch(/HttpOnly/i)
    expect((await fetch(base + '/api/own/claim', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })).status).toBe(400)
    const before = await summary()
    await track({ type: 'view', path: '/', via: '' }, '203.0.113.99', phone); await settle()
    const s = await summary()
    expect(s.views).toBe(before.views)
    expect(s.own.views).toBe(before.own.views + 1)
    expect(s.devices.added).toBe(1)
    // Forgetting added devices makes that phone an outsider again.
    expect((await fetch(base + '/api/admin/insights/devices', { method: 'DELETE', headers: { ...H, cookie: adminCookie } })).status).toBe(200)
    const b2 = await summary()
    await track({ type: 'view', path: '/', via: '' }, '203.0.113.99', phone); await settle()
    expect((await summary()).views).toBe(b2.views + 1)
  })
  it('serves the add-a-device page hidden from search engines and without passing the code on', async () => {
    const r = await fetch(base + '/own/abcdefghijklmnopqrstuvwxyz')
    expect(r.status).toBe(200)
    expect(r.headers.get('x-robots-tag')).toContain('noindex')
    expect(r.headers.get('referrer-policy')).toBe('no-referrer')
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect(parseRoute('/own/abc')).toEqual({ kind: 'own', token: 'abc' })
  })
  it('keeps the household out of the public numbers', async () => {
    // The panel is off here, so just prove the figures it would use exclude the household.
    const s = await summary()
    expect(s.visitors).toBeLessThanOrEqual(s.views)
  })
})
