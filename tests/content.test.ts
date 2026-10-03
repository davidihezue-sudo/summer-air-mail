import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { baseContent } from '../src/content/bundle'
import { getVisibleSections, getTools, getTestimonials } from '../src/content/selectors'
import { sampleContent } from '../src/content/sample'
import { buildJsonLd, buildMeta } from '../src/utils/seo'

describe('section visibility', () => {
  it('hides every data-driven section when no real content exists', () => {
    const v = getVisibleSections(baseContent)
    expect(v.work).toBe(false)
    expect(v.caseStudies).toBe(false)
    expect(v.tools).toBe(false)
    expect(v.content).toBe(false)
    expect(v.websites).toBe(false)
    expect(v.testimonials).toBe(false)
    expect(v.mentoring).toBe(false)
    expect(v.hero && v.about && v.services && v.strategy && v.contact).toBe(true)
  })
  it('respects explicit show flags', () => {
    const c = sampleContent(baseContent)
    const off = { ...c, portfolio: { ...c.portfolio, sections: { ...c.portfolio.sections, showWork: false, showTestimonials: false } } }
    const v = getVisibleSections(off)
    expect(getVisibleSections(c).work).toBe(true)
    expect(v.work).toBe(false)
    expect(v.testimonials).toBe(false)
  })
  it('never shows unconfirmed tools or unapproved testimonials', () => {
    expect(getTools(baseContent)).toHaveLength(0)
    const c = { ...baseContent, testimonials: [{ id: 'x', name: 'N', title: 'T', company: 'C', quote: 'Q', relationship: 'R', approved: false }] }
    expect(getTestimonials(c)).toHaveLength(0)
  })
})

describe('seo', () => {
  it('builds metadata and JSON-LD', () => {
    expect(buildMeta(baseContent.portfolio).lang).toBe('en')
    const ld = buildJsonLd(baseContent.portfolio)
    expect(ld['@graph'][0]).toMatchObject({ '@type': 'Person' })
  })
})

function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f === 'dist' || f.startsWith('.git')) continue
    const p = join(dir, f)
    statSync(p).isDirectory() ? walk(p, out) : out.push(p)
  }
  return out
}

describe('writing rules', () => {
  it('contains no em dashes in source, docs or content', () => {
    const files = [...walk('src'), ...walk('tests'), 'README.md', 'index.html'].filter((f) => /\.(ts|tsx|css|md|html)$/.test(f))
    const offenders = files.filter((f) => readFileSync(f, 'utf8').includes(String.fromCharCode(8212)))
    expect(offenders).toEqual([])
  })
  it('does not use banned fonts', () => {
    const css = walk('src').filter((f) => f.endsWith('.css') || f.endsWith('.ts')).map((f) => readFileSync(f, 'utf8')).join('\n')
    expect(css).not.toMatch(/\b(Inter|Roboto|Arial|Open Sans|Poppins|Montserrat|Lato|Nunito|DM Sans)\b/)
  })
})
