/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../server/index.mjs'
import { validateContent } from '../server/validate.mjs'
import { publicView } from '../server/publicView.mjs'
import { baseContent, normalizeContent } from '../src/content/bundle'
import { applyApplication, applyAudience } from '../src/content/derive'
import { newApplication, newAudience, newFaq } from '../src/content/factories'
import { parseRoute } from '../src/utils/route'

const view = (over: Record<string, unknown> = {}) => ({ ...newAudience(), id: 'rec', slug: 'recruiters', name: 'Recruiters', ...over }) as any
const proj = (id: string, title: string) => ({ ...baseContent.projects[0], id, title, hidden: false })
const site = () => normalizeContent({
  ...baseContent,
  projects: [proj('p1', 'Alpha'), proj('p2', 'Beta'), proj('p3', 'Gamma')],
  faqs: [{ ...newFaq(), id: 'f1', question: 'Q1', answer: 'A1', hidden: false }, { ...newFaq(), id: 'f2', question: 'Q2', answer: 'A2', hidden: false }],
  tools: [{ id: 't1', name: 'Canva', category: 'Design', confirmed: true, usage: '' }, { id: 't2', name: 'Zapier', category: 'Workflow and Automation', confirmed: true, usage: '' }],
})

describe('applying an audience view', () => {
  it('changes only what the view sets and never touches the main site', () => {
    const c = site()
    const before = JSON.stringify(c)
    const out = applyAudience(c, view({ hero: { label: '', headline: 'Hire a CRM architect', supporting: '', intro: '' } }))
    expect(out.portfolio.hero.headline).toBe('Hire a CRM architect')
    expect(out.portfolio.hero.label).toBe(c.portfolio.hero.label)
    expect(out.projects).toHaveLength(3)
    expect(JSON.stringify(c)).toBe(before)
  })
  it('swaps the About text, hero buttons and wording only when given', () => {
    const c = site()
    const plain = applyAudience(c, view())
    expect(plain.portfolio.profile.bio).toEqual(c.portfolio.profile.bio)
    expect(plain.portfolio.hero.ctas).toEqual(c.portfolio.hero.ctas)
    const sec = c.portfolio.sections.find((s) => s.type === 'contact')!
    const out = applyAudience(c, view({ bio: 'First paragraph.\n\nSecond paragraph.', ctas: [{ label: 'See my CV', target: 'contact' }, { label: '', target: 'x' }], sectionWording: [{ sectionId: sec.id, heading: 'Hire me', intro: '' }, { sectionId: 'nope', heading: 'x', intro: 'y' }] }))
    expect(out.portfolio.profile.bio).toEqual(['First paragraph.', 'Second paragraph.'])
    expect(out.portfolio.hero.ctas).toEqual([{ label: 'See my CV', target: 'contact' }])
    const s = out.portfolio.sections.find((x) => x.id === sec.id)!
    expect(s.heading).toBe('Hire me')
    expect(s.intro).toBe(sec.intro)
  })
  it('hides sections, and moves chosen sections up with the hero staying first', () => {
    const c = site()
    const ids = c.portfolio.sections.filter((s) => s.type !== 'hero').map((s) => s.id)
    const contact = c.portfolio.sections.find((s) => s.type === 'contact')!.id
    const results = c.portfolio.sections.find((s) => s.type === 'results')!.id
    const out = applyAudience(c, view({ hideSectionIds: [results], firstSectionIds: [contact, 'missing'] }))
    expect(out.portfolio.sections[0].type).toBe('hero')
    expect(out.portfolio.sections[1].id).toBe(contact)
    expect(out.portfolio.sections.find((s) => s.id === results)?.enabled).toBe(false)
    expect(out.portfolio.sections).toHaveLength(ids.length + 1)
    expect(c.portfolio.sections.find((s) => s.id === results)?.enabled).not.toBe(false)
  })
  it('leaves out individual items of every kind it lists', () => {
    const out = applyAudience(site(), view({ hide: { ...newAudience().hide, projects: ['p2'], faqs: ['f1'], tools: ['t2'] } }))
    expect(out.projects.map((p) => p.id)).toEqual(['p1', 'p3'])
    expect(out.faqs.map((f) => f.id)).toEqual(['f2'])
    expect(out.tools.map((t) => t.id)).toEqual(['t1'])
  })
  it('puts chosen projects first and can show only those', () => {
    expect(applyAudience(site(), view({ featuredProjectIds: ['p3', 'p1'] })).projects.map((p) => p.id)).toEqual(['p3', 'p1', 'p2'])
    expect(applyAudience(site(), view({ featuredProjectIds: ['p3'], onlyFeatured: true })).projects.map((p) => p.id)).toEqual(['p3'])
  })
  it('lets an application link build on a view, with its own settings winning', () => {
    const c = site()
    const aud = applyAudience(c, view({ hero: { label: '', headline: 'For recruiters', supporting: 'View support', intro: '' }, hide: { ...newAudience().hide, projects: ['p2'] } }))
    const app = { ...newApplication(), hero: { label: '', headline: 'For Acme', supporting: '', intro: '' } }
    const out = applyApplication(aud, app)
    expect(out.portfolio.hero.headline).toBe('For Acme')
    expect(out.portfolio.hero.supporting).toBe('View support')
    expect(out.projects.map((p) => p.id)).toEqual(['p1', 'p3'])
  })
})

describe('audience views in saved content', () => {
  it('older content has none, and a saved view keeps its shape', () => {
    expect(normalizeContent({ ...baseContent, audiences: undefined }).audiences).toEqual([])
    const c = normalizeContent({ ...baseContent, audiences: [{ id: 'a', slug: 'clients', name: 'Clients', hide: { projects: ['p1'] } }] })
    expect(c.audiences[0].hide.projects).toEqual(['p1'])
    expect(c.audiences[0].hide.faqs).toEqual([])
    expect(c.audiences[0].enabled).toBe(true)
  })
  it('is checked by the server: good names pass, clashes and bad names do not', () => {
    const ok = { ...baseContent, audiences: [view(), view({ id: 'cl', slug: 'clients', name: 'Clients' })] }
    expect(validateContent(ok).ok).toBe(true)
    expect(validateContent({ ...baseContent, audiences: [view(), view({ id: 'b' })] }).ok).toBe(false)
    expect(validateContent({ ...baseContent, audiences: [view({ slug: 'bad name!' })] }).ok).toBe(false)
    const clash = { ...baseContent, audiences: [view()], applications: [{ ...newApplication(), slug: 'Recruiters' }] }
    const r = validateContent(clash) as any
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/both an audience view and an application link/)
  })
  it('never publishes a switched off view', () => {
    const out = publicView({ ...baseContent, audiences: [view(), view({ id: 'x', slug: 'old', enabled: false })] }) as any
    expect(out.audiences.map((a: any) => a.slug)).toEqual(['recruiters'])
  })
  it('shares the /for/ address with application links', () => {
    expect(parseRoute('/for/recruiters')).toEqual({ kind: 'application', slug: 'recruiters' })
  })
})

describe('audience views on the server', () => {
  let dir = ''
  let server: Server
  let base = ''
  let app: any
  const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
  let cookie = ''
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'sam-aud-'))
    const dist = join(dir, 'dist'); mkdirSync(dist)
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html lang="en"><head><meta name="robots" content="index" /><!--head:start--><!--head:end--></head><body></body></html>')
    app = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env: {} })
    await app.auth.setCredentials('owner', 'correct horse battery staple')
    await new Promise<void>((ok) => { server = app.app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const r = await fetch(base + '/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })
    cookie = (r.headers.get('set-cookie') ?? '').split(';')[0]
    const d = await (await fetch(base + '/api/admin/draft', { headers: { ...H, cookie } })).json()
    const put = await fetch(base + '/api/admin/draft', { method: 'PUT', headers: { ...H, cookie }, body: JSON.stringify({ content: { ...baseContent, audiences: [view(), view({ id: 'off', slug: 'old', name: 'Old', enabled: false })] }, baseRev: d.rev ?? 0 }) })
    expect(put.status).toBe(200)
    expect((await fetch(base + '/api/admin/publish', { method: 'POST', headers: { ...H, cookie }, body: '{}' })).status).toBe(200)
  })
  afterAll(async () => { server?.close(); await app?.close(); rmSync(dir, { recursive: true, force: true }) })

  it('serves a view at /for/<address>, hidden from search engines', async () => {
    const r = await fetch(base + '/for/recruiters')
    expect(r.status).toBe(200)
    const html = await r.text()
    expect(html).toContain('content="noindex, nofollow"')
    expect(r.headers.get('x-robots-tag') ?? '').toContain('noindex')
  })
  it('answers 404 for a switched off or unknown view', async () => {
    expect((await fetch(base + '/for/old')).status).toBe(404)
    expect((await fetch(base + '/for/nothing-here')).status).toBe(404)
  })
  it('keeps the main page indexable and lists no view in the sitemap', async () => {
    expect(await (await fetch(base + '/')).text()).not.toContain('noindex')
    expect(await (await fetch(base + '/sitemap.xml')).text()).not.toContain('/for/')
  })
})

describe('a view\'s own section order', () => {
  const ids = (c: ReturnType<typeof site>) => c.portfolio.sections.filter((s) => s.type !== 'hero').map((s) => s.id)
  it('puts the hero first, then the view\'s order, then anything it does not mention in the main order', () => {
    const c = site()
    const all = ids(c)
    const want = [all[5], all[2], all[9]]
    const out = applyAudience(c, view({ sectionOrder: want }))
    const got = out.portfolio.sections
    expect(got[0].type).toBe('hero')
    expect(got.slice(1, 4).map((s) => s.id)).toEqual(want)
    expect(got.slice(4).map((s) => s.id)).toEqual(all.filter((x) => !want.includes(x)))
    expect(got).toHaveLength(all.length + 1)
  })
  it('ignores unknown and repeated ids, and an empty order follows the main site', () => {
    const c = site()
    const all = ids(c)
    const out = applyAudience(c, view({ sectionOrder: ['nope', all[3], all[3], 'top'] }))
    expect(out.portfolio.sections.map((s) => s.id).slice(0, 2)).toEqual([c.portfolio.sections[0].id, all[3]])
    expect(applyAudience(c, view({})).portfolio.sections.map((s) => s.id)).toEqual(c.portfolio.sections.map((s) => s.id))
  })
  it('still honours the older "bring to the top" list when no order is set, and the new order wins when both are', () => {
    const c = site()
    const all = ids(c)
    expect(applyAudience(c, view({ firstSectionIds: [all[4]] })).portfolio.sections[1].id).toBe(all[4])
    expect(applyAudience(c, view({ firstSectionIds: [all[4]], sectionOrder: [all[7]] })).portfolio.sections[1].id).toBe(all[7])
  })
  it('can show a section the main site has switched off, but a hidden one stays hidden', () => {
    const c = site()
    const m = c.portfolio.sections.find((s) => s.type === 'mentoring')!
    expect(m.enabled).toBe(false)
    expect(applyAudience(c, view({ showSectionIds: [m.id] })).portfolio.sections.find((s) => s.id === m.id)?.enabled).toBe(true)
    expect(applyAudience(c, view({ showSectionIds: [m.id], hideSectionIds: [m.id] })).portfolio.sections.find((s) => s.id === m.id)?.enabled).toBe(false)
    expect(c.portfolio.sections.find((s) => s.id === m.id)?.enabled).toBe(false)
  })
  it('keeps the order through saving and loading', () => {
    const c = normalizeContent({ ...baseContent, audiences: [{ id: 'a', slug: 'clients', name: 'Clients', sectionOrder: ['contact', 'work'], showSectionIds: ['mentoring'] }] })
    expect(c.audiences[0].sectionOrder).toEqual(['contact', 'work'])
    expect(c.audiences[0].showSectionIds).toEqual(['mentoring'])
    expect(validateContent(c).ok).toBe(true)
    expect(normalizeContent({ ...baseContent, audiences: [{ id: 'old', slug: 'old-view', name: 'Old' }] }).audiences[0].sectionOrder).toEqual([])
  })
})
