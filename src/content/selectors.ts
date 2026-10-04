import type { ContentBundle } from './bundle'
import type { Project, SectionConfig, SectionType, SiteContent } from './types'
import { NAV_DEFAULT } from './sections'
import { hasValue, safeHref } from '../utils/text'

const byOrder = <T extends { order?: number }>(a: T, b: T) => (a.order ?? 999) - (b.order ?? 999)

export function getProjects(c: ContentBundle): Project[] {
  return c.projects.filter((p) => !p.hidden && hasValue(p.title)).slice().sort(byOrder)
}
export const getProjectTypes = (c: ContentBundle) => [...new Set(getProjects(c).map((p) => p.category).filter(Boolean))]
export const getCaseStudyProjects = (c: ContentBundle) => getProjects(c).filter((p) => p.caseStudy)
export const getServices = (c: ContentBundle) => c.services.filter((s) => !s.hidden && hasValue(s.name))
/** A tool shows once you tick "I use this tool". The how-I-use-it line is optional and only shown when it is real text. */
export const getTools = (c: ContentBundle) => c.tools.filter((t) => t.confirmed && hasValue(t.name))
export const getTestimonials = (c: ContentBundle) =>
  c.testimonials.filter((t) => t.approved && hasValue(t.quote)).slice().sort(byOrder)
export const getContentItems = (c: ContentBundle) => c.contentItems.filter((i) => !i.hidden && hasValue(i.title))
export const getWebsites = (c: ContentBundle) => c.websites.filter((w) => !w.hidden && hasValue(w.name))
export const getSkillGroups = (c: ContentBundle) =>
  c.skills.filter((g) => !g.hidden).map((g) => ({ ...g, skills: g.skills.filter((s) => s.visible && hasValue(s.name)) })).filter((g) => g.skills.length)
/** A platform shows once it is switched on. The details under it are optional. */
export const getPlatforms = (c: ContentBundle) => c.platforms.filter((p) => !p.hidden)
export const getAiSkills = (c: ContentBundle) => c.aiSkills.filter((a) => !a.hidden && hasValue(a.name))
export const getResults = (c: ContentBundle) =>
  c.results.filter((r) => !r.hidden && hasValue(r.metric) && (typeof r.end === 'number' || r.series?.length || hasValue(r.anonymised)))
export const getScreenshots = (c: ContentBundle) => c.screenshots.filter((s) => !s.hidden && !!s.image?.src)
export const getProcess = (c: ContentBundle) => c.process.filter((s) => !s.hidden && hasValue(s.title))

function hasRecruiterData(c: SiteContent) {
  const r = c.portfolio.recruiter
  return r.competencies.length + r.platforms.length + r.industries.length + r.achievements.length + r.education.length + r.certifications.length + r.employment.length > 0
}

/** Does a section type have real content to show? An empty section is never rendered. */
export function sectionHasContent(type: SectionType, c: SiteContent, cfg?: SectionConfig): boolean {
  const p = c.portfolio
  switch (type) {
    case 'hero': case 'about': case 'contact': return true
    case 'overview': return hasRecruiterData(c)
    case 'services': return getServices(c).length > 0
    case 'skills': return getSkillGroups(c).length > 0
    case 'platforms': return getPlatforms(c).length > 0
    case 'process': return getProcess(c).length > 0
    case 'work': return getProjects(c).filter((x) => !cfg?.filterCategory || x.category === cfg.filterCategory).length > 0
    case 'caseStudies': return getCaseStudyProjects(c).length > 0
    case 'results': return getResults(c).length > 0
    case 'tools': return getTools(c).length > 0
    case 'ai': return getAiSkills(c).length > 0
    case 'content': return getContentItems(c).length > 0
    case 'screenshots': return getScreenshots(c).length > 0
    case 'strategy': return p.strategy.steps.length > 0
    case 'websites': return getWebsites(c).length > 0
    case 'testimonials': return getTestimonials(c).length > 0
    case 'mentoring': return hasValue(p.mentoring.overview)
    case 'journey': return c.journey.some((x) => !x.hidden && hasValue(x.title))
    case 'resources': return c.resources.some((x) => !x.hidden && hasValue(x.title) && hasValue(x.file))
    case 'notes': return c.notes.some((x) => !x.hidden && hasValue(x.title) && hasValue(x.slug))
    case 'newsletter': return p.newsletter.enabled && (p.newsletter.mode === 'collect' || hasValue(p.newsletter.link))
    case 'richText': return hasValue(cfg?.heading) || hasValue(cfg?.body)
  }
}

export interface ResolvedSection {
  config: SectionConfig
  visible: boolean
}

/** Sections in the configured order, each flagged visible only when enabled AND it has content. */
export function resolveSections(c: SiteContent): ResolvedSection[] {
  return c.portfolio.sections.map((config) => ({ config, visible: config.enabled && sectionHasContent(config.type, c, config) }))
}

/** True when any visible section has this type. Used for hero CTAs, nav and cross links. */
export function isTypeVisible(sections: ResolvedSection[], type: SectionType) {
  return sections.some((s) => s.visible && s.config.type === type)
}

export interface NavEntry {
  id: string
  label: string
  /** Section id, or URL when external. */
  target: string
  external: boolean
}

const DEFAULT_LABEL: Partial<Record<SectionType, string>> = {
  work: 'Work', caseStudies: 'Case studies', results: 'Results', services: 'Services', about: 'About', contact: 'Contact',
}

export function buildNav(c: SiteContent, sections = resolveSections(c)): NavEntry[] {
  const nav = c.portfolio.navigation
  const visibleIds = new Set(sections.filter((s) => s.visible).map((s) => s.config.id))
  if (nav.mode === 'custom') {
    const out: NavEntry[] = []
    for (const item of nav.items) {
      if (!item.visible || !hasValue(item.label)) continue
      if (item.kind === 'section') {
        if (visibleIds.has(item.target)) out.push({ id: item.id, label: item.label, target: item.target, external: false })
      } else {
        const href = safeHref(item.target)
        if (href && /^https?:|^mailto:|^tel:/.test(href)) out.push({ id: item.id, label: item.label, target: href, external: true })
      }
    }
    return out
  }
  return sections
    .filter((s) => s.visible && NAV_DEFAULT.includes(s.config.type))
    .map((s) => ({ id: s.config.id, label: s.config.navLabel || DEFAULT_LABEL[s.config.type] || s.config.heading || s.config.id, target: s.config.id, external: false }))
}

/* ---------- relationships ---------- */

export function relatedProjects(project: Project, all: Project[], limit = 3): Project[] {
  const explicit = (project.relatedIds ?? []).map((id) => all.find((p) => p.id === id)).filter((p): p is Project => !!p)
  const score = (p: Project) =>
    (p.category === project.category ? 2 : 0) +
    p.platforms.filter((x) => project.platforms.includes(x)).length +
    (p.serviceIds ?? []).filter((x) => (project.serviceIds ?? []).includes(x)).length * 2 +
    (p.industry && p.industry === project.industry ? 1 : 0)
  const rest = all.filter((p) => p.id !== project.id && !explicit.includes(p)).map((p) => ({ p, s: score(p) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p)
  return [...explicit, ...rest].slice(0, limit)
}

/* ---------- filtering and search ---------- */

export type FacetKey = 'type' | 'service' | 'platform' | 'industry' | 'contentType' | 'year'
export const FACET_LABELS: Record<FacetKey, string> = {
  type: 'Project type', service: 'Service', platform: 'Platform', industry: 'Industry', contentType: 'Content type', year: 'Year',
}

export function projectFacetValues(p: Project, key: FacetKey, c: SiteContent): string[] {
  switch (key) {
    case 'type': return p.category ? [p.category] : []
    case 'service': return (p.serviceIds ?? []).map((id) => c.services.find((s) => s.id === id)?.name).filter((x): x is string => !!x)
    case 'platform': return p.platforms
    case 'industry': return p.industry ? [p.industry] : []
    case 'contentType': return p.contentTypes ?? []
    case 'year': return p.year ? [p.year] : []
  }
}

/** Facets with at least one value. A facet with a single value would not filter anything, so it is skipped. */
export function buildFacets(projects: Project[], c: SiteContent) {
  const keys: FacetKey[] = ['type', 'service', 'platform', 'industry', 'contentType', 'year']
  return keys
    .map((key) => {
      const values = [...new Set(projects.flatMap((p) => projectFacetValues(p, key, c)))].sort()
      return { key, label: FACET_LABELS[key], values }
    })
    .filter((f) => f.values.length > 1)
}

export function filterProjects(projects: Project[], active: Partial<Record<FacetKey, string>>, query: string, c: SiteContent) {
  const q = query.trim().toLowerCase()
  return projects.filter((p) => {
    for (const [k, v] of Object.entries(active)) {
      if (v && !projectFacetValues(p, k as FacetKey, c).includes(v)) return false
    }
    if (!q) return true
    // Search also reaches the evidence linked to the project, so "Instagram" finds its reels, results and strategy.
    const name = <T extends { id: string }>(list: T[], ids: string[] | undefined, pick: (x: T) => string) => (ids ?? []).map((id) => list.find((x) => x.id === id)).filter((x): x is T => !!x).map(pick)
    const linked = [
      ...name(c.results, [...(p.resultIds ?? []), ...c.results.filter((r) => r.projectId === p.id).map((r) => r.id)], (r) => `${r.metric} ${r.platform ?? ''}`),
      ...name(c.contentItems, p.contentIds, (i) => `${i.title} ${i.format} ${i.platform}`),
      ...name(c.tools, p.toolIds, (t) => t.name),
      ...name(c.aiSkills, p.aiSkillIds, (a) => `${a.name} ${a.tool ?? ''}`),
      p.caseStudy ? 'case study' : '',
      ...(p.blocks ?? []).map((b) => `${b.text ?? ''} ${b.title ?? ''} ${b.label ?? ''}`),
    ]
    const hay = [p.title, p.client, p.industry, p.category, p.description, p.role, ...p.platforms, ...projectFacetValues(p, 'service', c), ...(p.contentTypes ?? []), ...linked].join(' ').toLowerCase()
    return q.split(/\s+/).every((t) => hay.includes(t))
  })
}
