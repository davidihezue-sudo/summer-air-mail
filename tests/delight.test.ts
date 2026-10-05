/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../server/index.mjs'
import { createEndorsements } from '../server/records.mjs'
import { parseEndorsement } from '../server/routes.mjs'
import { searchItems, type SearchItem } from '../src/utils/siteSearch'
import { baseContent, normalizeContent } from '../src/content/bundle'
import { sectionHasContent } from '../src/content/selectors'
import { RESTORE_FILES } from '../server/restore.mjs'

const item = (id: string, kind: SearchItem['kind'], title: string, detail = ''): SearchItem => ({ id, kind, title, detail, action: { type: 'section', id } })

describe('visitor search', () => {
  const items = [
    item('1', 'Project', 'Lead lifecycle redesign', 'Acme CRM'), item('2', 'Case study', 'Email nurture programme', 'lifecycle emails'),
    item('3', 'Tool', 'HubSpot', 'CRM'), item('4', 'Service', 'Marketing Analytics', 'dashboards and reports'), item('5', 'Note', 'Why I measure everything'), item('6', 'Section', 'Contact'),
  ]
  it('finds nothing for an empty box, and requires every word to match', () => {
    expect(searchItems(items, '')).toEqual([])
    expect(searchItems(items, '   ')).toEqual([])
    expect(searchItems(items, 'lead zzz')).toEqual([])
    expect(searchItems(items, 'lead lifecycle').map((x) => x.id)).toEqual(['1'])
  })
  it('ranks a word in the title above a word in the description', () => {
    expect(searchItems(items, 'life').map((x) => x.id)).toEqual(['1', '2']) // "lifecycle" is in the first title, only in the second description
    expect(searchItems(items, 'hub').map((x) => x.id)).toEqual(['3'])
    expect(searchItems(items, 'measure')[0].id).toBe('5')
  })
  it('breaks ties by kind, so a project comes before a tool', () => {
    expect(searchItems(items, 'crm').map((x) => x.id)).toEqual(['1', '3'])
  })
  it('ignores case and accents', () => {
    expect(searchItems([item('a', 'Note', 'Café culture')], 'CAFE').map((x) => x.id)).toEqual(['a'])
  })
  it('limits the number of results', () => {
    const many = Array.from({ length: 30 }, (_, i) => item(String(i), 'Tool', `Tool ${i}`))
    expect(searchItems(many, 'tool')).toHaveLength(8)
    expect(searchItems(many, 'tool', 3)).toHaveLength(3)
  })
})

describe('extras', () => {
  it('turns on search, reel previews and case study PDFs by default, and keeps a stored choice', () => {
    expect(baseContent.portfolio.extras).toMatchObject({ siteSearch: true, reelPreview: true, casePdf: true })
    expect(normalizeContent({ portfolio: { extras: { siteSearch: false } } }).portfolio.extras).toMatchObject({ siteSearch: false, reelPreview: true })
  })
})

describe('recommendations', () => {
  it('needs a name, real words and consent', () => {
    expect(parseEndorsement({ name: '', quote: 'x'.repeat(30), consent: true }).error).toMatch(/name/)
    expect(parseEndorsement({ name: 'Sam', quote: 'too short', consent: true }).error).toMatch(/more/)
    expect(parseEndorsement({ name: 'Sam', quote: 'x'.repeat(30), consent: false }).error).toMatch(/tick/)
    const ok = parseEndorsement({ name: ' Sam ', role: 'Head of Growth', company: 'Acme', quote: 'x'.repeat(30), consent: true, website: 'bot', elapsed: 4000 })
    expect(ok.value).toMatchObject({ name: 'Sam', role: 'Head of Growth' })
    expect(ok.honeypot).toBe(true)
    expect(parseEndorsement({ name: 'Sam', quote: 'y'.repeat(5000), consent: true }).value?.quote).toHaveLength(1200)
  })
  it('keeps them waiting until the owner decides, and is part of every backup', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sam-end-'))
    const e = createEndorsements(dir); await e.init()
    const a = await e.add({ name: 'A', role: '', company: '', quote: 'q'.repeat(30) })
    expect(e.pending()).toBe(1)
    expect(await e.setStatus(a.id, 'bogus')).toMatchObject({ ok: false, status: 400 })
    expect(await e.setStatus('nope', 'approved')).toMatchObject({ ok: false, status: 404 })
    expect((await e.setStatus(a.id, 'approved')).item?.status).toBe('approved')
    expect(e.pending()).toBe(0)
    expect(await e.remove(a.id)).toBe(true)
    expect(RESTORE_FILES).toContain('endorsements.json')
    expect(readFileSync(join(__dirname, '..', 'server', 'backup.mjs'), 'utf8')).toContain('endorsements.json')
    rmSync(dir, { recursive: true, force: true })
  })
  it('makes the testimonials section appear for the form even with nothing approved yet', () => {
    const c = structuredClone(baseContent) as any
    c.testimonials = []
    expect(sectionHasContent('testimonials', c)).toBe(false)
    c.portfolio.endorsements.enabled = true
    expect(sectionHasContent('testimonials', c)).toBe(true)
  })
})

describe('recommendation routes', () => {
  let dir: string
  let server: Server
  let base: string
  let cookie = ''
  const sent: any[] = []
  const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
  const api = (path: string, init: RequestInit = {}) => fetch(base + path, { ...init, headers: { ...H, cookie, ...(init.headers as object) } })
  const post = (b: object, ip = '198.51.100.1') => fetch(base + '/api/endorse', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(b) })
  const good = { name: 'Sam Reed', role: 'Head of Growth', company: 'Acme', quote: 'Ada rebuilt our lead process and it just worked.', consent: true, elapsed: 9000 }
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'sam-rec-'))
    const dist = join(dir, 'dist'); mkdirSync(dist)
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html lang="en"><head><!--head:start--><!--head:end--></head><body></body></html>')
    const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env: { SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p', TRUST_PROXY: '1' }, deps: { transportFactory: () => ({ sendMail: async (m: any) => { sent.push(m) } }) } })
    await auth.setCredentials('owner', 'correct horse battery staple')
    await new Promise<void>((ok) => { server = app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })
    cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
    await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings: { notifyEmail: 'me@example.com' } }) })
  })
  afterAll(() => { server.close(); rmSync(dir, { recursive: true, force: true }) })
  const publish = async (on: boolean) => {
    const c = structuredClone(baseContent) as any
    c.portfolio.endorsements.enabled = on
    const d = await (await api('/api/admin/draft')).json()
    await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: c, baseRev: d.rev ?? 0 }) })
    expect((await api('/api/admin/publish', { method: 'POST', body: '{}' })).status).toBe(200)
  }

  it('is closed until the owner turns the form on', async () => {
    await publish(false)
    expect((await post(good)).status).toBe(404)
  })
  it('accepts a good one, rejects bad ones, ignores bots, and tells the owner', async () => {
    await publish(true)
    expect((await post({ ...good, consent: false })).status).toBe(400)
    expect((await post({ ...good, elapsed: 100 })).status).toBe(400)
    expect((await post({ ...good, website: 'spam' }, '198.51.100.9')).status).toBe(200) // looks fine to the bot
    expect((await (await api('/api/admin/endorsements')).json()).items).toHaveLength(0)
    const before = sent.length
    expect((await post(good, '198.51.100.2')).status).toBe(200)
    const list = await (await api('/api/admin/endorsements')).json()
    expect(list.pending).toBe(1)
    expect(list.items[0]).toMatchObject({ name: 'Sam Reed', status: 'pending' })
    expect(sent.length).toBe(before + 1)
    expect(sent.at(-1).subject).toBe('New recommendation from Sam Reed')
  })
  it('lets only the signed-in owner review them, and limits how many one connection can send', async () => {
    expect((await fetch(base + '/api/admin/endorsements')).status).toBe(401)
    const id = (await (await api('/api/admin/endorsements')).json()).items[0].id
    expect((await api(`/api/admin/endorsements/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) })).status).toBe(200)
    expect((await api(`/api/admin/endorsements/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'nope' }) })).status).toBe(400)
    for (let i = 0; i < 3; i++) await post(good, '203.0.113.50')
    expect((await post(good, '203.0.113.50')).status).toBe(429)
    expect((await api(`/api/admin/endorsements/${id}`, { method: 'DELETE' })).status).toBe(200)
  })
})
