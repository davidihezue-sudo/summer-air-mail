import { LEGACY_DRAWINGS } from './serviceArt'
import { portfolio } from './portfolio.config'
import { projects } from './projects'
import { services } from './services'
import { tools, ADDED_TOOLS, TOOLS_SEED_VERSION } from './tools'
import { testimonials } from './testimonials'
import { contentItems } from './contentItems'
import { websites } from './websites'
import { skills } from './skills'
import { platforms } from './platforms'
import { process } from './process'
import { results, aiSkills, screenshots } from './empty'
import { defaultSections } from './sections'
import { mergeDefaults } from './merge'
import {
  newAiSkill, newCaseStudy, newContentItem, newPlatform, newProcessStep, newProject, newResult, newScreenshot, newService,
  newSkillGroup, newTestimonial, newTool, newWebsite, newJourney, newFaq, newAudience, newResource, newNote, newApplication, newShortLink, newLook,
} from './factories'
import type { SectionConfig, SiteContent } from './types'

export const baseContent: SiteContent = {
  portfolio, projects, services, tools, testimonials, contentItems, websites,
  skills, platforms, aiSkills, results, screenshots, process, categories: [],
  journey: [], faqs: [], audiences: [], resources: [], notes: [], applications: [], shortLinks: [], looks: [],
}
export type ContentBundle = SiteContent

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Keeps only well formed list entries and gives each the full default shape. */
function items<T extends { id?: string }>(list: unknown, make: () => T): T[] {
  if (!Array.isArray(list)) return []
  const seen = new Set<string>()
  const out: T[] = []
  for (const raw of list) {
    if (!isObj(raw) || typeof raw.id !== 'string' || !raw.id || seen.has(raw.id)) continue
    seen.add(raw.id)
    const shape = make() as Record<string, unknown>
    // A stored item that never mentioned `hidden` has always been shown. New admin items set it explicitly.
    if ('hidden' in shape) shape.hidden = false
    out.push(mergeDefaults(shape as T, raw))
  }
  return out
}

/** Sections: drop unknown types and duplicate ids, then add any section the stored list predates. */
export function normalizeSections(stored: unknown): SectionConfig[] {
  const defaults = defaultSections()
  const known = new Set(defaults.map((d) => d.type))
  const list = Array.isArray(stored) ? stored : []
  const out: SectionConfig[] = []
  const ids = new Set<string>()
  for (const raw of list) {
    if (!isObj(raw) || typeof raw.id !== 'string' || typeof raw.type !== 'string') continue
    if (!known.has(raw.type as never) || ids.has(raw.id)) continue
    ids.add(raw.id)
    out.push({ enabled: true, ...(raw as object) } as SectionConfig)
  }
  if (!list.length) return defaults
  for (const d of defaults) {
    if (!ids.has(d.id) && !out.some((o) => o.type === d.type)) {
      const idx = defaults.findIndex((x) => x.id === d.id)
      const prev = defaults[idx - 1]
      const at = prev ? out.findIndex((o) => o.id === prev.id) : -1
      out.splice(at + 1, 0, { ...d, enabled: d.type === 'mentoring' ? false : d.enabled })
    }
  }
  return out
}

/**
 * Admin only: adds the built-in tools a site saved before they existed has never seen, once. After that the owner's list is left
 * alone, so a deleted tool stays deleted. The public site never calls this, so nothing appears there until it is published.
 */
export function seedBuiltIns(c: SiteContent): { content: SiteContent; changed: boolean } {
  if (c.portfolio.toolsSeeded >= TOOLS_SEED_VERSION) return { content: c, changed: false }
  const have = new Set(c.tools.map((t) => t.id))
  return { content: { ...c, portfolio: { ...c.portfolio, toolsSeeded: TOOLS_SEED_VERSION }, tools: [...c.tools, ...ADDED_TOOLS.filter((t) => !have.has(t.id))] }, changed: true }
}

/** Accepts anything from storage or the API and returns a complete, safe SiteContent. */
export function normalizeContent(raw: unknown): SiteContent {
  const r = isObj(raw) ? raw : {}
  const p = mergeDefaults(baseContent.portfolio, r.portfolio)
  // The old on/off switch "Animate pop-ups" became a choice of transition. Someone who had it off keeps pop-ups plain.
  const oldDesign = isObj(r.portfolio) && isObj(r.portfolio.design) ? r.portfolio.design : null
  if (oldDesign && oldDesign.dialogAnimation === false && oldDesign.dialogTransition === undefined) p.design.dialogTransition = 'none'
  p.sections = normalizeSections(isObj(r.portfolio) ? r.portfolio.sections : undefined)
  const has = (k: string) => Array.isArray(r[k])
  return {
    portfolio: p,
    projects: has('projects')
      ? items(r.projects, newProject).map((x) => (x.caseStudy ? { ...x, caseStudy: mergeDefaults(newCaseStudy(), x.caseStudy) } : x))
      : baseContent.projects,
    services: has('services') ? items(r.services, newService).map((s) => (s.object && LEGACY_DRAWINGS[s.object] ? { ...s, object: LEGACY_DRAWINGS[s.object] } : s)) : baseContent.services,
    tools: has('tools') ? items(r.tools, newTool) : baseContent.tools,
    testimonials: has('testimonials') ? items(r.testimonials, newTestimonial) : baseContent.testimonials,
    contentItems: has('contentItems') ? items(r.contentItems, newContentItem) : baseContent.contentItems,
    websites: has('websites') ? items(r.websites, newWebsite) : baseContent.websites,
    skills: has('skills') ? items(r.skills, newSkillGroup) : baseContent.skills,
    platforms: has('platforms') ? items(r.platforms, newPlatform) : baseContent.platforms,
    aiSkills: has('aiSkills') ? items(r.aiSkills, newAiSkill) : baseContent.aiSkills,
    results: has('results') ? items(r.results, newResult) : baseContent.results,
    screenshots: has('screenshots') ? items(r.screenshots, newScreenshot) : baseContent.screenshots,
    process: has('process') ? items(r.process, newProcessStep) : baseContent.process,
    journey: has('journey') ? items(r.journey, newJourney) : [],
    faqs: has('faqs') ? items(r.faqs, newFaq) : [],
    audiences: has('audiences') ? items(r.audiences, newAudience) : [],
    resources: has('resources') ? items(r.resources, newResource) : [],
    notes: has('notes') ? items(r.notes, newNote) : [],
    applications: has('applications') ? items(r.applications, newApplication) : [],
    shortLinks: has('shortLinks') ? items(r.shortLinks, newShortLink) : [],
    looks: has('looks') ? items(r.looks, newLook) : [],
    categories: Array.isArray(r.categories) ? r.categories.filter((c): c is string => typeof c === 'string' && !!c.trim()) : [],
  }
}

async function getJson(url: string, timeout = 2500): Promise<unknown | null> {
  try {
    const ctl = new AbortController()
    const t = window.setTimeout(() => ctl.abort(), timeout)
    const res = await fetch(url, { credentials: 'same-origin', signal: ctl.signal, headers: { Accept: 'application/json' } })
    window.clearTimeout(t)
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) return null
    return await res.json()
  } catch {
    return null
  }
}

export interface LoadedContent {
  content: SiteContent
  source: 'defaults' | 'published' | 'draft' | 'sample'
}

/**
 * Where the public site gets its content:
 *  1. /api/content (published by the admin) when the server is running,
 *  2. otherwise the bundled defaults in src/content.
 * ?preview=draft (admin only, needs a login cookie) shows the unpublished draft.
 * ?sample=1 (dev server only) shows clearly labelled sample data.
 */
export async function loadContent(): Promise<LoadedContent> {
  const params = new URLSearchParams(location.search)
  if (import.meta.env.DEV && params.has('sample')) {
    const { sampleContent } = await import('./sample')
    return { content: normalizeContent(sampleContent(baseContent)), source: 'sample' }
  }
  if (params.get('preview') === 'draft') {
    const draft = (await getJson('/api/admin/draft')) as { draft?: unknown } | null
    if (draft?.draft) return { content: normalizeContent(draft.draft), source: 'draft' }
  }
  // The server embeds published content in the page, which saves a round trip on first load.
  const inline = document.getElementById('sam-content')?.textContent
  if (inline) {
    try { return { content: normalizeContent(JSON.parse(inline)), source: 'published' } } catch { /* fall back to the API */ }
  }
  const pub = (await getJson('/api/content')) as { content?: unknown } | null
  if (pub?.content) return { content: normalizeContent(pub.content), source: 'published' }
  return { content: normalizeContent(baseContent), source: 'defaults' }
}
