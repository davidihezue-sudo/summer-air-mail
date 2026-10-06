/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../server/index.mjs'
import { validateContent } from '../server/validate.mjs'
import { buildFaqJsonLd } from '../shared/head.mjs'
import { baseContent, normalizeContent } from '../src/content/bundle'
import { defaultSections, SECTION_LABELS } from '../src/content/sections'
import { getFaqs, resolveSections, sectionHasContent } from '../src/content/selectors'
import { newFaq } from '../src/content/factories'
import { searchItems } from '../src/utils/siteSearch'

const q = (over: Record<string, unknown> = {}) => ({ ...newFaq(), id: String(over.id ?? 'a'), question: 'How do you work?', answer: 'I start with **goals**.\n\n- Plan\n- Make', hidden: false, ...over })
const withFaqs = (faqs: any[]) => normalizeContent({ ...baseContent, faqs })

describe('FAQ section', () => {
  it('sits just before contact and is labelled', () => {
    const ids = defaultSections().map((s) => s.type)
    expect(ids.indexOf('faq')).toBe(ids.indexOf('contact') - 1)
    expect(SECTION_LABELS.faq).toBeTruthy()
  })
  it('stays hidden until a published question has an answer', () => {
    expect(sectionHasContent('faq', baseContent)).toBe(false)
    expect(sectionHasContent('faq', withFaqs([q({ hidden: true })]))).toBe(false)
    expect(sectionHasContent('faq', withFaqs([q({ answer: '   ' })]))).toBe(false)
    expect(sectionHasContent('faq', withFaqs([q({ question: '' })]))).toBe(false)
    const c = withFaqs([q()])
    expect(sectionHasContent('faq', c)).toBe(true)
    expect(resolveSections(c).find((s) => s.config.type === 'faq')?.visible).toBe(true)
    expect(getFaqs(c)).toHaveLength(1)
  })
  it('keeps questions through normalisation and gives older content none', () => {
    expect(normalizeContent({ ...baseContent, faqs: undefined }).faqs).toEqual([])
    const c = withFaqs([q({ topic: 'Pricing' }), { id: 'broken' }, q({ id: 'a' })])
    expect(c.faqs.map((x) => x.id)).toEqual(['a', 'broken'])
    expect(c.faqs[0].topic).toBe('Pricing')
  })
  it('is accepted by the server when saved', () => {
    const c = withFaqs([q()])
    expect(validateContent(c).ok).toBe(true)
  })
  it('is found by the visitor search', () => {
    const items = [{ id: 'f-a', kind: 'FAQ' as const, title: 'How do you price projects?', detail: 'Pricing I quote per project', action: { type: 'faq' as const, id: 'a', section: 'faq' } }]
    expect(searchItems(items, 'pricing')[0]?.kind).toBe('FAQ')
  })
})

describe('FAQ markup for search engines', () => {
  const sections = baseContent.portfolio.sections
  const on = (faqs: any[], enabled = true) => ({ ...baseContent, faqs, portfolio: { ...baseContent.portfolio, sections: sections.map((s) => (s.type === 'faq' ? { ...s, enabled } : s)) } })
  it('describes only what visitors can see', () => {
    expect(buildFaqJsonLd(on([]))).toBeNull()
    expect(buildFaqJsonLd(on([q()], false))).toBeNull()
    expect(buildFaqJsonLd(on([q({ hidden: true })]))).toBeNull()
    expect(buildFaqJsonLd(on([q({ answer: '' })]))).toBeNull()
  })
  it('treats a site saved before the FAQ existed as having the section switched on, as the page does', () => {
    const old = { ...baseContent, faqs: [q()], portfolio: { ...baseContent.portfolio, sections: sections.filter((s) => s.type !== 'faq') } }
    expect(buildFaqJsonLd(old)).not.toBeNull()
  })
  it('turns the light formatting into plain text', () => {
    const ld = buildFaqJsonLd(on([q({ answer: 'See [my work](https://example.com).\n\n**Bold** and *soft*.\n\n- one\n- two' })])) as any
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity[0].name).toBe('How do you work?')
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('See my work. Bold and soft. one two')
  })
})

describe('FAQ on the served home page', () => {
  let dir = ''
  let server: Server
  let base = ''
  let cookie = ''
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'sam-faq-'))
    const dist = join(dir, 'dist'); mkdirSync(dist)
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html lang="en"><head><!--head:start--><!--head:end--></head><body></body></html>')
    const app = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env: {} })
    await app.auth.setCredentials('owner', 'correct horse battery staple')
    await new Promise<void>((ok) => { server = app.app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
    const r = await fetch(base + '/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })
    cookie = (r.headers.get('set-cookie') ?? '').split(';')[0]
    const publish = async (content: unknown) => {
      const d = await (await fetch(base + '/api/admin/draft', { headers: { ...H, cookie } })).json()
      const put = await fetch(base + '/api/admin/draft', { method: 'PUT', headers: { ...H, cookie }, body: JSON.stringify({ content, baseRev: d.rev ?? 0 }) })
      expect(put.status).toBe(200)
      expect((await fetch(base + '/api/admin/publish', { method: 'POST', headers: { ...H, cookie }, body: '{}' })).status).toBe(200)
    }
    ;(globalThis as any).__publish = publish
    ;(globalThis as any).__app = app
  })
  afterAll(async () => { server?.close(); await (globalThis as any).__app?.close(); rmSync(dir, { recursive: true, force: true }) })

  it('adds the questions to the page, leaves hidden ones out, and never puts markup on other pages', async () => {
    await (globalThis as any).__publish({ ...baseContent, faqs: [q({ id: 'one' }), q({ id: 'two', question: 'Secret draft?', hidden: true })] })
    const home = await (await fetch(base + '/')).text()
    expect(home).toContain('"@type":"FAQPage"')
    expect(home).toContain('How do you work?')
    expect(home).not.toContain('Secret draft?')
    const view = home.match(/id="sam-content"[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? ''
    expect(view).not.toContain('Secret draft?')
    expect(await (await fetch(base + '/profile')).text()).not.toContain('FAQPage')
  })
  it('adds nothing when there are no published questions', async () => {
    await (globalThis as any).__publish({ ...baseContent, faqs: [] })
    expect(await (await fetch(base + '/')).text()).not.toContain('FAQPage')
  })
})
