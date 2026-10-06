import type { Application, Audience, Look, ScheduleRule, SiteContent, LanguagePack } from './types'

const clone = <T,>(v: T): T => structuredClone(v)
const filled = (s: string | undefined | null): s is string => !!s && s.trim().length > 0
const BLOCKED = new Set(['__proto__', 'constructor', 'prototype'])

/** Inclusive date window. Empty bounds are open. Dates are yyyy-mm-dd and compared in the visitor's local day. */
export function inWindow(from: string, to: string, now: Date): boolean {
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (filled(from) && day < from) return false
  if (filled(to) && day > to) return false
  return true
}

export function activeRules(rules: ScheduleRule[], now: Date): ScheduleRule[] {
  return rules.filter((r) => r.enabled && (filled(r.from) || filled(r.to)) && inWindow(r.from, r.to, now))
}

/** Scheduled changes: while a rule's dates are current its overrides apply, then everything reverts on its own. */
export function applySchedule(content: SiteContent, now = new Date()): SiteContent {
  const rules = activeRules(content.portfolio.schedule, now)
  if (!rules.length) return content
  const c = clone(content)
  const p = c.portfolio
  for (const r of rules) {
    if (r.seasonMode) p.seasons.mode = r.seasonMode
    if (r.professional) p.theme.professional = r.professional
    if (filled(r.availability)) p.profile.availability = r.availability
    if (filled(r.heroLabel)) p.hero.label = r.heroLabel
    if (filled(r.heroHeadline)) p.hero.headline = r.heroHeadline
    if (filled(r.heroIntro)) p.hero.intro = r.heroIntro
    for (const s of p.sections) {
      if (r.showSectionIds.includes(s.id)) s.enabled = true
      if (r.hideSectionIds.includes(s.id)) s.enabled = false
    }
    if (filled(r.announcementText)) {
      p.announcement = { ...p.announcement, enabled: true, text: r.announcementText, link: r.announcementLink, linkLabel: filled(r.announcementLink) ? p.announcement.linkLabel || 'Learn more' : '', from: '', to: '' }
    }
  }
  return c
}

export function announcementVisible(c: SiteContent, now = new Date()): boolean {
  const a = c.portfolio.announcement
  return a.enabled && filled(a.text) && inWindow(a.from, a.to, now)
}

export function applyLook(content: SiteContent, look: Pick<Look, 'settings'>): SiteContent {
  const c = clone(content)
  const s = look.settings
  c.portfolio.theme.professional = s.professional
  c.portfolio.theme.animationIntensity = s.animationIntensity
  c.portfolio.seasons.mode = s.seasonMode
  c.portfolio.design = { ...c.portfolio.design, ...s.design }
  c.portfolio.hero = { ...c.portfolio.hero, ...s.hero }
  return c
}

/** Snapshot of the current look, for "Save as look". */
export function captureLook(content: SiteContent): Look['settings'] {
  const p = content.portfolio
  const { layout, alignment, breakout, animation, decorativeElements, background } = p.hero
  return { professional: p.theme.professional, animationIntensity: p.theme.animationIntensity, seasonMode: p.seasons.mode, design: clone(p.design), hero: { layout, alignment, breakout, animation, decorativeElements, background } }
}

export type ApplicationBundle = Application & { look?: Look | null }

export function applicationExpired(a: Pick<Application, 'expiresAt'>, now = new Date()): boolean {
  return filled(a.expiresAt) && Date.parse(a.expiresAt) + 864e5 < now.getTime()
}

/** What an application link and an audience view both change: hero words, intensity, season, CV, projects, skills and hidden sections. */
type Tailoring = Pick<Application, 'hero' | 'featuredProjectIds' | 'onlyFeatured' | 'highlightSkills' | 'hideSectionIds' | 'professional' | 'season' | 'cvFile' | 'cvFilename'>

function tailor(c: SiteContent, a: Tailoring) {
  const p = c.portfolio
  for (const k of ['label', 'headline', 'supporting', 'intro'] as const) if (filled(a.hero[k])) p.hero[k] = a.hero[k]
  if (a.professional) p.theme.professional = a.professional
  if (a.season) p.seasons.mode = a.season
  if (filled(a.cvFile)) { p.profile.cvFile = a.cvFile; p.cv.filename = a.cvFilename || p.cv.filename; p.cv.enabled = true }
  if (a.featuredProjectIds.length) {
    const rank = (id: string) => { const i = a.featuredProjectIds.indexOf(id); return i < 0 ? 999 : i }
    let list = c.projects.map((x) => (a.featuredProjectIds.includes(x.id) ? { ...x, featured: true } : x))
    if (a.onlyFeatured) list = list.filter((x) => a.featuredProjectIds.includes(x.id))
    c.projects = list.sort((x, y) => rank(x.id) - rank(y.id))
  }
  if (a.highlightSkills.length) {
    const want = new Set(a.highlightSkills.map((s) => s.toLowerCase()))
    c.skills = c.skills.map((g) => ({ ...g, skills: [...g.skills].sort((x, y) => Number(want.has(y.name.toLowerCase())) - Number(want.has(x.name.toLowerCase()))) }))
    p.recruiter.competencies = [...p.recruiter.competencies].sort((x, y) => Number(want.has(y.toLowerCase())) - Number(want.has(x.toLowerCase())))
  }
  for (const s of p.sections) if (a.hideSectionIds.includes(s.id) && s.type !== 'hero') s.enabled = false
}

/** Re-shape the whole site for one application. Only what the application sets changes. */
export function applyApplication(content: SiteContent, a: ApplicationBundle): SiteContent {
  let c = a.look ? applyLook(content, a.look) : clone(content)
  tailor(c, a)
  c = { ...c, applications: [], looks: [] }
  return c
}

export const AUDIENCE_HIDE_KEYS = ['projects', 'services', 'tools', 'results', 'testimonials', 'faqs', 'websites', 'notes'] as const

/**
 * Re-shape the whole site for one audience view. Like an application link, only what the view sets changes. On top of that a view
 * can swap the About text and hero buttons, reword sections, move sections up, and leave out individual items.
 */
export function applyAudience(content: SiteContent, a: Audience): SiteContent {
  const c = clone(content)
  tailor(c, a)
  const p = c.portfolio
  const bio = a.bio.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)
  if (bio.length) p.profile.bio = bio
  const ctas = (a.ctas ?? []).filter((x) => filled(x.label) && filled(x.target))
  if (ctas.length) p.hero.ctas = ctas
  for (const w of a.sectionWording ?? []) {
    const s = p.sections.find((x) => x.id === w.sectionId)
    if (!s) continue
    if (filled(w.heading)) s.heading = w.heading
    if (filled(w.intro)) s.intro = w.intro
  }
  if (a.firstSectionIds?.length) {
    const head = p.sections.filter((s) => s.type === 'hero')
    const first = a.firstSectionIds.map((id) => p.sections.find((s) => s.id === id && s.type !== 'hero')).filter((s): s is NonNullable<typeof s> => !!s)
    const rest = p.sections.filter((s) => s.type !== 'hero' && !first.includes(s))
    p.sections = [...head, ...first, ...rest]
  }
  for (const key of AUDIENCE_HIDE_KEYS) {
    const ids = a.hide?.[key] ?? []
    if (ids.length) (c as unknown as Record<string, { id: string }[]>)[key] = (c[key] as { id: string }[]).filter((x) => !ids.includes(x.id))
  }
  return { ...c, applications: [], looks: [], audiences: [] }
}

/* ---------- languages ---------- */

/** Set a string at a dotted path. Array segments match an item id (or a numeric index). Returns whether it changed. */
export function setText(root: unknown, path: string, value: string): boolean {
  const parts = path.split('.')
  let cur: unknown = root
  for (let i = 0; i < parts.length; i++) {
    const k = parts[i]
    if (BLOCKED.has(k) || cur === null || typeof cur !== 'object') return false
    const last = i === parts.length - 1
    let key: string | number = k
    if (Array.isArray(cur)) {
      const idx = cur.findIndex((x) => x && typeof x === 'object' && (x as { id?: string }).id === k)
      key = idx >= 0 ? idx : /^\d+$/.test(k) ? Number(k) : -1
      if (key === -1) return false
    }
    const holder = cur as Record<string | number, unknown>
    if (last) {
      if (typeof holder[key] !== 'string') return false
      holder[key] = value
      return true
    }
    cur = holder[key]
  }
  return false
}

export function applyLanguage(content: SiteContent, pack: LanguagePack | undefined): SiteContent {
  if (!pack) return content
  const entries = Object.entries(pack.text).filter(([, v]) => filled(v))
  if (!entries.length) return content
  const c = clone(content)
  for (const [path, v] of entries) setText(c, path, v)
  return c
}

export interface TranslatableField { path: string; label: string; value: string }

/** Everything a visitor reads that can be translated, with a stable path. */
export function translatableFields(c: SiteContent): TranslatableField[] {
  const out: TranslatableField[] = []
  const add = (path: string, label: string, value: unknown) => { if (typeof value === 'string' && filled(value)) out.push({ path, label, value }) }
  const p = c.portfolio
  add('portfolio.hero.label', 'Hero label', p.hero.label); add('portfolio.hero.headline', 'Hero headline', p.hero.headline)
  add('portfolio.hero.supporting', 'Hero supporting line', p.hero.supporting); add('portfolio.hero.intro', 'Hero intro', p.hero.intro)
  for (const k of ['title', 'tagline', 'intro', 'availability'] as const) add(`portfolio.profile.${k}`, `Profile ${k}`, p.profile[k])
  p.profile.bio.forEach((b, i) => add(`portfolio.profile.bio.${i}`, `Bio paragraph ${i + 1}`, b))
  add('portfolio.seo.title', 'Page title', p.seo.title); add('portfolio.seo.description', 'Page description', p.seo.description)
  add('portfolio.footer.tagline', 'Footer tagline', p.footer.tagline)
  add('portfolio.announcement.text', 'Announcement', p.announcement.text)
  add('portfolio.contact.successMessage', 'Contact success message', p.contact.successMessage)
  for (const k of ['heading', 'text', 'buttonLabel', 'consentText', 'successMessage'] as const) add(`portfolio.newsletter.${k}`, `Newsletter ${k}`, p.newsletter[k])
  for (const k of ['heading', 'intro', 'label', 'hint'] as const) add(`portfolio.strategy.${k}`, `Strategy ${k}`, p.strategy[k])
  for (const s of p.sections) for (const k of ['eyebrow', 'heading', 'intro', 'navLabel'] as const) add(`portfolio.sections.${s.id}.${k}`, `Section ${s.id} ${k}`, s[k])
  c.projects.forEach((x) => { add(`projects.${x.id}.title`, `Project: ${x.title}`, x.title); add(`projects.${x.id}.description`, `Project description: ${x.title}`, x.description) })
  c.services.forEach((x) => { add(`services.${x.id}.name`, `Service: ${x.name}`, x.name); add(`services.${x.id}.description`, `Service description: ${x.name}`, x.description) })
  c.testimonials.forEach((x) => add(`testimonials.${x.id}.quote`, `Quote: ${x.name}`, x.quote))
  for (const k of ['allLabel', 'searchLabel', 'closingText', 'closingLabel'] as const) add(`portfolio.faq.${k}`, `FAQ ${k}`, p.faq[k])
  c.faqs.forEach((x) => { add(`faqs.${x.id}.question`, `FAQ question`, x.question); add(`faqs.${x.id}.answer`, `FAQ answer: ${x.question}`, x.answer) })
  c.journey.forEach((x) => { add(`journey.${x.id}.title`, `Journey: ${x.title}`, x.title); add(`journey.${x.id}.description`, `Journey description: ${x.title}`, x.description) })
  c.resources.forEach((x) => { add(`resources.${x.id}.title`, `Resource: ${x.title}`, x.title); add(`resources.${x.id}.description`, `Resource description: ${x.title}`, x.description) })
  c.notes.forEach((x) => { add(`notes.${x.id}.title`, `Note: ${x.title}`, x.title); add(`notes.${x.id}.summary`, `Note summary: ${x.title}`, x.summary); add(`notes.${x.id}.body`, `Note body: ${x.title}`, x.body) })
  return out
}

/* ---------- quality and completeness ---------- */

export interface QualityItem { id: string; title: string; score: number; issues: string[] }
export interface Quality { overall: number; completeness: number; completenessIssues: string[]; items: QualityItem[] }

export function quality(c: SiteContent): Quality {
  const q = c.portfolio.quality
  const items: QualityItem[] = c.projects.map((x) => {
    const issues: string[] = []
    if ((x.description ?? '').trim().length < q.minDescription) issues.push(`Description shorter than ${q.minDescription} characters`)
    if (q.requireCover && !x.thumbnail?.src) issues.push('No cover image')
    if (q.requireAlt && x.thumbnail?.src && !filled(x.thumbnail.alt)) issues.push('Cover image has no alt text')
    if (q.requireAlt && (x.media ?? []).some((m) => m.type === 'image' && m.src && !filled(m.alt))) issues.push('A gallery image has no alt text')
    if (q.requirePeriod && !filled(x.period) && !filled(x.year)) issues.push('No period or year')
    if (q.requireLink && !filled(x.externalLink)) issues.push('No external link')
    if (!filled(x.role)) issues.push('Your role is not stated')
    const checks = 4 + Number(q.requirePeriod) + Number(q.requireLink)
    return { id: x.id, title: x.title || '(untitled)', issues, score: Math.max(0, Math.round(100 * (1 - issues.length / Math.max(checks, issues.length)))) }
  })
  const pr = c.portfolio.profile
  const checks: [boolean, string][] = [
    [filled(pr.fullName), 'Add your full name'], [filled(pr.title), 'Add your professional title'], [filled(pr.intro), 'Write a short intro'],
    [pr.bio.some(filled), 'Write your bio'], [!!pr.profilePhoto?.src || !!pr.heroPortrait?.src, 'Add a photo'], [filled(pr.email), 'Add a contact email'],
    [filled(pr.cvFile) || !c.portfolio.cv.enabled, 'Upload your CV'], [c.projects.some((x) => !x.hidden), 'Show at least one project'],
    [c.portfolio.recruiter.competencies.length > 0, 'List your core competencies'], [filled(c.portfolio.seo.description), 'Write a page description for search'],
    [c.results.some((r) => !r.hidden), 'Add a measured result'], [c.testimonials.some((t) => t.approved), 'Approve a testimonial'],
  ]
  const completeness = Math.round((100 * checks.filter(([ok]) => ok).length) / checks.length)
  const visible = items.filter((i) => c.projects.find((x) => x.id === i.id && !x.hidden))
  const proj = visible.length ? Math.round(visible.reduce((n, i) => n + i.score, 0) / visible.length) : 100
  return { overall: Math.round((proj + completeness) / 2), completeness, completenessIssues: checks.filter(([ok]) => !ok).map(([, m]) => m), items }
}
