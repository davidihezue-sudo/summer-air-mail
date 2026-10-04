import type { SiteContent } from '../content/types'
import { newJourney, newNote, newProject, newResult, newService, newTestimonial } from '../content/factories'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i++ } else quoted = false } else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((c) => c !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c !== '')) rows.push(row)
  return rows
}

/** Spreadsheet formulas in exported cells are neutralised so opening the file in Excel cannot run them. */
const cell = (v: unknown) => {
  let s = Array.isArray(v) ? v.join('; ') : v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v)
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export const toCsv = (rows: Record<string, unknown>[], cols: string[]) => [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n') + '\r\n'

export interface CsvSet {
  collection: keyof SiteContent & string
  label: string
  columns: string[]
  make: () => any
  /** Applies one parsed row onto a fresh item. */
  apply: (item: any, row: Record<string, string>) => void
  /** Row view of an existing item for export. */
  view: (item: any) => Record<string, unknown>
}

const yes = (v: string) => /^(yes|true|1|y)$/i.test(v.trim())
const num = (v: string): number | null => { const n = Number(v.replace(/[^\d.-]/g, '')); return v.trim() === '' || Number.isNaN(n) ? null : n }
const list = (v: string) => v.split(/[;|]/).map((x) => x.trim()).filter(Boolean)
const assign = (item: any, row: Record<string, string>, keys: string[]) => { for (const k of keys) if (k in row && row[k] !== undefined) item[k] = row[k] }

export const CSV_SETS: CsvSet[] = [
  {
    collection: 'projects', label: 'Projects', make: newProject,
    columns: ['title', 'client', 'industry', 'category', 'year', 'period', 'role', 'description', 'externalLink', 'published'],
    apply: (i, r) => { assign(i, r, ['title', 'client', 'industry', 'category', 'year', 'period', 'role', 'description', 'externalLink']); i.hidden = !yes(r.published ?? '') },
    view: (i) => ({ ...i, published: !i.hidden }),
  },
  {
    collection: 'results', label: 'Results', make: newResult,
    columns: ['metric', 'start', 'end', 'unit', 'period', 'platform', 'classification', 'context', 'published'],
    apply: (i, r) => { assign(i, r, ['metric', 'unit', 'period', 'platform', 'context']); i.start = num(r.start ?? ''); i.end = num(r.end ?? ''); if (r.classification) i.classification = r.classification; i.hidden = !yes(r.published ?? '') },
    view: (i) => ({ ...i, published: !i.hidden }),
  },
  {
    collection: 'testimonials', label: 'Testimonials', make: newTestimonial,
    columns: ['name', 'title', 'company', 'quote', 'relationship', 'approved'],
    apply: (i, r) => { assign(i, r, ['name', 'title', 'company', 'quote', 'relationship']); i.approved = yes(r.approved ?? '') },
    view: (i) => ({ ...i }),
  },
  {
    collection: 'services', label: 'Services', make: newService,
    columns: ['name', 'category', 'description', 'detail', 'published'],
    apply: (i, r) => { assign(i, r, ['name', 'category', 'description', 'detail']); i.hidden = !yes(r.published ?? '') },
    view: (i) => ({ ...i, published: !i.hidden }),
  },
  {
    collection: 'journey', label: 'Career journey', make: newJourney,
    columns: ['title', 'org', 'period', 'kind', 'description', 'link', 'published'],
    apply: (i, r) => { assign(i, r, ['title', 'org', 'period', 'description', 'link']); if (r.kind) i.kind = r.kind; i.hidden = !yes(r.published ?? '') },
    view: (i) => ({ ...i, published: !i.hidden }),
  },
  {
    collection: 'notes', label: 'Notes', make: newNote,
    columns: ['title', 'slug', 'date', 'summary', 'body', 'tags', 'published'],
    apply: (i, r) => { assign(i, r, ['title', 'slug', 'date', 'summary', 'body']); i.tags = list(r.tags ?? ''); i.hidden = !yes(r.published ?? '') },
    view: (i) => ({ ...i, published: !i.hidden }),
  },
]

export function exportCsv(set: CsvSet, content: SiteContent): string {
  return toCsv(((content as any)[set.collection] as any[]).map(set.view), set.columns)
}

/** Turns CSV text into new items. Nothing is applied here; the caller decides what to keep. Never overwrites existing items. */
export function importCsv(set: CsvSet, text: string): { items: any[]; skipped: number; missing: string[] } {
  const rows = parseCsv(text)
  if (rows.length < 2) return { items: [], skipped: 0, missing: [] }
  const head = rows[0].map((h) => h.trim())
  const missing = set.columns.filter((c) => !head.includes(c) && c !== 'published' && c !== 'approved')
  const items: any[] = []
  let skipped = 0
  for (const cells of rows.slice(1)) {
    const row: Record<string, string> = {}
    head.forEach((h, i) => { row[h] = (cells[i] ?? '').replace(/^'(?=[=+\-@])/, '') })
    const first = row[set.columns[0]]
    if (!first || !first.trim()) { skipped++; continue }
    const item = set.make()
    set.apply(item, row)
    items.push(item)
  }
  return { items, skipped, missing }
}
