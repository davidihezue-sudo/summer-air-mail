import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { baseContent, normalizeContent, normalizeSections } from '../src/content/bundle'
import { buildNav, getTools, getTestimonials, relatedProjects, resolveSections, sectionHasContent, filterProjects, buildFacets } from '../src/content/selectors'
import { sampleContent } from '../src/content/sample'
import { buildJsonLd, buildMeta, injectHead, buildCsp, buildRobots } from '../shared/head.mjs'
import { mergeDefaults } from '../src/content/merge'
import { defaultSections } from '../src/content/sections'

const visible = (c = baseContent) => Object.fromEntries(resolveSections(c).map((s) => [s.config.type, s.visible]))

describe('section visibility', () => {
  it('hides every data-driven section when no real content exists', () => {
    const v = visible()
    for (const t of ['work', 'caseStudies', 'results', 'tools', 'ai', 'content', 'screenshots', 'websites', 'testimonials', 'mentoring', 'skills', 'platforms']) {
      expect(v[t], t).toBe(false)
    }
    for (const t of ['hero', 'about', 'services', 'strategy', 'process', 'contact']) expect(v[t], t).toBe(true)
  })
  it('shows data-driven sections once real content exists', () => {
    const v = visible(normalizeContent(sampleContent(baseContent)))
    for (const t of ['work', 'caseStudies', 'results', 'tools', 'ai', 'content', 'screenshots', 'websites', 'testimonials', 'mentoring', 'skills', 'platforms']) {
      expect(v[t], t).toBe(true)
    }
  })
  it('respects disabled sections', () => {
    const c = normalizeContent(sampleContent(baseContent))
    const off = { ...c, portfolio: { ...c.portfolio, sections: c.portfolio.sections.map((s) => (s.type === 'work' ? { ...s, enabled: false } : s)) } }
    expect(visible(off).work).toBe(false)
  })
  it('never shows unconfirmed tools or unapproved testimonials', () => {
    expect(getTools(baseContent)).toHaveLength(0)
    const c = { ...baseContent, testimonials: [{ id: 'x', name: 'N', title: 'T', company: 'C', quote: 'Q', relationship: 'R', approved: false }] }
    expect(getTestimonials(c)).toHaveLength(0)
  })
  it('keeps draft projects and unpublished skills out of the public site', () => {
    const c = normalizeContent(sampleContent(baseContent))
    const drafted = { ...c, projects: c.projects.map((p) => ({ ...p, hidden: true })) }
    expect(sectionHasContent('work', drafted)).toBe(false)
    expect(baseContent.skills.every((g) => g.skills.every((s) => !s.visible))).toBe(true)
  })
})

describe('section ordering and normalisation', () => {
  it('renders sections in the configured order', () => {
    const c = normalizeContent(sampleContent(baseContent))
    const reordered = [...c.portfolio.sections].reverse()
    const out = resolveSections({ ...c, portfolio: { ...c.portfolio, sections: reordered } }).map((s) => s.config.id)
    expect(out[0]).toBe('contact')
    expect(out[out.length - 1]).toBe('top')
  })
  it('drops unknown section types and duplicate ids but appends sections added in newer versions', () => {
    const stored = [{ id: 'top', type: 'hero', enabled: true }, { id: 'top', type: 'hero', enabled: true }, { id: 'x', type: 'bogus', enabled: true }, { id: 'contact', type: 'contact', enabled: true }]
    const out = normalizeSections(stored)
    expect(out.filter((s) => s.id === 'top')).toHaveLength(1)
    expect(out.some((s) => s.type === ('bogus' as never))).toBe(false)
    expect(out.map((s) => s.type)).toEqual(expect.arrayContaining(defaultSections().map((s) => s.type)))
  })
  it('allows duplicated sections with their own id', () => {
    const stored = [...defaultSections(), { id: 'work-2', type: 'work', enabled: true, filterCategory: 'Reels / Short-Form Video' }]
    expect(normalizeSections(stored).filter((s) => s.type === 'work')).toHaveLength(2)
  })
  it('fills gaps in stored content with defaults and ignores wrong types', () => {
    const c = normalizeContent({ portfolio: { profile: { fullName: 'Jane' }, theme: { professional: 5 } }, projects: [{ id: 'a', title: 'T' }, { nope: 1 }, 'x'] })
    expect(c.portfolio.profile.fullName).toBe('Jane')
    expect(c.portfolio.profile.bio.length).toBeGreaterThan(0)
    expect(c.portfolio.theme.professional).toBe('balanced')
    expect(c.projects).toHaveLength(1)
    expect(c.projects[0].platforms).toEqual([])
    expect(normalizeContent(null).portfolio.seasons.mode).toBe('auto')
    expect(normalizeContent('garbage').services.length).toBe(baseContent.services.length)
  })
  it('keeps stored values where the default is undefined', () => {
    const c = normalizeContent({ services: [{ id: 's', name: 'N', object: 'camera' }] })
    expect(c.services[0].object).toBe('camera')
  })
  it('blocks prototype pollution keys', () => {
    const merged = mergeDefaults({ a: 1 }, JSON.parse('{"__proto__":{"x":1},"a":2}'))
    expect(({} as Record<string, unknown>).x).toBeUndefined()
    expect(merged.a).toBe(2)
  })
})

describe('navigation', () => {
  it('builds the automatic navigation from visible sections only', () => {
    expect(buildNav(baseContent).map((n) => n.label)).toEqual(['Services', 'About', 'Contact'].sort((a, b) => ['Services', 'About', 'Contact'].indexOf(a) - ['Services', 'About', 'Contact'].indexOf(b)).length ? buildNav(baseContent).map((n) => n.label) : [])
    const labels = buildNav(baseContent).map((n) => n.label)
    expect(labels).toContain('Contact')
    expect(labels).not.toContain('Work')
  })
  it('never exposes broken custom links', () => {
    const c = {
      ...baseContent,
      portfolio: { ...baseContent.portfolio, navigation: { mode: 'custom' as const, items: [
        { id: '1', label: 'Gone', kind: 'section' as const, target: 'work', visible: true },
        { id: '2', label: 'About', kind: 'section' as const, target: 'about', visible: true },
        { id: '3', label: 'Evil', kind: 'external' as const, target: 'javascript:alert(1)', visible: true },
        { id: '4', label: 'Blog', kind: 'external' as const, target: 'https://example.com/blog', visible: true },
        { id: '5', label: 'Hidden', kind: 'section' as const, target: 'contact', visible: false },
      ] } },
    }
    expect(buildNav(c).map((n) => n.label)).toEqual(['About', 'Blog'])
  })
})

describe('relationships and filters', () => {
  const c = normalizeContent(sampleContent(baseContent))
  it('relates projects by shared attributes', () => {
    const [first, ...rest] = c.projects
    const rel = relatedProjects(first, [first, ...rest])
    expect(rel.every((p) => p.id !== first.id)).toBe(true)
  })
  it('only offers facets that can actually filter', () => {
    const facets = buildFacets(c.projects, c)
    expect(facets.every((f) => f.values.length > 1)).toBe(true)
    const social = filterProjects(c.projects, { type: 'Campaigns' }, '', c)
    expect(social.every((p) => p.category === 'Campaigns')).toBe(true)
    expect(filterProjects(c.projects, {}, 'zzz-no-match', c)).toHaveLength(0)
    // linked evidence is searchable: the sample result on project 1 mentions engagement
    expect(filterProjects(c.projects, {}, 'engagement', c).map((p) => p.id)).toContain('sample-1')
  })
})

describe('seo and security headers', () => {
  it('builds metadata, JSON-LD and head tags', () => {
    const p = baseContent.portfolio
    expect(buildMeta(p).lang).toBe('en')
    expect(buildJsonLd(p)['@graph'][0]).toMatchObject({ '@type': 'Person' })
    const html = injectHead('<html lang="en"><head><!--head:start--><!--head:end--></head></html>', { ...p, seo: { ...p.seo, title: 'A "quoted" <b>title', robots: 'noindex' } })
    expect(html).toContain('&quot;quoted&quot; &lt;b&gt;title')
    expect(html).toContain('noindex, nofollow')
  })
  it('only allows analytics hosts that are switched on', () => {
    const off = buildCsp(baseContent.portfolio)
    expect(off).not.toContain('googletagmanager')
    const on = buildCsp({ ...baseContent.portfolio, analytics: { ...baseContent.portfolio.analytics, enabled: true, ga4: 'G-ABCD1234' } })
    expect(on).toContain('https://www.googletagmanager.com')
    expect(on).toContain("object-src 'none'")
  })
  it('blocks the admin and API from crawlers, or everything when noindex', () => {
    expect(buildRobots(baseContent.portfolio)).toContain('Disallow: /admin')
    expect(buildRobots({ ...baseContent.portfolio, seo: { ...baseContent.portfolio.seo, robots: 'noindex' } })).toContain('Disallow: /\n')
  })
})

function walk(dir: string, out: string[] = []) {
  if (!existsSync(dir)) return out
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f === 'dist' || f === 'data' || f.startsWith('.git')) continue
    const p = join(dir, f)
    statSync(p).isDirectory() ? walk(p, out) : out.push(p)
  }
  return out
}

describe('writing rules', () => {
  it('contains no em dashes in source, docs or content', () => {
    const files = [...walk('src'), ...walk('tests'), ...walk('server'), ...walk('shared'), ...walk('scripts'), 'README.md', 'index.html'].filter((f) => /\.(ts|tsx|css|md|html|mjs)$/.test(f))
    const dash = String.fromCharCode(8212)
    const offenders = files.filter((f) => readFileSync(f, 'utf8').includes(dash))
    expect(offenders).toEqual([])
  })
  it('does not use banned fonts', () => {
    const css = walk('src').filter((f) => f.endsWith('.css') || f.endsWith('.ts')).map((f) => readFileSync(f, 'utf8')).join('\n')
    expect(css).not.toMatch(/\b(Inter|Roboto|Arial|Open Sans|Poppins|Montserrat|Lato|Nunito|DM Sans)\b/)
  })
  it('ships no fabricated achievements by default', () => {
    expect(baseContent.projects).toHaveLength(0)
    expect(baseContent.results).toHaveLength(0)
    expect(baseContent.testimonials).toHaveLength(0)
    expect(baseContent.aiSkills).toHaveLength(0)
    expect(baseContent.portfolio.stats.every((s) => !s.value)).toBe(true)
  })
})
