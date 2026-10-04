import { describe, expect, it } from 'vitest'
import { baseContent, normalizeContent } from '../src/content/bundle'
import { applyApplication, applyLanguage, applyLook, applySchedule, announcementVisible, captureLook, quality, setText, translatableFields, inWindow, applicationExpired } from '../src/content/derive'
import { newApplication, newLook, newProject, newLanguage, newNote } from '../src/content/factories'
import { sectionHasContent } from '../src/content/selectors'

const base = () => {
  const c = normalizeContent(baseContent)
  const a = { ...newProject(), id: 'a', title: 'A', hidden: false, featured: false }
  const b = { ...newProject(), id: 'b', title: 'B', hidden: false }
  const d = { ...newProject(), id: 'd', title: 'D', hidden: false }
  c.projects = [a, b, d]
  return c
}
const day = (s: string) => new Date(`${s}T12:00:00`)

describe('windows and scheduled changes', () => {
  it('treats empty bounds as open and bounds as inclusive', () => {
    expect(inWindow('', '', day('2026-05-05'))).toBe(true)
    expect(inWindow('2026-05-05', '2026-05-05', day('2026-05-05'))).toBe(true)
    expect(inWindow('2026-05-06', '', day('2026-05-05'))).toBe(false)
    expect(inWindow('', '2026-05-04', day('2026-05-05'))).toBe(false)
  })
  it('applies a rule only inside its dates and reverts after', () => {
    const c = base()
    c.portfolio.schedule = [{ id: 'r', label: 'Launch', enabled: true, from: '2026-06-01', to: '2026-06-30', seasonMode: 'winter', professional: 'professional', availability: 'Booked until July', heroLabel: '', heroHeadline: 'Now open', heroIntro: '', showSectionIds: [], hideSectionIds: ['services'], announcementText: 'Hello June', announcementLink: '' }]
    const inside = applySchedule(c, day('2026-06-10'))
    expect(inside.portfolio.seasons.mode).toBe('winter')
    expect(inside.portfolio.theme.professional).toBe('professional')
    expect(inside.portfolio.hero.headline).toBe('Now open')
    expect(inside.portfolio.sections.find((s) => s.id === 'services')?.enabled).toBe(false)
    expect(announcementVisible(inside, day('2026-06-10'))).toBe(true)
    expect(applySchedule(c, day('2026-07-01'))).toBe(c)
    expect(c.portfolio.seasons.mode).toBe('auto')
  })
  it('ignores disabled rules and rules with no dates', () => {
    const c = base()
    const rule = { id: 'r', label: '', enabled: false, from: '2026-01-01', to: '', seasonMode: 'winter' as const, professional: '' as const, availability: '', heroLabel: '', heroHeadline: '', heroIntro: '', showSectionIds: [], hideSectionIds: [], announcementText: '', announcementLink: '' }
    c.portfolio.schedule = [rule, { ...rule, enabled: true, from: '', to: '' }]
    expect(applySchedule(c, day('2026-06-10'))).toBe(c)
  })
  it('hides an expired or future announcement', () => {
    const c = base()
    c.portfolio.announcement = { ...c.portfolio.announcement, enabled: true, text: 'Hi', from: '2026-02-01', to: '2026-02-10' }
    expect(announcementVisible(c, day('2026-02-05'))).toBe(true)
    expect(announcementVisible(c, day('2026-02-11'))).toBe(false)
    c.portfolio.announcement.text = ' '
    expect(announcementVisible(c, day('2026-02-05'))).toBe(false)
  })
})

describe('looks', () => {
  it('captures and re applies a look without touching anything else', () => {
    const c = base()
    c.portfolio.design.radius = 'sharp'
    c.portfolio.theme.professional = 'professional'
    const settings = captureLook(c)
    const other = base()
    const out = applyLook(other, { settings })
    expect(out.portfolio.design.radius).toBe('sharp')
    expect(out.portfolio.theme.professional).toBe('professional')
    expect(out.projects).toEqual(other.projects)
    expect(newLook().settings.design.radius).toBe('soft')
  })
})

describe('tailored applications', () => {
  it('reshapes hero, projects, skills, sections and CV for one application only', () => {
    const c = base()
    c.skills = [{ id: 'g', name: 'G', skills: [{ name: 'SEO', visible: true }, { name: 'Reels', visible: true }] }]
    const a = { ...newApplication(), hero: { label: 'For Acme', headline: 'Hi Acme', supporting: '', intro: '' }, featuredProjectIds: ['d', 'b'], highlightSkills: ['reels'], hideSectionIds: ['services', 'top'], professional: 'professional' as const, season: 'winter' as const, cvFile: '/uploads/acme.pdf', cvFilename: 'cv-acme.pdf' }
    const out = applyApplication(c, a)
    expect(out.portfolio.hero.headline).toBe('Hi Acme')
    expect(out.portfolio.hero.supporting).toBe(c.portfolio.hero.supporting)
    expect(out.projects.map((p) => p.id)).toEqual(['d', 'b', 'a'])
    expect(out.projects[0].featured).toBe(true)
    expect(out.skills[0].skills[0].name).toBe('Reels')
    expect(out.portfolio.sections.find((s) => s.id === 'services')?.enabled).toBe(false)
    expect(out.portfolio.sections.find((s) => s.id === 'top')?.enabled).toBe(true)
    expect(out.portfolio.theme.professional).toBe('professional')
    expect(out.portfolio.seasons.mode).toBe('winter')
    expect(out.portfolio.profile.cvFile).toBe('/uploads/acme.pdf')
    expect(applyApplication(c, { ...a, onlyFeatured: true }).projects.map((p) => p.id)).toEqual(['d', 'b'])
    expect(c.projects.map((p) => p.id)).toEqual(['a', 'b', 'd'])
  })
  it('uses the look supplied with the application', () => {
    const c = base()
    const look = { ...newLook(), id: 'l' }
    look.settings.design.buttons = 'square'
    expect(applyApplication(c, { ...newApplication(), look }).portfolio.design.buttons).toBe('square')
  })
  it('knows when a link has expired', () => {
    expect(applicationExpired({ expiresAt: '' })).toBe(false)
    expect(applicationExpired({ expiresAt: '2001-01-01' })).toBe(true)
    expect(applicationExpired({ expiresAt: '2999-01-01' })).toBe(false)
  })
})

describe('languages', () => {
  it('sets text by path, matching list items by id, and refuses dangerous or non string targets', () => {
    const c = base()
    expect(setText(c, 'projects.a.title', 'Un')).toBe(true)
    expect(c.projects[0].title).toBe('Un')
    expect(setText(c, 'projects.zzz.title', 'x')).toBe(false)
    expect(setText(c, '__proto__.polluted', 'x')).toBe(false)
    expect(setText(c, 'projects.a.featured', 'x')).toBe(false)
    expect(({} as { polluted?: string }).polluted).toBeUndefined()
  })
  it('translates only what the pack provides and leaves the original untouched', () => {
    const c = base()
    c.portfolio.profile.tagline = 'Hello'
    const pack = { ...newLanguage(), code: 'fr', label: 'Francais', text: { 'portfolio.profile.tagline': 'Bonjour', 'projects.b.title': '', 'projects.a.title': 'Un' } }
    const out = applyLanguage(c, pack)
    expect(out.portfolio.profile.tagline).toBe('Bonjour')
    expect(out.projects[0].title).toBe('Un')
    expect(out.projects[1].title).toBe('B')
    expect(c.portfolio.profile.tagline).toBe('Hello')
    expect(applyLanguage(c, undefined)).toBe(c)
  })
  it('lists translatable fields with stable paths', () => {
    const c = base()
    c.portfolio.profile.tagline = 'Hello'
    const f = translatableFields(c)
    expect(f.find((x) => x.path === 'portfolio.profile.tagline')?.value).toBe('Hello')
    expect(f.find((x) => x.path === 'projects.a.title')).toBeTruthy()
    for (const x of f) { const t = structuredClone(c); expect(setText(t, x.path, 'z')).toBe(true) }
  })
})

describe('quality scores', () => {
  it('flags thin projects and rewards complete ones', () => {
    const c = base()
    c.projects[0] = { ...c.projects[0], description: 'x'.repeat(80), role: 'Lead', thumbnail: { src: '/u/a.webp', alt: 'A thing' } }
    const q = quality(c)
    expect(q.items[0].score).toBe(100)
    expect(q.items[1].issues).toEqual(expect.arrayContaining(['No cover image']))
    expect(q.items[1].score).toBeLessThan(100)
    expect(q.completeness).toBeLessThan(100)
    expect(q.completenessIssues.length).toBeGreaterThan(0)
  })
  it('respects the configured rules', () => {
    const c = base()
    c.portfolio.quality = { minDescription: 0, requireCover: false, requireAlt: false, requirePeriod: false, requireLink: false }
    c.projects[1].role = 'x'
    expect(quality(c).items[1].issues).toEqual([])
  })
})

describe('new section content rules', () => {
  it('shows notes, resources, journey and newsletter only with real content', () => {
    const c = base()
    expect(['journey', 'resources', 'notes', 'newsletter'].map((t) => sectionHasContent(t as never, c))).toEqual([false, false, false, false])
    c.notes = [{ ...newNote(), id: 'n', title: 'T', slug: 't', hidden: false }]
    expect(sectionHasContent('notes', c)).toBe(true)
    c.portfolio.newsletter.enabled = true
    c.portfolio.newsletter.mode = 'link'
    expect(sectionHasContent('newsletter', c)).toBe(false)
    c.portfolio.newsletter.link = 'https://example.com'
    expect(sectionHasContent('newsletter', c)).toBe(true)
  })
})
