/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../server/index.mjs'
import { chunk, createTranslate, decodeEntities, validEmail, validLang } from '../server/translate.mjs'
import { translateFields, translateRich } from '../src/utils/translate'
import { translatableFields, applyLanguage, setText } from '../src/content/derive'
import { baseContent, normalizeContent } from '../src/content/bundle'
import { newLanguage, newProject, newFaq } from '../src/content/factories'

/** A pretend translator: marks every word, leaves the held back pieces alone, as a good translator does. */
const fake = (calls: string[][] = []) => async (texts: string[]) => { calls.push(texts); return texts.map((t) => t.split(/(ZQX\d+ZQX|\s+)/).map((w) => (/^ZQX\d+ZQX$/.test(w) || /^\s*$/.test(w) ? w : `<${w}>`)).join('')) }

describe('translating written text without breaking it', () => {
  it('translates plain sentences', async () => {
    const r = await translateRich('Hello there', fake())
    expect(r).toEqual({ text: '<Hello> <there>', kept: 0 })
  })
  it('keeps links working while translating their label', async () => {
    const r = await translateRich('See [my work](https://example.com/a?b=1&c=2) now.', fake())
    expect(r.text).toContain('](https://example.com/a?b=1&c=2)')
    expect(r.text).toMatch(/\[<my> <work>\]/)
    expect(r.kept).toBe(0)
  })
  it('keeps web and email addresses exactly', async () => {
    const r = await translateRich('Write to ada@example.com or visit https://ada.example/x today', fake())
    expect(r.text).toContain('ada@example.com')
    expect(r.text).toContain('https://ada.example/x')
  })
  it('keeps bullets, numbers and blank lines where they were', async () => {
    const src = 'Intro line\n\n- First point\n- Second point\n1. Step one'
    const r = await translateRich(src, fake())
    expect(r.text.split('\n').map((l) => l.slice(0, 3))).toEqual(['<In', '', '- <', '- <', '1. '])
    expect(r.text.split('\n')).toHaveLength(5)
  })
  it('leaves a line in the original language if the translator damages a link', async () => {
    const lossy = async (texts: string[]) => texts.map((t) => t.replace(/ZQX\d+ZQX/g, ''))
    const r = await translateRich('Read [this](https://a.example) first', lossy)
    expect(r).toEqual({ text: 'Read [this](https://a.example) first', kept: 1 })
  })
  it('drops bold markers that came back unpaired rather than publish broken text', async () => {
    const r = await translateRich('I use **HubSpot** daily', async (t) => t.map(() => 'J\'utilise **HubSpot chaque jour'))
    expect(r.text).toBe("J'utilise HubSpot chaque jour")
    const ok = await translateRich('I use **HubSpot** daily', async (t) => t.map(() => "J'utilise **HubSpot** chaque jour"))
    expect(ok.text).toBe("J'utilise **HubSpot** chaque jour")
  })
  it('does not send numbers or lone links to the translator', async () => {
    const calls: string[][] = []
    const r = await translateRich('2026\n\nhttps://example.com', fake(calls))
    expect(calls).toEqual([])
    expect(r.text).toBe('2026\n\nhttps://example.com')
  })
  it('translates each distinct sentence once across many fields, and reports progress', async () => {
    const calls: string[][] = []
    const seen: number[] = []
    const eng = { name: 'fake', translate: fake(calls) }
    const r = await translateFields([{ path: 'a', value: 'Read more' }, { path: 'b', value: 'Read more' }, { path: 'c', value: 'Contact me' }], eng, { onProgress: (d) => seen.push(d) })
    expect(calls.flat().sort()).toEqual(['Contact me', 'Read more'])
    expect(r.translated).toEqual({ a: '<Read> <more>', b: '<Read> <more>', c: '<Contact> <me>' })
    expect(seen).toEqual([1, 2, 3])
  })
  it('can be stopped, and a fatal error hands back what was already done', async () => {
    const ctl = new AbortController()
    const eng = { name: 'fake', translate: async (t: string[]) => { ctl.abort(); return fake()(t) } }
    const r = await translateFields([{ path: 'a', value: 'One' }, { path: 'b', value: 'Two' }], eng, { signal: ctl.signal })
    expect(Object.keys(r.translated)).toEqual(['a'])
    let n = 0
    const quota = { name: 'q', translate: async (t: string[]) => { if (++n > 1) throw Object.assign(new Error('Allowance used'), { fatal: true }); return fake()(t) } }
    await expect(translateFields([{ path: 'a', value: 'One' }, { path: 'b', value: 'Two' }], quota)).rejects.toMatchObject({ message: 'Allowance used', partial: { translated: { a: '<One>' } } })
  })
})

describe('what gets translated', () => {
  const site = () => {
    const c = normalizeContent(baseContent)
    c.projects = [{ ...newProject(), id: 'p', title: 'Lead lifecycle', client: 'Acme Corp', category: 'CRM', description: 'A CRM rebuild', role: 'Architect', year: '2026', externalLink: 'https://acme.example', caseStudy: { objective: 'Fewer drops', challenge: 'Slow follow up', strategy: 'Automate', execution: ['Mapped the funnel', 'Built flows'], lessons: ['Start small'], contribution: { personal: ['Owned the design'] }, metrics: [{ label: 'Win rate', period: 'Q1', note: 'up' }] } as any, blocks: [{ id: 'b', type: 'paragraph', text: 'Block text' }, { id: 'q', type: 'query', code: 'SELECT 1', language: 'sql', title: 'Leads by source' }] as any, hidden: false }]
    c.tools = [{ id: 't', name: 'HubSpot', category: 'Design', confirmed: true, usage: 'Lifecycle automation' }]
    c.faqs = [{ ...newFaq(), id: 'f', question: 'Do you freelance?', answer: 'Yes, see [rates](https://a.example).', topic: 'Pricing', hidden: false }]
    return c
  }
  it('covers case studies, blocks, results, tools and questions', () => {
    const f = Object.fromEntries(translatableFields(site()).map((x) => [x.path, x.value]))
    expect(f['projects.p.caseStudy.challenge']).toBe('Slow follow up')
    expect(f['projects.p.caseStudy.execution.0']).toBe('Mapped the funnel')
    expect(f['projects.p.caseStudy.contribution.personal.0']).toBe('Owned the design')
    expect(f['projects.p.blocks.b.text']).toBe('Block text')
    expect(f['projects.p.blocks.q.title']).toBe('Leads by source')
    expect(f['tools.t.usage']).toBe('Lifecycle automation')
    expect(f['faqs.f.question']).toBe('Do you freelance?')
  })
  it('leaves names, clients, links, code, categories and numbers alone', () => {
    const paths = translatableFields(site()).map((x) => x.path)
    for (const never of ['tools.t.name', 'projects.p.client', 'projects.p.category', 'projects.p.year', 'projects.p.externalLink', 'projects.p.blocks.q.code', 'projects.p.blocks.q.language', 'faqs.f.topic']) expect(paths).not.toContain(never)
  })
  it('lists only paths that can be written back, and applies them', () => {
    const c = site()
    const fields = translatableFields(c)
    for (const x of fields) expect(setText(structuredClone(c), x.path, 'z')).toBe(true)
    const pack = { ...newLanguage(), code: 'fr', label: 'Francais', text: { 'projects.p.caseStudy.execution.1': 'Flux construits', 'projects.p.blocks.b.text': 'Texte du bloc' } }
    const out = applyLanguage(c, pack)
    expect((out.projects[0].caseStudy as any).execution).toEqual(['Mapped the funnel', 'Flux construits'])
    expect((out.projects[0].blocks as any)[0].text).toBe('Texte du bloc')
    expect((c.projects[0].caseStudy as any).execution[1]).toBe('Built flows')
  })
})

describe('the free translation service', () => {
  it('cuts long text at sentence ends under the size limit', () => {
    const long = Array.from({ length: 40 }, (_v, i) => `This is sentence number ${i}.`).join(' ')
    const parts = chunk(long)
    expect(parts.length).toBeGreaterThan(2)
    for (const p of parts) expect(Buffer.byteLength(p)).toBeLessThanOrEqual(450)
    expect(parts.join(' ')).toBe(long)
    expect(chunk('Short')).toEqual(['Short'])
    expect(chunk('é'.repeat(400)).every((p: string) => Buffer.byteLength(p) <= 450)).toBe(true)
  })
  it('decodes the entities the service sends back, and checks codes and emails', () => {
    expect(decodeEntities('L&#39;&eacute;t&eacute; &amp; l&quot;hiver &#x41;')).toBe("L'&eacute;t&eacute; & l\"hiver A")
    expect(validLang('fr')).toBe(true); expect(validLang('pt-BR')).toBe(true); expect(validLang('french')).toBe(false); expect(validLang('')).toBe(false)
    expect(validEmail('a@b.co')).toBe(true); expect(validEmail('nope')).toBe(false)
  })
  const reply = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status })
  it('asks for the right language pair, adds the email, and joins the pieces', async () => {
    const urls: URL[] = []
    const t = createTranslate({ fetchImpl: (async (u: URL) => { urls.push(u); return new Response(JSON.stringify({ responseStatus: 200, responseData: { translatedText: `FR(${u.searchParams.get('q')})` } })) }) as any })
    const out = await t.texts(['Hello', 'Bye'], { from: 'en', to: 'fr', email: 'me@example.com' })
    expect(out).toEqual(['FR(Hello)', 'FR(Bye)'])
    expect(urls[0].searchParams.get('langpair')).toBe('en|fr')
    expect(urls[0].searchParams.get('de')).toBe('me@example.com')
    const anon = createTranslate({ fetchImpl: (async (u: URL) => { urls.push(u); return new Response(JSON.stringify({ responseStatus: 200, responseData: { translatedText: 'ok' } })) }) as any })
    await anon.texts(['x'], { from: 'en', to: 'es', email: 'not-an-email' })
    expect(urls[urls.length - 1].searchParams.has('de')).toBe(false)
  })
  it('explains when the free allowance is used up, and when the service is down', async () => {
    const q = createTranslate({ fetchImpl: reply({ quotaFinished: true, responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY' }, responseStatus: 200 }) as any })
    await expect(q.texts(['x'], { from: 'en', to: 'fr' })).rejects.toMatchObject({ status: 429, message: expect.stringMatching(/allowance/) })
    const down = createTranslate({ fetchImpl: (async () => { throw new Error('offline') }) as any })
    await expect(down.texts(['x'], { from: 'en', to: 'fr' })).rejects.toMatchObject({ status: 502 })
    await expect(createTranslate().texts(['x'], { from: 'en', to: 'nope!' })).rejects.toMatchObject({ status: 400 })
  })
})

describe('the translate route', () => {
  let dir = ''
  let server: Server
  let base = ''
  let app: any
  let cookie = ''
  const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
  const seen: URL[] = []
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'sam-tr-'))
    const dist = join(dir, 'dist'); mkdirSync(dist)
    writeFileSync(join(dist, 'index.html'), '<!doctype html><html><head><!--head:start--><!--head:end--></head><body></body></html>')
    const fetchImpl = async (u: URL) => { seen.push(u); return new Response(JSON.stringify({ responseStatus: 200, responseData: { translatedText: `FR ${u.searchParams.get('q')}` } })) }
    app = await createApp({ dataDir: join(dir, 'data'), distDir: dist, env: {}, deps: { fetchImpl } })
    await app.auth.setCredentials('owner', 'correct horse battery staple')
    await new Promise<void>((ok) => { server = app.app.listen(0, '127.0.0.1', () => ok()) })
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    cookie = ((await fetch(base + '/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })).headers.get('set-cookie') ?? '').split(';')[0]
  })
  afterAll(async () => { server?.close(); await app?.close(); rmSync(dir, { recursive: true, force: true }) })
  const post = (body: unknown, withCookie = true) => fetch(base + '/api/admin/translate', { method: 'POST', headers: { ...H, ...(withCookie ? { cookie } : {}) }, body: JSON.stringify(body) })

  it('needs you to be signed in', async () => { expect((await post({ texts: ['Hi'], from: 'en', to: 'fr' }, false)).status).toBe(401) })
  it('translates for the signed in owner', async () => {
    const r = await post({ texts: ['Hello', 'World'], from: 'en', to: 'fr', email: '' })
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ texts: ['FR Hello', 'FR World'] })
    expect(seen[0].searchParams.get('langpair')).toBe('en|fr')
  })
  it('refuses nonsense', async () => {
    expect((await post({ texts: ['Hi'], from: 'en', to: 'en-GB' })).status).toBe(400)
    expect((await post({ texts: [], from: 'en', to: 'fr' })).status).toBe(400)
    expect((await post({ texts: ['x'.repeat(6001)], from: 'en', to: 'fr' })).status).toBe(400)
    expect((await post({ texts: Array(31).fill('a'), from: 'en', to: 'fr' })).status).toBe(400)
    expect((await post({ texts: ['Hi'], from: 'en', to: 'fr', email: 'bad' })).status).toBe(400)
  })
})

describe('translations typed in by hand', () => {
  it('are recovered when an older version saved them as nested objects', async () => {
    const { flattenStrings } = await import('../src/content/bundle')
    expect(flattenStrings({ 'a.b': 'flat', faqs: { f1: { question: 'Q' } }, menu: { open: 'Ouvrir' }, skip: 'Aller', n: 5 })).toEqual({ 'a.b': 'flat', 'faqs.f1.question': 'Q', 'menu.open': 'Ouvrir', skip: 'Aller' })
    const c = normalizeContent({ ...baseContent, portfolio: { ...baseContent.portfolio, i18n: { ...baseContent.portfolio.i18n, enabled: true, languages: [{ code: 'fr', label: 'Francais', rtl: false, ui: { menu: { open: 'Ouvrir le menu' } }, text: { projects: { p: { title: 'Titre' } } } }] } } } as any)
    const l = c.portfolio.i18n.languages[0]
    expect(l.ui['menu.open']).toBe('Ouvrir le menu')
    expect(l.text['projects.p.title']).toBe('Titre')
    expect(l.auto).toEqual([])
    const p = { ...c, projects: [{ ...newProject(), id: 'p', title: 'Title', hidden: false }] }
    expect(applyLanguage(p, l).projects[0].title).toBe('Titre')
  })
  it('older content without any language settings still loads', () => {
    const c = normalizeContent({ ...baseContent, portfolio: { ...baseContent.portfolio, i18n: undefined } } as any)
    expect(c.portfolio.i18n.languages).toEqual([])
    expect(c.portfolio.i18n.translateEmail).toBe('')
  })
})
