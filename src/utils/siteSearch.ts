export type SearchKind = 'Section' | 'Project' | 'Case study' | 'Service' | 'Tool' | 'Note'
export type SearchAction = { type: 'section'; id: string } | { type: 'project'; id: string } | { type: 'note'; slug: string }

export interface SearchItem {
  id: string
  kind: SearchKind
  title: string
  detail: string
  action: SearchAction
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
const words = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean)

const ORDER: SearchKind[] = ['Section', 'Project', 'Case study', 'Service', 'Tool', 'Note']

/** Ranks items for what a visitor typed. Every word must appear somewhere; matches at the start of the title count most. Empty text finds nothing. */
export function searchItems(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const terms = words(query)
  if (!terms.length) return []
  const scored: { item: SearchItem; score: number }[] = []
  for (const item of items) {
    const title = norm(item.title)
    const detail = norm(item.detail)
    const titleWords = words(item.title)
    let score = 0
    let ok = true
    for (const t of terms) {
      if (title.startsWith(t)) score += 6
      else if (titleWords.some((w) => w.startsWith(t))) score += 4
      else if (title.includes(t)) score += 3
      else if (detail.includes(t)) score += 1
      else { ok = false; break }
    }
    if (ok) scored.push({ item, score })
  }
  return scored.sort((a, b) => b.score - a.score || ORDER.indexOf(a.item.kind) - ORDER.indexOf(b.item.kind) || a.item.title.localeCompare(b.item.title)).slice(0, limit).map((x) => x.item)
}
