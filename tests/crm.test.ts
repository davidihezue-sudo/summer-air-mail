/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../server/index.mjs'
import { createEnquiries, createInsights, createSettings } from '../server/records.mjs'
import { buildDigest, digestDue, localParts, weekStart } from '../server/digest.mjs'
import { addDays, followUpState, STAGES } from '../src/admin/pipeline'
import { baseContent } from '../src/content/bundle'

const tmp = () => mkdtempSync(join(tmpdir(), 'sam-crm-'))
const d = (iso: string) => new Date(iso)

describe('pipeline helpers', () => {
  it('knows where a follow-up stands, and never nags about finished work', () => {
    expect(followUpState('2026-03-01', 'new', '2026-03-05')).toBe('overdue')
    expect(followUpState('2026-03-05', 'replied', '2026-03-05')).toBe('today')
    expect(followUpState('2026-03-09', 'interview', '2026-03-05')).toBe('later')
    expect(followUpState('2026-03-01', 'won', '2026-03-05')).toBe('')
    expect(followUpState('2026-03-01', 'closed', '2026-03-05')).toBe('')
    expect(followUpState('', 'new', '2026-03-05')).toBe('')
  })
  it('adds days across month ends and years', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(addDays('2026-12-30', 7)).toBe('2027-01-06')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })
  it('has the five stages in order', () => expect([...STAGES]).toEqual(['new', 'replied', 'interview', 'won', 'closed']))
})

describe('enquiry pipeline store', () => {
  it('starts every message as new and treats older messages the same way', async () => {
    const dir = tmp()
    const e = createEnquiries(dir)
    await e.init()
    const item = await e.add({ name: 'A', email: 'a@b.co', message: 'hello there' })
    expect(item).toMatchObject({ stage: 'new', notes: '', followUp: '' })
    // a message saved before the pipeline existed has none of the new fields
    expect(e.list()[0]).toMatchObject({ stage: 'new', notes: '', followUp: '' })
    rmSync(dir, { recursive: true, force: true })
  })
  it('updates stage, notes and follow-up, and refuses anything invalid', async () => {
    const dir = tmp()
    const e = createEnquiries(dir)
    await e.init()
    const { id } = await e.add({ name: 'A', email: 'a@b.co', message: 'hello there' })
    expect((await e.update(id, { stage: 'interview', followUp: '2026-04-01', notes: 'Call booked' })).item).toMatchObject({ stage: 'interview', followUp: '2026-04-01', notes: 'Call booked' })
    expect(await e.update(id, { stage: 'bogus' })).toMatchObject({ ok: false, status: 400 })
    expect(await e.update(id, { followUp: 'tomorrow' })).toMatchObject({ ok: false, status: 400 })
    expect(await e.update('nope', { stage: 'won' })).toMatchObject({ ok: false, status: 404 })
    expect((await e.update(id, { followUp: '' })).item?.followUp).toBe('')
    expect((await e.update(id, { notes: 'x'.repeat(9000) })).item?.notes).toHaveLength(4000)
    expect(e.list()[0].stage).toBe('interview') // the refused changes were not half applied
    rmSync(dir, { recursive: true, force: true })
  })
  it('lists only open messages whose follow-up date has come', async () => {
    const dir = tmp()
    const e = createEnquiries(dir)
    await e.init()
    const ids = []
    for (const n of ['a', 'b', 'c', 'd']) ids.push((await e.add({ name: n, email: 'a@b.co', message: 'hello there' })).id)
    await e.update(ids[0], { followUp: '2026-03-01' })
    await e.update(ids[1], { followUp: '2026-03-05', stage: 'replied' })
    await e.update(ids[2], { followUp: '2026-03-01', stage: 'won' })
    await e.update(ids[3], { followUp: '2026-03-09' })
    expect(e.due('2026-03-05').map((x: any) => x.name).sort()).toEqual(['a', 'b'])
    expect(e.csv().split('\r\n')[0]).toBe('at,name,email,type,budget,company,message,read,stage,followUp,notes')
    rmSync(dir, { recursive: true, force: true })
  })
})

describe('weekly summary schedule', () => {
  it('reads the local day and hour in a time zone', () => {
    expect(localParts(d('2026-03-02T13:30:00Z'), 'UTC')).toEqual({ date: '2026-03-02', weekday: 1, hour: 13 })
    expect(localParts(d('2026-03-02T02:30:00Z'), 'America/Toronto')).toEqual({ date: '2026-03-01', weekday: 0, hour: 21 })
  })
  it('finds the start of the week', () => {
    expect(weekStart('2026-03-04', 1)).toBe('2026-03-02')
    expect(weekStart('2026-03-02', 1)).toBe('2026-03-02')
    expect(weekStart('2026-03-01', 1)).toBe('2026-02-23')
    expect(weekStart('2026-03-04', 0)).toBe('2026-03-01')
  })
  it('is due once, on the chosen day from the chosen hour, and only when switched on', () => {
    const on = { enabled: true, day: 1, hour: 8, timezone: 'UTC', lastSent: '' }
    expect(digestDue({ ...on, enabled: false }, d('2026-03-02T09:00:00Z'))).toBe(false)
    expect(digestDue(on, d('2026-03-02T07:59:00Z'))).toBe(false)
    expect(digestDue(on, d('2026-03-02T08:00:00Z'))).toBe(true)
    expect(digestDue(on, d('2026-03-03T09:00:00Z'))).toBe(false)
    expect(digestDue({ ...on, lastSent: '2026-03-02' }, d('2026-03-02T20:00:00Z'))).toBe(false)
    expect(digestDue({ ...on, lastSent: '2026-03-02' }, d('2026-03-09T08:00:00Z'))).toBe(true)
  })
  it('uses the chosen time zone for the day and hour', () => {
    const toronto = { enabled: true, day: 1, hour: 8, timezone: 'America/Toronto', lastSent: '' }
    expect(digestDue(toronto, d('2026-03-02T12:00:00Z'))).toBe(false) // 07:00 on Monday in Toronto
    expect(digestDue(toronto, d('2026-03-02T13:00:00Z'))).toBe(true) // 08:00 on Monday in Toronto
    expect(digestDue({ ...toronto, day: 0 }, d('2026-03-02T02:30:00Z'))).toBe(true) // still Sunday evening in Toronto, from 21:00 on
    expect(digestDue({ ...toronto, day: 0, hour: 22 }, d('2026-03-02T02:30:00Z'))).toBe(false)
  })
})

describe('settings', () => {
  it('cleans the summary settings and keeps lastSent out of the owner\'s hands', async () => {
    const dir = tmp()
    const s = createSettings(dir)
    await s.init()
    const next = await s.set({ digest: { enabled: true, day: 9, hour: -3, timezone: 'Not/AZone', lastSent: '2020-01-01' } })
    expect(next.digest).toEqual({ enabled: true, day: 6, hour: 0, timezone: 'UTC', lastSent: '' })
    await s.markDigestSent('2026-03-02')
    expect(s.get().digest.lastSent).toBe('2026-03-02')
    expect((await s.set({ digest: { lastSent: '1999-01-01', timezone: 'Europe/London' } })).digest).toMatchObject({ lastSent: '2026-03-02', timezone: 'Europe/London' })
    rmSync(dir, { recursive: true, force: true })
  })
})

describe('the summary text', () => {
  it('reports real counts, application links, messages and follow-ups', async () => {
    const dir = tmp()
    const insights = createInsights(dir); await insights.init()
    const enquiries = createEnquiries(dir); await enquiries.init()
    const now = d('2026-03-09T09:00:00Z')
    const day = (n: number) => new Date(now.getTime() - n * 864e5)
    await insights.record({ type: 'view', path: '/', ip: '1.1.1.1', ua: 'a' }, day(1))
    await insights.record({ type: 'view', path: '/work/p1', ip: '2.2.2.2', ua: 'b' }, day(2))
    await insights.record({ type: 'view', path: '/for/acme-x7', ip: '3.3.3.3', ua: 'c' }, day(3))
    await insights.record({ type: 'view', path: '/', ip: '4.4.4.4', ua: 'd' }, day(10))
    await insights.record({ type: 'view', path: '/', ip: '9.9.9.9', ua: 'me', own: true }, day(1))
    await insights.record({ type: 'project', name: 'Launch one' }, day(2))
    const e = await enquiries.add({ name: 'Sam', email: 's@x.co', company: 'Beta', message: 'hello there', type: 'Job' })
    await enquiries.update(e.id, { followUp: '2026-03-08' })
    const content: any = { portfolio: { profile: { preferredName: 'Ada' } }, projects: [{ id: 'p1', title: 'Launch one' }], notes: [], applications: [{ slug: 'acme-x7', company: 'Acme' }] }
    const out = buildDigest({ insights, enquiries, content, now })
    expect(out.subject).toBe('Your portfolio this week: 3 visitors, 1 follow-up due')
    expect(out.text).toContain('Outside visitors: 3 (+200% on the week before)')
    expect(out.text).toContain('Your own visits: 1')
    expect(out.text).toContain('Launch one')
    expect(out.text).toContain('Application links opened:\n  1  Acme')
    expect(out.text).toContain('Sam, Beta: 2026-03-08')
    expect(out.text).not.toContain(String.fromCharCode(8212))
    rmSync(dir, { recursive: true, force: true })
  })
  it('says so when there is nothing to report instead of inventing anything', async () => {
    const dir = tmp()
    const insights = createInsights(dir); await insights.init()
    const enquiries = createEnquiries(dir); await enquiries.init()
    const out = buildDigest({ insights, enquiries, content: { portfolio: {}, applications: [] } as any, now: d('2026-03-09T09:00:00Z') })
    expect(out.subject).toBe('Your portfolio this week: 0 visitors')
    expect(out.text).toContain('Application links opened: none this week')
    expect(out.text).toContain('Follow-ups due: none')
    rmSync(dir, { recursive: true, force: true })
  })
  it('records the last day each page was viewed', async () => {
    const dir = tmp()
    const insights = createInsights(dir); await insights.init()
    const now = d('2026-03-09T09:00:00Z')
    await insights.record({ type: 'view', path: '/for/x', ip: '1', ua: 'a' }, d('2026-03-03T10:00:00Z'))
    await insights.record({ type: 'view', path: '/for/x', ip: '1', ua: 'a' }, d('2026-03-06T10:00:00Z'))
    expect((insights.summary(30, now).pathLast as Record<string, string>)['/for/x']).toBe('2026-03-06')
    rmSync(dir, { recursive: true, force: true })
  })
})

describe('server: pipeline routes and the summary now button', () => {
  let dir: string
  let server: Server
  let base: string
  let cookie = ''
  const sent: any[] = []
  const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
  const api = (path: string, init: RequestInit = {}) => fetch(base + path, { ...init, headers: { ...H, cookie, ...(init.headers as object) } })
  beforeAll(async () => {
    dir = tmp()
    const dist = join(dir, 'dist'); mkdirSync(dist)
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html lang="en"><head><!--head:start--><!--head:end--></head><body></body></html>')
    const env = { SMTP_HOST: 'smtp.test', SMTP_USER: 'u', SMTP_PASS: 'p' }
    const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env, deps: { transportFactory: () => ({ sendMail: async (m: any) => { sent.push(m) } }) } })
    await auth.setCredentials('owner', 'correct horse battery staple')
    await new Promise<void>((ok) => { server = app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })
    cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
    const draft = await (await api('/api/admin/draft')).json()
    const c = structuredClone(baseContent) as any
    c.portfolio.contact.delivery = 'server'
    await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: c, baseRev: draft.rev ?? 0 }) })
    await api('/api/admin/publish', { method: 'POST', body: '{}' })
    await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings: { notifyEmail: 'me@example.com' } }) })
    const post = await fetch(base + '/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Sam', email: 's@x.co', message: 'I would like to talk about a role', type: 'Job', elapsed: 9000 }) })
    expect(post.status).toBe(200)
  })
  afterAll(() => { server.close(); rmSync(dir, { recursive: true, force: true }) })

  it('moves a message through the pipeline and counts the follow-ups due', async () => {
    const list = await (await api('/api/admin/enquiries')).json()
    expect(list.items[0]).toMatchObject({ stage: 'new', notes: '', followUp: '' })
    const id = list.items[0].id
    const r = await api(`/api/admin/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify({ stage: 'replied', followUp: '2020-01-01', notes: 'Sent my CV' }) })
    expect(r.status).toBe(200)
    expect((await r.json()).item).toMatchObject({ stage: 'replied', notes: 'Sent my CV' })
    expect((await (await api('/api/admin/enquiries')).json()).due).toBe(1)
    expect((await api(`/api/admin/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify({ stage: 'nope' }) })).status).toBe(400)
    expect((await api('/api/admin/enquiries/missing', { method: 'PATCH', body: JSON.stringify({ stage: 'won' }) })).status).toBe(404)
    await api(`/api/admin/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify({ stage: 'won' }) })
    expect((await (await api('/api/admin/enquiries')).json()).due).toBe(0)
    expect(await (await api('/api/admin/enquiries.csv')).text()).toContain('won,2020-01-01,Sent my CV')
  })
  it('sends a summary on request and returns its text', async () => {
    const before = sent.length
    const r = await (await api('/api/admin/settings/test-digest', { method: 'POST', body: '{}' })).json()
    expect(r.delivered.email).toBe(true)
    expect(r.subject).toMatch(/^Your portfolio this week/)
    expect(r.text).toContain('Messages this week: 1 new')
    expect(sent.length).toBe(before + 1)
    expect(sent.at(-1).to).toBe('me@example.com')
  })
  it('saves the schedule and refuses it for anyone but the owner', async () => {
    const r = await (await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings: { digest: { enabled: true, day: 5, hour: 17, timezone: 'Europe/London' } } }) })).json()
    expect(r.settings.digest).toMatchObject({ enabled: true, day: 5, hour: 17, timezone: 'Europe/London' })
    expect((await fetch(base + '/api/admin/settings/test-digest', { method: 'POST', headers: H, body: '{}' })).status).toBe(401)
  })
})
