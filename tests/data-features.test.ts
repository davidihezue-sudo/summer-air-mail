/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../server/index.mjs'
import { buildCsp, buildFullSitemap, dashboardEmbedUrl, pageSeo } from '../shared/head.mjs'
import { validateContent } from '../server/validate.mjs'
import { highlight } from '../src/utils/highlight'
import { buildVCard } from '../src/utils/vcard'
import { parseRoute } from '../src/utils/route'
import { pctOf, resultRows, resultsToCsv, sortRows } from '../src/content/resultsData'
import { BLOCK_LABELS, newBlock } from '../src/content/factories'
import { BLOCK_FIELDS } from '../src/admin/blocks'
import { baseContent, normalizeContent } from '../src/content/bundle'
import { SECTION_LABELS } from '../src/content/sections'
import { sectionHasContent } from '../src/content/selectors'
import type { ResultEntry } from '../src/content/types'

const result = (o: Partial<ResultEntry>): ResultEntry => ({ id: 'r', metric: 'Reach', period: 'Q1', chart: 'bar', classification: 'verified', ...o }) as ResultEntry

describe('results explorer data', () => {
  it('only reports or calculates a change, never invents one', () => {
    expect(pctOf({ start: 100, end: 150 })).toEqual({ value: 50, calculated: true })
    expect(pctOf({ start: 100, end: 150, pctChange: 40 })).toEqual({ value: 40, calculated: false })
    expect(pctOf({ start: 0, end: 150 })).toBeNull()
    expect(pctOf({ end: 150 })).toBeNull()
  })
  it('flattens results and hides confidential numbers', () => {
    const rows = resultRows([
      result({ id: 'a', metric: 'Reach', start: 100, end: 250, platform: 'instagram', projectId: 'p1' }),
      result({ id: 'b', metric: 'Secret', start: 1, end: 9, classification: 'confidential', showValues: false }),
    ], [{ id: 'p1', title: 'Launch' }])
    expect(rows[0]).toMatchObject({ change: 150, changeKind: 'calculated', project: 'Launch', masked: false })
    expect(rows[1]).toMatchObject({ start: null, end: null, change: null, masked: true })
  })
  it('sorts by biggest change, name or platform', () => {
    const rows = resultRows([result({ id: 'a', metric: 'B', start: 10, end: 11, platform: 'x' }), result({ id: 'b', metric: 'A', start: 10, end: 30, platform: 'a' }), result({ id: 'c', metric: 'C' })])
    expect(sortRows(rows, 'change').map((r) => r.id)).toEqual(['b', 'a', 'c'])
    expect(sortRows(rows, 'metric').map((r) => r.metric)).toEqual(['A', 'B', 'C'])
    expect(sortRows(rows, 'platform')[0].platform).toBe('')
  })
  it('exports a spreadsheet file that cannot run formulas', () => {
    const csv = resultsToCsv(resultRows([result({ metric: '=SUM(1)', start: 1, end: 2, campaign: 'A, "B"' })]))
    expect(csv.split('\r\n')[0]).toBe('Metric,Platform,Campaign,Project,Period,Start,End,Unit,Change %,Change source,Type')
    expect(csv).toContain("'=SUM(1)")
    expect(csv).toContain('"A, ""B"""')
    expect(csv).toContain(',100,calculated,verified')
  })
})

describe('new content blocks', () => {
  it('have a label, a starting shape and an admin form', () => {
    for (const t of ['flow', 'query', 'dashboard', 'metricTree'] as const) {
      expect(BLOCK_LABELS[t], t).toBeTruthy()
      expect(newBlock(t).type).toBe(t)
      expect(BLOCK_FIELDS[t].length, t).toBeGreaterThan(1)
    }
    expect(newBlock('dashboard').height).toBe(520)
    expect(newBlock('query').language).toBe('sql')
  })
  it('keeps the block data through normalisation', () => {
    const block = { ...newBlock('flow'), nodes: [{ label: 'Lead', kind: 'decision', detail: 'x', branches: [{ condition: 'score high', outcome: 'sales' }] }] }
    const c = normalizeContent({ projects: [{ id: 'p', title: 'P', blocks: [block] }] })
    expect(c.projects[0].blocks?.[0].nodes?.[0].branches?.[0].outcome).toBe('sales')
  })
})

describe('code highlighting', () => {
  it('never changes the text', () => {
    const sql = "SELECT user_id, COUNT(*) AS n -- how many\nFROM events WHERE day >= '2026-01-01' AND score > 3.5 GROUP BY 1;"
    for (const lang of ['sql', 'python', 'dax', 'r', 'other']) expect(highlight(sql, lang).map((t) => t.text).join('')).toBe(sql)
  })
  it('marks keywords, strings, numbers, comments and functions', () => {
    const types = (code: string, lang: string) => Object.fromEntries(highlight(code, lang).filter((t) => t.type !== 'text').map((t) => [t.text, t.type]))
    expect(types("select date_trunc('day', ts) from t where a = 'x' and b > 3 -- note", 'sql')).toMatchObject({ select: 'keyword', date_trunc: 'function', "'day'": 'string', '3': 'number', '-- note': 'comment', where: 'keyword' })
    expect(types('import pandas as pd  # load', 'python')).toMatchObject({ import: 'keyword', as: 'keyword', '# load': 'comment' })
    expect(highlight('select 1', 'other').every((t) => t.type !== 'keyword')).toBe(true)
  })
  it('does not colour a word that only contains a keyword', () => {
    expect(highlight('selection', 'sql')).toEqual([{ type: 'text', text: 'selection' }])
  })
})

describe('dashboard embeds', () => {
  it('allows only the listed reporting sites, over https', () => {
    expect(dashboardEmbedUrl('https://lookerstudio.google.com/reporting/abc/page/p1')).toBe('https://lookerstudio.google.com/embed/reporting/abc/page/p1')
    expect(dashboardEmbedUrl('https://lookerstudio.google.com/embed/reporting/abc/page/p1')).toBe('https://lookerstudio.google.com/embed/reporting/abc/page/p1')
    expect(dashboardEmbedUrl('https://public.tableau.com/views/Book/Sheet?:embed=y')).toContain('public.tableau.com')
    expect(dashboardEmbedUrl('https://app.powerbi.com/view?r=abc')).toContain('app.powerbi.com')
    for (const bad of ['http://lookerstudio.google.com/reporting/x', 'https://evil.example/x', 'javascript:alert(1)', 'https://lookerstudio.google.com.evil.example/x', '', undefined]) expect(dashboardEmbedUrl(bad), String(bad)).toBe('')
  })
  it('lets the page frame only those sites', () => {
    const csp = buildCsp({})
    expect(csp).toContain('https://lookerstudio.google.com')
    expect(csp).toContain('https://public.tableau.com')
    expect(csp).toContain('https://app.powerbi.com')
    expect(csp).toMatch(/frame-src [^;]*youtube-nocookie/)
    expect(csp).not.toContain('frame-src *')
  })
})

describe('business card', () => {
  const portfolio = { profile: { fullName: 'Ada Lovelace', preferredName: 'Ada', title: 'Analyst, CRM architect', email: 'ada@example.com', phone: '+1 555 0100', location: 'Toronto, ON', social: { linkedin: 'https://linkedin.com/in/ada', instagram: '', tiktok: '', facebook: '', youtube: '', pinterest: '', website: '' } } }
  it('builds a vCard from only what is filled in, escaping special characters', () => {
    const v = buildVCard(portfolio as any, 'https://ada.example')
    expect(v).toContain('BEGIN:VCARD\r\nVERSION:3.0')
    expect(v).toContain('N:Lovelace;Ada;;;')
    expect(v).toContain('FN:Ada Lovelace')
    expect(v).toContain('TITLE:Analyst\\, CRM architect')
    expect(v).toContain('EMAIL;TYPE=INTERNET:ada@example.com')
    expect(v).toContain('URL:https://ada.example')
    expect(v).toContain('URL;TYPE=linkedin:https://linkedin.com/in/ada')
    expect(v).not.toContain('instagram')
    expect(v.endsWith('END:VCARD\r\n')).toBe(true)
    expect(buildVCard({ profile: { ...portfolio.profile, email: '', phone: '', location: '' } } as any)).not.toMatch(/EMAIL|TEL|ADR/)
    expect(buildVCard({ profile: { ...portfolio.profile, title: 'a;b,c\\d' } } as any)).toContain('TITLE:a\\;b\\,c\\\\d')
  })
  it('has a route, and appears in the sitemap and page SEO only when switched on', () => {
    expect(parseRoute('/card')).toEqual({ kind: 'card' })
    const off = { portfolio: { site: { url: 'https://x.example' }, profile: { fullName: 'Ada' }, card: { enabled: false } } }
    const on = { portfolio: { ...off.portfolio, card: { enabled: true } } }
    expect(pageSeo(off, '/card')).toEqual({ missing: true })
    expect(pageSeo(on, '/card')).toMatchObject({ title: 'Ada | Business card', canonical: 'https://x.example/card' })
    expect(buildFullSitemap(off)).not.toContain('/card')
    expect(buildFullSitemap(on)).toContain('https://x.example/card')
  })
})

describe('the server accepts every section the site offers', () => {
  it('has no section type the admin can add but the server rejects', () => {
    for (const type of Object.keys(SECTION_LABELS)) {
      const c = structuredClone(baseContent) as any
      c.portfolio.sections = [{ id: 'x-1', type, enabled: true }]
      const r = validateContent(c) as { ok: boolean; error?: string }
      expect(r.ok, `${type}: ${r.error}`).toBe(true)
    }
  })
})

describe('public stats section', () => {
  it('is a section type that is off by default and visible only when allowed', () => {
    expect(SECTION_LABELS.siteStats).toBeTruthy()
    const s = baseContent.portfolio.sections.find((x) => x.type === 'siteStats')
    expect(s?.enabled).toBe(false)
    expect(sectionHasContent('siteStats', baseContent, s)).toBe(false)
    const on = structuredClone(baseContent)
    on.portfolio.publicStats.enabled = true
    expect(sectionHasContent('siteStats', on, s)).toBe(true)
  })
})

describe('public stats endpoint', () => {
  let dir: string
  let server: Server
  let base: string
  let cookie = ''
  const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'sam-stats-'))
    const dist = join(dir, 'dist'); mkdirSync(dist)
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html lang="en"><head><!--head:start--><!--head:end--></head><body></body></html>')
    const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env: { TRUST_PROXY: '1' } })
    await auth.setCredentials('owner', 'correct horse battery staple')
    await new Promise<void>((ok) => { server = app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })
    cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
  })
  afterAll(() => { server.close(); rmSync(dir, { recursive: true, force: true }) })
  const publish = async (mutate: (c: any) => void) => {
    const c = structuredClone(baseContent) as any
    mutate(c)
    const d = await (await fetch(base + '/api/admin/draft', { headers: { ...H, cookie } })).json()
    const put = await fetch(base + '/api/admin/draft', { method: 'PUT', headers: { ...H, cookie }, body: JSON.stringify({ content: c, baseRev: d.rev ?? 0 }) })
    expect(put.status, await put.clone().text()).toBe(200)
    expect((await fetch(base + '/api/admin/publish', { method: 'POST', headers: { ...H, cookie }, body: '{}' })).status).toBe(200)
  }
  const visit = (path: string, ip: string) => fetch(base + '/api/track', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ type: 'view', path }) })

  it('is not available until the owner switches it on', async () => {
    await publish((c) => { c.portfolio.insights.enabled = true })
    expect((await fetch(base + '/api/stats')).status).toBe(404)
  })
  it('shows real counts without application links or the admin, and honours the switches', async () => {
    await publish((c) => { c.portfolio.insights.enabled = true; c.portfolio.publicStats = { enabled: true, rangeDays: '7', showViews: true, showTopPages: true, note: '' } })
    await visit('/', '203.0.113.1'); await visit('/', '203.0.113.2'); await visit('/work/a', '203.0.113.2'); await visit('/for/secret-co', '203.0.113.3'); await visit('/admin', '203.0.113.4')
    const r = await fetch(base + '/api/stats')
    expect(r.status).toBe(200)
    expect(r.headers.get('cache-control')).toContain('max-age=300')
    const j = await r.json()
    expect(j.range).toBe(7)
    expect(j.visitors).toBe(4)
    expect(j.views).toBe(5)
    expect(j.series).toHaveLength(7)
    expect(j.topPages.map((p: any) => p.path).sort()).toEqual(['/', '/work/a'])
    expect(JSON.stringify(j.topPages)).not.toMatch(/secret-co|\/admin/)
    await publish((c) => { c.portfolio.insights.enabled = true; c.portfolio.publicStats = { enabled: true, rangeDays: 30, showViews: false, showTopPages: false, note: '' } })
    const j2 = await (await fetch(base + '/api/stats')).json()
    expect(j2.views).toBeNull()
    expect(j2.topPages).toEqual([])
    expect(j2.range).toBe(30)
  })
})
