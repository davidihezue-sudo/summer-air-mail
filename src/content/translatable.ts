import type { SiteContent } from './types'

export interface TranslatableField { path: string; label: string; value: string }

/** Written text that can appear anywhere inside a project, case study or content block. Names, links, codes and categories are left out on purpose. */
const NESTED = [
  'title', 'description', 'summary', 'body', 'caption', 'alt', 'quote', 'text', 'label', 'detail', 'explanation', 'context', 'notes', 'note', 'attribution',
  'objective', 'challenge', 'strategy', 'paidMedia', 'confidentialResults', 'headline', 'personal', 'team', 'lessons', 'execution', 'distribution',
  'deliverables', 'objectives', 'audience', 'items', 'entries', 'responsibilities', 'outcome', 'anonymised', 'metric', 'period', 'role', 'condition',
]

interface Rule { keys: Set<string>; singular: string; title: (x: Record<string, unknown>) => string }
const rule = (singular: string, keys: string[], title: (x: Record<string, unknown>) => string = (x) => String(x.title ?? x.name ?? '')): Rule => ({ keys: new Set(keys), singular, title })

/**
 * What each kind of item lets the translator touch. A word list per kind keeps things that must stay exact (names of tools, clients,
 * people and companies, platform names, categories used for filtering, links, ids, dates) out of the translation.
 */
const COLLECTIONS: Record<string, Rule> = {
  projects: rule('Project', [...NESTED, 'badge']),
  services: rule('Service', ['name', 'description', 'detail']),
  tools: rule('Tool', ['usage']),
  testimonials: rule('Testimonial', ['quote', 'title', 'relationship'], (x) => String(x.name ?? '')),
  skills: rule('Skill group', ['name']),
  platforms: rule('Platform', ['services', 'analytics', 'advertising'], (x) => String(x.platform ?? x.id ?? '')),
  aiSkills: rule('AI skill', ['name', 'description', 'outcome']),
  results: rule('Result', ['metric', 'period', 'context', 'notes', 'anonymised'], (x) => String(x.metric ?? '')),
  screenshots: rule('Screenshot', ['caption', 'alt'], (x) => String(x.caption ?? '')),
  process: rule('Process step', ['title', 'description']),
  contentItems: rule('Content', ['title', 'explanation', 'result', 'alt']),
  websites: rule('Website', ['name', 'description', 'responsibilities']),
  journey: rule('Journey', ['title', 'description']),
  resources: rule('Resource', ['title', 'description']),
  notes: rule('Note', ['title', 'summary', 'body']),
  faqs: rule('FAQ', ['question', 'answer', 'buttonLabel'], (x) => String(x.question ?? '')),
}

/** The parts of the portfolio settings that visitors read, with the words that may be translated in each. */
const BRANCHES: Record<string, string[]> = {
  hero: ['label', 'headline', 'supporting', 'intro'],
  profile: ['title', 'tagline', 'intro', 'availability', 'bio', 'roles'],
  recruiter: ['competencies', 'industries', 'achievements', 'title', 'place', 'role', 'summary'],
  mentoring: ['heading', 'overview', 'topics', 'outcomes', 'format'],
  strategy: ['heading', 'intro', 'label', 'hint', 'title', 'description', 'items', 'text'],
  navigation: ['label'],
  footer: ['tagline'],
  announcement: ['text'],
  booking: ['label'],
  newsletter: ['heading', 'text', 'buttonLabel', 'consentText', 'successMessage'],
  contact: ['successMessage', 'availableFor', 'workModes'],
  card: ['note'],
  endorsements: ['heading', 'text', 'buttonLabel', 'consentText', 'successMessage'],
  publicStats: ['note'],
  faq: ['allLabel', 'searchLabel', 'closingText', 'closingLabel'],
  sections: ['eyebrow', 'heading', 'intro', 'navLabel', 'label'],
  seo: ['title', 'description'],
}

const ARRAY_OF_TEXT = new Set(['bio', 'roles', 'availableFor', 'workModes', 'topics', 'outcomes', 'competencies', 'industries', 'achievements', 'items', 'responsibilities', 'personal', 'team', 'lessons', 'execution', 'distribution', 'deliverables', 'objectives', 'services', 'analytics', 'advertising'])
const NOT_TEXT = /^(https?:|mailto:|tel:|\/|#)|^[\d\s.,:;%+\-/$€£#@]*$/
const wanted = (v: unknown): v is string => typeof v === 'string' && v.trim().length >= 1 && !NOT_TEXT.test(v.trim())

function walk(node: unknown, path: string, keys: Set<string>, out: { path: string; value: string }[], parentKey = '') {
  if (typeof node === 'string') {
    if (keys.has(parentKey) && wanted(node)) out.push({ path, value: node })
    return
  }
  if (Array.isArray(node)) {
    node.forEach((x, i) => {
      const seg = x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string' && (x as { id: string }).id ? (x as { id: string }).id : String(i)
      // A list of plain strings is translated when the list itself is a text list; objects are searched for their own text.
      walk(x, `${path}.${seg}`, keys, out, typeof x === 'string' && ARRAY_OF_TEXT.has(parentKey) ? parentKey : '')
    })
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === 'id') continue
      walk(v, path ? `${path}.${k}` : k, keys, out, k)
    }
  }
}

/** Everything a visitor reads that can be translated, with a stable path. */
export function translatableFields(c: SiteContent): TranslatableField[] {
  const out: TranslatableField[] = []
  const p = c.portfolio as unknown as Record<string, unknown>
  for (const [branch, keys] of Object.entries(BRANCHES)) {
    const found: { path: string; value: string }[] = []
    walk(p[branch], `portfolio.${branch}`, new Set(keys), found)
    for (const f of found) out.push({ ...f, label: `${branch}: ${f.path.replace(`portfolio.${branch}.`, '').replace(`portfolio.${branch}`, '') || branch}` })
  }
  for (const [col, r] of Object.entries(COLLECTIONS)) {
    const list = (c as unknown as Record<string, Record<string, unknown>[]>)[col] ?? []
    for (const item of list) {
      if (!item || typeof item.id !== 'string') continue
      const found: { path: string; value: string }[] = []
      walk(item, `${col}.${item.id}`, r.keys, found)
      const name = r.title(item).trim()
      for (const f of found) out.push({ ...f, label: `${r.singular}${name ? ` "${name.length > 40 ? `${name.slice(0, 40)}...` : name}"` : ''}: ${f.path.replace(`${col}.${item.id}.`, '')}` })
    }
  }
  return out
}
