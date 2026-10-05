import type { Project, ResultClass, ResultEntry } from './types'

/** Percentage change: the supplied value, or calculated only when both start and end exist. Never invented. */
export function pctOf(r: Pick<ResultEntry, 'pctChange' | 'start' | 'end'>): { value: number; calculated: boolean } | null {
  if (typeof r.pctChange === 'number') return { value: r.pctChange, calculated: false }
  if (typeof r.start === 'number' && typeof r.end === 'number' && r.start > 0) return { value: ((r.end - r.start) / r.start) * 100, calculated: true }
  return null
}

export interface ResultRow {
  id: string
  metric: string
  platform: string
  campaign: string
  project: string
  period: string
  start: number | null
  end: number | null
  prefix: string
  unit: string
  change: number | null
  changeKind: '' | 'reported' | 'calculated'
  classification: ResultClass
  /** Confidential results with hidden values carry no numbers at all. */
  masked: boolean
}

/** One flat row per result, ready to chart, tabulate or export. Hidden confidential values never leave the result. */
export function resultRows(results: ResultEntry[], projects: Pick<Project, 'id' | 'title'>[] = []): ResultRow[] {
  return results.map((r) => {
    const masked = r.classification === 'confidential' && r.showValues === false
    const pct = masked ? null : pctOf(r)
    return {
      id: r.id, metric: r.metric, platform: r.platform ?? '', campaign: r.campaign ?? '',
      project: projects.find((p) => p.id === r.projectId)?.title ?? '', period: r.period ?? '',
      start: masked || typeof r.start !== 'number' ? null : r.start, end: masked || typeof r.end !== 'number' ? null : r.end,
      prefix: r.prefix ?? '', unit: r.unit ?? '', change: pct ? pct.value : null, changeKind: pct ? (pct.calculated ? 'calculated' : 'reported') : '',
      classification: r.classification, masked,
    }
  })
}

export type ResultSort = 'change' | 'metric' | 'platform'

export function sortRows(rows: ResultRow[], by: ResultSort): ResultRow[] {
  const copy = [...rows]
  if (by === 'change') return copy.sort((a, b) => (b.change ?? -Infinity) - (a.change ?? -Infinity))
  if (by === 'platform') return copy.sort((a, b) => a.platform.localeCompare(b.platform) || a.metric.localeCompare(b.metric))
  return copy.sort((a, b) => a.metric.localeCompare(b.metric))
}

const cell = (v: unknown) => {
  const s = String(v ?? '')
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s // keeps a spreadsheet from running text as a formula
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** The visible results as a CSV the visitor can open in a spreadsheet. */
export function resultsToCsv(rows: ResultRow[]): string {
  const cols: [string, (r: ResultRow) => unknown][] = [
    ['Metric', (r) => r.metric], ['Platform', (r) => r.platform], ['Campaign', (r) => r.campaign], ['Project', (r) => r.project], ['Period', (r) => r.period],
    ['Start', (r) => r.start], ['End', (r) => r.end], ['Unit', (r) => `${r.prefix}${r.unit}`.trim()],
    ['Change %', (r) => (r.change === null ? '' : Number(r.change.toFixed(1)))], ['Change source', (r) => r.changeKind], ['Type', (r) => r.classification],
  ]
  return [cols.map(([h]) => h).join(','), ...rows.map((r) => cols.map(([, f]) => cell(f(r))).join(','))].join('\r\n') + '\r\n'
}
