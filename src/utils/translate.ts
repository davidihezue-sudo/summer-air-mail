/**
 * Automatic translation that keeps the site's light formatting intact. A translator is given plain sentences; links, web addresses,
 * email addresses, bullets and paragraph breaks are held back and put back afterwards, and a line that comes back damaged is left
 * in the original language instead of being published broken.
 */

export interface Engine {
  /** Shown to the owner, for example "Chrome on this computer". */
  name: string
  /** Translate each string in order. Must return one result per input. */
  translate: (texts: string[]) => Promise<string[]>
}

const TOKEN = (n: number) => `ZQX${n}ZQX`
const TOKEN_RE = /ZQX\s*(\d+)\s*ZQX/gi
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g
const BARE_RE = /(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g
const BULLET_RE = /^(\s*(?:[-*]|\d+[.)])\s+)(.*)$/

interface Line { prefix: string; body: string; protect: { kind: 'link' | 'raw'; label?: string; url: string }[]; blank: boolean }

function prepare(line: string): Line {
  if (!line.trim()) return { prefix: '', body: '', protect: [], blank: true }
  const m = BULLET_RE.exec(line)
  const prefix = m ? m[1] : ''
  let body = m ? m[2] : line
  const protect: Line['protect'] = []
  body = body.replace(LINK_RE, (_s, label: string, url: string) => { protect.push({ kind: 'link', label, url }); return TOKEN(protect.length - 1) })
  body = body.replace(BARE_RE, (url: string) => { protect.push({ kind: 'raw', url }); return TOKEN(protect.length - 1) })
  return { prefix, body: body.trim(), protect, blank: false }
}

const stars = (s: string) => (s.match(/\*/g) ?? []).length

/**
 * Translate one written field. Returns the translation and how many lines had to stay in the original language.
 * `translateMany` is called once with every sentence and link label in the field.
 */
export async function translateRich(text: string, translateMany: (texts: string[]) => Promise<string[]>): Promise<{ text: string; kept: number }> {
  const lines = text.split('\n').map(prepare)
  const jobs: string[] = []
  const slot = lines.map((l) => {
    if (l.blank || !/[\p{L}]/u.test(l.body.replace(TOKEN_RE, ''))) return { body: -1, labels: [] as number[] }
    const body = jobs.push(l.body) - 1
    const labels = l.protect.map((p) => (p.kind === 'link' ? jobs.push(p.label ?? '') - 1 : -1))
    return { body, labels }
  })
  if (!jobs.length) return { text, kept: 0 }
  const done = await translateMany(jobs)
  if (!Array.isArray(done) || done.length !== jobs.length) throw new Error('The translator returned the wrong number of answers.')
  let kept = 0
  const original = text.split('\n')
  const out = lines.map((l, i) => {
    const s = slot[i]
    if (s.body < 0) return original[i]
    let t = String(done[s.body] ?? '').trim()
    if (!t) { kept++; return original[i] }
    // Every held-back piece must come back exactly once, or the line is not safe to publish.
    const seen = new Map<number, number>()
    for (const m of t.matchAll(TOKEN_RE)) seen.set(Number(m[1]), (seen.get(Number(m[1])) ?? 0) + 1)
    if (l.protect.some((_p, n) => seen.get(n) !== 1) || [...seen.keys()].some((n) => n >= l.protect.length)) { kept++; return original[i] }
    t = t.replace(TOKEN_RE, (_x, n: string) => {
      const p = l.protect[Number(n)]
      if (p.kind === 'raw') return p.url
      const label = String(done[s.labels[Number(n)]] ?? '').trim() || p.label
      return `[${label}](${p.url})`
    })
    // Bold and italic markers must still pair up; if the translator dropped or added some, drop them all rather than break the text.
    if (stars(t) !== stars(l.body) || stars(t) % 2 !== 0) t = t.replace(/\*/g, '')
    return `${l.prefix}${t}`
  })
  return { text: out.join('\n'), kept }
}

export interface TranslateReport { translated: Record<string, string>; failed: string[]; keptLines: number }

/**
 * Translate many fields one after another, translating each distinct sentence only once. Reports progress, can be stopped,
 * and carries on past a field that fails.
 */
export async function translateFields(
  fields: { path: string; value: string }[],
  engine: Engine,
  opts: { onProgress?: (done: number, total: number) => void; signal?: AbortSignal } = {},
): Promise<TranslateReport> {
  const cache = new Map<string, string>()
  const translated: Record<string, string> = {}
  const failed: string[] = []
  let keptLines = 0
  const many = async (texts: string[]) => {
    const need = [...new Set(texts.filter((t) => !cache.has(t)))]
    if (need.length) {
      const got = await engine.translate(need)
      if (got.length !== need.length) throw new Error('The translator returned the wrong number of answers.')
      need.forEach((t, i) => cache.set(t, got[i]))
    }
    return texts.map((t) => cache.get(t) ?? t)
  }
  let n = 0
  for (const f of fields) {
    if (opts.signal?.aborted) break
    try {
      const r = await translateRich(f.value, many)
      if (r.text !== f.value || r.kept === 0) translated[f.path] = r.text
      keptLines += r.kept
    } catch (e) {
      // A stopped or exhausted translator ends the run; one odd field does not.
      if ((e as { fatal?: boolean }).fatal) throw Object.assign(e as Error, { partial: { translated, failed, keptLines } satisfies TranslateReport })
      failed.push(f.path)
    }
    opts.onProgress?.(++n, fields.length)
  }
  return { translated, failed, keptLines }
}
