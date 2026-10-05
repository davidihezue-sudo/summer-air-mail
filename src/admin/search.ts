import type { SiteContent } from '../content/types'
import type { Field } from './fields'
import { NAV } from './nav'
import { ENTITIES, PAGES } from './schema'
import './schemaExtra'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Hit {
  id: string
  kind: 'page' | 'item' | 'setting'
  title: string
  /** Where it is, shown under the title. */
  where: string
  /** Admin route, without the leading #/ */
  to: string
  /** For settings: the label to scroll to once the page has opened. */
  find?: string
  /** Extra words that should find it. */
  words: string
}

/** Words people type that do not appear in the page title. */
const SYNONYMS: Record<string, string> = {
  design: 'dark mode night light theme corners rounded buttons shadows card style text size font scale',
  appearance: 'professional intensity creative balanced fonts animation motion',
  seasons: 'spring summer autumn fall winter colour color palette dates hero image',
  celebrations: 'christmas boxing day new year easter halloween valentine canada day holiday festive snow lights confetti fireworks greeting celebration',
  cursor: 'mouse pointer bubble trail water circle ring sparkle size effect hover',
  hero: 'bubble water circle orb stamp portrait headline first screen',
  tools: 'logo logos software apps toolkit canva meta',
  toolsDisplay: 'logos wall cards list marquee layout toolkit',
  platforms: 'instagram tiktok facebook youtube linkedin logos social',
  mediaDisplay: 'screenshots crop trimmed shape aspect ratio instagram story reel',
  media: 'upload video image photo pdf library compress shrink',
  server: 'backup database postgres email alerts storage restore s3',
  advanced: 'password export import history restore reset',
  contact: 'email whatsapp form phone inbox send',
  inbox: 'messages enquiries replies leads',
  seo: 'google search title description sharing preview keywords',
  analytics: 'tracking google analytics pixel consent',
  insights: 'visits visitors views statistics traffic',
  applications: 'job employer private link tailored recruiter',
  profilePage: 'pdf print resume summary one page',
  languages: 'translate translation french spanish arabic',
  announcement: 'banner schedule dates promotion notice',
  maintenance: 'offline back soon 404 not found',
  extras: 'badge back to top copy email next previous',
  looks: 'saved preset theme switch',
  team: 'users editor viewer access roles invite',
  quality: 'rules score checklist',
  qualityScore: 'completeness improve checklist',
  bulk: 'csv import export spreadsheet many delete',
  altText: 'accessibility description images screen reader',
}

const labelsOf = (fields: Field[], out: { label: string; help: string }[] = []) => {
  for (const f of fields as any[]) {
    if (f.label) out.push({ label: f.label, help: f.help ?? '' })
    if (f.kind === 'group' || f.kind === 'list') labelsOf(f.fields ?? [], out)
  }
  return out
}

/** Everything the admin can open: its pages, the settings on them, and the items you have written. */
export function buildIndex(content: SiteContent): Hit[] {
  const hits: Hit[] = []
  const pageTitle: Record<string, string> = {}
  for (const g of NAV) for (const i of g.items) {
    pageTitle[i.id] = i.label
    hits.push({ id: `page:${i.id}`, kind: 'page', title: i.label, where: g.group, to: i.id, words: `${g.group} ${SYNONYMS[i.id] ?? ''}` })
  }
  for (const [id, page] of Object.entries(PAGES)) {
    const name = pageTitle[id] ?? page.title
    for (const b of page.blocks) for (const { label, help } of labelsOf(b.fields)) {
      hits.push({ id: `set:${id}:${label}`, kind: 'setting', title: label, where: `${name}${b.title ? ` › ${b.title}` : ''}`, to: id, find: label, words: `${name} ${help}` })
    }
  }
  for (const [id, def] of Object.entries(ENTITIES)) {
    const name = pageTitle[id] ?? def.title
    for (const { label, help } of labelsOf(def.fields)) {
      hits.push({ id: `eset:${id}:${label}`, kind: 'setting', title: label, where: `${name} › each ${def.singular}`, to: id, words: `${name} ${def.singular} ${help}` })
    }
  }
  const seen = new Set<string>()
  for (const [id, def] of Object.entries(ENTITIES)) {
    if (seen.has(def.collection)) continue
    seen.add(def.collection)
    const list = ((content as any)[def.collection] ?? []) as any[]
    for (const x of list) {
      const t = def.titleOf(x)
      if (!t) continue
      hits.push({ id: `item:${def.collection}:${x.id}`, kind: 'item', title: t, where: `${pageTitle[id] ?? def.title}${def.subtitleOf?.(x) ? ` · ${def.subtitleOf(x)}` : ''}`, to: `${id}/${x.id}`, words: def.singular })
    }
  }
  return hits
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ')

/** Typing "dar mod" finds "dark mode". Every word must match somewhere; earlier and more specific matches rank higher. */
export function search(hits: Hit[], query: string, limit = 14): Hit[] {
  const terms = norm(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const scored: [number, Hit][] = []
  for (const h of hits) {
    const title = norm(h.title)
    const where = norm(h.where)
    const words = norm(h.words)
    let total = 0
    let ok = true
    for (const t of terms) {
      let s = 0
      if (title === t) s = 100
      else if (title.startsWith(t)) s = 80
      else if (title.split(' ').some((w) => w.startsWith(t))) s = 60
      else if (title.includes(t)) s = 40
      else if (where.split(' ').some((w) => w.startsWith(t))) s = 22
      else if (words.split(' ').some((w) => w.startsWith(t))) s = 16
      else if (where.includes(t) || words.includes(t)) s = 8
      if (!s) { ok = false; break }
      total += s
    }
    if (!ok) continue
    // Pages and items before individual settings when scores tie.
    total += h.kind === 'page' ? 6 : h.kind === 'item' ? 4 : 0
    scored.push([total, h])
  }
  scored.sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title))
  // Keep a mix: do not let one kind crowd out the others.
  const out: Hit[] = []
  const caps = { page: 6, item: 6, setting: 8 }
  const used = { page: 0, item: 0, setting: 0 }
  for (const [, h] of scored) {
    if (used[h.kind] >= caps[h.kind]) continue
    used[h.kind]++
    out.push(h)
    if (out.length >= limit) break
  }
  return out
}
