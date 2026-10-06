// Small JSON-file collections for things that are not site content: enquiries, subscribers,
// insights, per-item snapshots and server settings. Atomic writes, one writer queue each.
import { createHash, randomBytes } from 'node:crypto'
import { asKv } from './kv.mjs'

function jsonFile(kvOrDir, name, initial) {
  const kv = asKv(kvOrDir)
  let data = structuredClone(initial)
  let queue = Promise.resolve()
  return {
    async init() {
      await kv.init()
      try { const v = await kv.read(name); if (v && typeof v === 'object') data = { ...structuredClone(initial), ...v } } catch { /* start fresh, never crash on a damaged log */ }
    },
    get: () => data,
    save() {
      queue = queue.then(() => kv.write(name, data)).catch((e) => console.error(`Could not save ${name}:`, e.message))
      return queue
    },
    flush: () => queue,
  }
}

const id = () => randomBytes(6).toString('hex')
const csvCell = (v) => { const s = String(v ?? ''); const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe }
export const toCsv = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\r\n') + '\r\n'

/* ---------- enquiries ---------- */
export const STAGES = ['new', 'replied', 'interview', 'won', 'closed']
const OPEN_STAGES = new Set(['new', 'replied', 'interview'])
const DATE = /^\d{4}-\d{2}-\d{2}$/
const withPipeline = (x) => ({ ...x, stage: STAGES.includes(x.stage) ? x.stage : 'new', notes: String(x.notes ?? ''), followUp: DATE.test(String(x.followUp ?? '')) ? x.followUp : '' })

export function createEnquiries(dir) {
  const f = jsonFile(dir, 'enquiries.json', { items: [] })
  return {
    init: f.init, flush: f.flush,
    async add(fields) {
      const item = { id: id(), at: new Date().toISOString(), read: false, stage: 'new', notes: '', followUp: '', ...fields }
      f.get().items.unshift(item)
      f.get().items = f.get().items.slice(0, 5000)
      await f.save()
      return item
    },
    list: () => f.get().items.map(withPipeline),
    unread: () => f.get().items.filter((x) => !x.read).length,
    /** Messages that still need an answer and have a follow-up date that has arrived. */
    due: (today = new Date().toISOString().slice(0, 10)) => f.get().items.map(withPipeline).filter((x) => OPEN_STAGES.has(x.stage) && x.followUp && x.followUp <= today),
    async mark(idv, read) { const x = f.get().items.find((i) => i.id === idv); if (!x) return false; x.read = !!read; await f.save(); return true },
    /** Change the stage, the private notes or the follow-up date. Anything invalid is refused, never half applied. */
    async update(idv, patch) {
      const x = f.get().items.find((i) => i.id === idv)
      if (!x) return { ok: false, status: 404, error: 'Not found.' }
      if ('stage' in patch && !STAGES.includes(patch.stage)) return { ok: false, status: 400, error: 'That is not a stage.' }
      if ('followUp' in patch && patch.followUp !== '' && !DATE.test(String(patch.followUp))) return { ok: false, status: 400, error: 'The follow-up must be a date.' }
      if ('stage' in patch) x.stage = patch.stage
      if ('notes' in patch) x.notes = String(patch.notes ?? '').slice(0, 4000)
      if ('followUp' in patch) x.followUp = patch.followUp
      if ('read' in patch) x.read = !!patch.read
      await f.save()
      return { ok: true, item: withPipeline(x) }
    },
    async remove(idv) { const n = f.get().items.length; f.get().items = f.get().items.filter((i) => i.id !== idv); await f.save(); return f.get().items.length < n },
    async prune(days) { if (!days) return 0; const cut = Date.now() - days * 864e5; const n = f.get().items.length; f.get().items = f.get().items.filter((i) => Date.parse(i.at) >= cut); if (f.get().items.length < n) await f.save(); return n - f.get().items.length },
    csv: () => toCsv(f.get().items.map(withPipeline), ['at', 'name', 'email', 'type', 'budget', 'company', 'message', 'read', 'stage', 'followUp', 'notes']),
  }
}

/* ---------- recommendations left by visitors, waiting for the owner ---------- */
export const ENDORSEMENT_STATUS = ['pending', 'approved', 'dismissed']
export function createEndorsements(dir) {
  const f = jsonFile(dir, 'endorsements.json', { items: [] })
  return {
    init: f.init, flush: f.flush,
    async add({ name, role, company, quote }) {
      const item = { id: id(), at: new Date().toISOString(), status: 'pending', name, role, company, quote }
      f.get().items.unshift(item)
      f.get().items = f.get().items.slice(0, 2000)
      await f.save()
      return item
    },
    list: () => f.get().items,
    pending: () => f.get().items.filter((x) => x.status === 'pending').length,
    async setStatus(idv, status) {
      if (!ENDORSEMENT_STATUS.includes(status)) return { ok: false, status: 400, error: 'That is not a status.' }
      const x = f.get().items.find((i) => i.id === idv)
      if (!x) return { ok: false, status: 404, error: 'Not found.' }
      x.status = status
      await f.save()
      return { ok: true, item: x }
    },
    async remove(idv) { const n = f.get().items.length; f.get().items = f.get().items.filter((i) => i.id !== idv); await f.save(); return f.get().items.length < n },
  }
}

/* ---------- subscribers ---------- */
export function createSubscribers(dir) {
  const f = jsonFile(dir, 'subscribers.json', { items: [] })
  return {
    init: f.init, flush: f.flush,
    async add(email, consentText) {
      const e = String(email).trim().toLowerCase()
      if (f.get().items.some((x) => x.email === e)) return { duplicate: true }
      f.get().items.unshift({ id: id(), email: e, at: new Date().toISOString(), consent: consentText })
      await f.save()
      return { ok: true }
    },
    list: () => f.get().items,
    async remove(idv) { const n = f.get().items.length; f.get().items = f.get().items.filter((i) => i.id !== idv); await f.save(); return f.get().items.length < n },
    csv: () => toCsv(f.get().items, ['at', 'email', 'consent']),
  }
}

/* ---------- insights: aggregates only ---------- */
const EVENTS = new Set(['view', 'project', 'cta', 'download', 'contact', 'note', 'share'])
const clip = (s, n = 120) => String(s ?? '').slice(0, n)
const HOME_DAYS = 90
const HOME_MAX = 5

export function createInsights(dir, { salt = randomBytes(16).toString('hex') } = {}) {
  const f = jsonFile(dir, 'insights.json', { days: {}, home: {}, homeSalt: '' })
  const seen = new Map() // day -> Set of hashes, memory only and dropped when the day ends
  const day = (d = new Date()) => d.toISOString().slice(0, 10)
  const bump = (o, k) => { if (k) o[k] = (o[k] ?? 0) + 1 }
  // The home network is remembered as a scrambled fingerprint (the address plus a secret that stays on the server), never the address itself.
  const homeKey = (ip) => createHash('sha256').update(`${f.get().homeSalt}|home|${ip}`).digest('hex').slice(0, 16)
  return {
    async init() {
      await f.init()
      if (!f.get().homeSalt) { f.get().homeSalt = randomBytes(16).toString('hex'); await f.save() }
    },
    flush: f.flush,
    /** Remember the network an admin signed in from, so later visits from it count as the owner's own. Keeps the five most recent. */
    async markHome(ip, now = new Date()) {
      if (!ip) return false
      const k = homeKey(ip)
      const d = day(now)
      const home = f.get().home
      if (home[k] === d) return false
      home[k] = d
      f.get().home = Object.fromEntries(Object.entries(home).sort((a, b) => b[1].localeCompare(a[1])).slice(0, HOME_MAX))
      await f.save()
      return true
    },
    /** True for a network the owner signed in from within the last 90 days. */
    isHome(ip, now = new Date()) {
      if (!ip) return false
      const last = f.get().home[homeKey(ip)]
      return !!last && last >= day(new Date(now.getTime() - HOME_DAYS * 864e5))
    },
    homeCount: () => Object.keys(f.get().home).length,
    async forgetHome() { f.get().home = {}; await f.save() },
    /** No IP or user agent is stored. The visitor hash uses a salt that changes daily and is never written to disk. */
    async record({ type, path = '', ref = '', name = '', ip = '', ua = '', own = false }, now = new Date()) {
      if (!EVENTS.has(type)) return false
      const d = day(now)
      for (const k of seen.keys()) if (k !== d && !k.startsWith(`own|${d}`)) seen.delete(k)
      if (own) {
        // The owner and the home network are counted apart, so outside visitors are never inflated by checking the site.
        const o = (f.get().days[d] ??= { views: 0, visitors: 0, paths: {}, refs: {}, events: {}, items: {} }).own ??= { views: 0, visitors: 0, paths: {}, events: 0 }
        if (type === 'view') {
          o.views++
          const h = createHash('sha256').update(`${salt}|${d}|${ip}|${ua}`).digest('hex').slice(0, 16)
          const sk = `own|${d}`
          const s = seen.get(sk) ?? new Set(); seen.set(sk, s)
          if (!s.has(h)) { s.add(h); o.visitors++ }
          bump(o.paths, clip(path, 80) || '/')
        } else o.events++
        await f.save()
        return true
      }
      const rec = (f.get().days[d] ??= { views: 0, visitors: 0, paths: {}, refs: {}, events: {}, items: {} })
      if (type === 'view') {
        rec.views++
        const h = createHash('sha256').update(`${salt}|${d}|${ip}|${ua}`).digest('hex').slice(0, 16)
        const s = seen.get(d) ?? new Set(); seen.set(d, s)
        if (!s.has(h)) { s.add(h); rec.visitors++ }
        bump(rec.paths, clip(path, 80) || '/')
        bump(rec.refs, clip(ref, 80) || 'direct')
      } else {
        bump(rec.events, type)
        if (name) bump((rec.items[type] ??= {}), clip(name, 80))
      }
      await f.save()
      return true
    },
    async prune(retentionDays, now = new Date()) {
      const cut = day(new Date(now.getTime() - retentionDays * 864e5))
      let n = 0
      for (const k of Object.keys(f.get().days)) if (k < cut) { delete f.get().days[k]; n++ }
      if (n) await f.save()
      return n
    },
    days: () => f.get().days,
    summary(range = 30, now = new Date()) {
      const out = { views: 0, visitors: 0, series: [], paths: {}, pathLast: {}, refs: {}, events: {}, items: {}, own: { views: 0, visitors: 0, daysSeen: 0, series: [], paths: {} }, homeNetworks: Object.keys(f.get().home).length }
      for (let i = range - 1; i >= 0; i--) {
        const d = day(new Date(now.getTime() - i * 864e5))
        const r = f.get().days[d]
        out.series.push({ day: d, views: r?.views ?? 0, visitors: r?.visitors ?? 0 })
        out.own.series.push({ day: d, views: r?.own?.views ?? 0, visitors: r?.own?.visitors ?? 0 })
        for (const k of Object.keys(r?.paths ?? {})) out.pathLast[k] = d // the days run oldest to newest, so the last write is the latest day
        if (r?.own) {
          out.own.views += r.own.views; out.own.visitors += r.own.visitors
          if (r.own.views) out.own.daysSeen++
          for (const [k, v] of Object.entries(r.own.paths ?? {})) out.own.paths[k] = (out.own.paths[k] ?? 0) + v
        }
        if (!r) continue
        out.views += r.views; out.visitors += r.visitors
        for (const [k, v] of Object.entries(r.paths)) out.paths[k] = (out.paths[k] ?? 0) + v
        for (const [k, v] of Object.entries(r.refs)) out.refs[k] = (out.refs[k] ?? 0) + v
        for (const [k, v] of Object.entries(r.events)) out.events[k] = (out.events[k] ?? 0) + v
        for (const [t, m] of Object.entries(r.items)) for (const [k, v] of Object.entries(m)) { out.items[t] ??= {}; out.items[t][k] = (out.items[t][k] ?? 0) + v }
      }
      return out
    },
  }
}

/* ---------- per-item snapshots for undo ---------- */
export const SNAP_COLLECTIONS = ['projects', 'services', 'tools', 'testimonials', 'contentItems', 'websites', 'skills', 'platforms', 'aiSkills', 'results', 'screenshots', 'process', 'journey', 'faqs', 'audiences', 'resources', 'notes', 'applications', 'shortLinks', 'looks']
export function createSnapshots(dir, { max = 12 } = {}) {
  const f = jsonFile(dir, 'snapshots.json', { items: {} })
  return {
    init: f.init, flush: f.flush,
    /** Remember the previous version of every list item that changed between two drafts. */
    async record(before, after, now = new Date()) {
      if (!before || !after) return 0
      let n = 0
      for (const c of SNAP_COLLECTIONS) {
        const prev = new Map((Array.isArray(before[c]) ? before[c] : []).map((x) => [x?.id, x]))
        for (const item of Array.isArray(after[c]) ? after[c] : []) {
          const old = prev.get(item?.id)
          if (!old) continue
          const a = JSON.stringify(old)
          if (a === JSON.stringify(item)) continue
          const key = `${c}:${item.id}`
          const list = (f.get().items[key] ??= [])
          if (list[0] && JSON.stringify(list[0].item) === a) continue
          list.unshift({ at: now.toISOString(), item: old })
          list.length = Math.min(list.length, max)
          n++
        }
      }
      if (n) await f.save()
      return n
    },
    list: (c, idv) => (f.get().items[`${c}:${idv}`] ?? []).map((x, i) => ({ index: i, at: x.at, title: x.item?.title ?? x.item?.name ?? x.item?.id })),
    get: (c, idv, index) => (f.get().items[`${c}:${idv}`] ?? [])[index]?.item ?? null,
  }
}

/* ---------- server settings (not part of draft/publish) ---------- */
export const DEFAULT_SETTINGS = {
  notifyEmail: '', notifyOnEnquiry: true, notifyOnSubscriber: false, enquiryRetentionDays: 0,
  editorsCanPublish: false,
  backups: { enabled: true, everyHours: 24, keep: 7, s3: false },
  digest: { enabled: false, day: 1, hour: 8, timezone: 'UTC', lastSent: '' },
}
function validZone(z) { try { new Intl.DateTimeFormat('en', { timeZone: String(z) }); return !!z } catch { return false } }

export function createSettings(dir) {
  const f = jsonFile(dir, 'settings.json', structuredClone(DEFAULT_SETTINGS))
  const clean = (s) => ({
    notifyEmail: /^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/.test(String(s.notifyEmail ?? '')) ? String(s.notifyEmail) : '',
    notifyOnEnquiry: s.notifyOnEnquiry !== false, notifyOnSubscriber: !!s.notifyOnSubscriber,
    enquiryRetentionDays: Math.max(0, Math.min(3650, Math.round(Number(s.enquiryRetentionDays) || 0))),
    editorsCanPublish: !!s.editorsCanPublish,
    backups: {
      enabled: !!s.backups?.enabled,
      everyHours: Math.max(1, Math.min(720, Math.round(Number(s.backups?.everyHours) || 24))),
      keep: Math.max(1, Math.min(60, Math.round(Number(s.backups?.keep) || 7))),
      s3: !!s.backups?.s3,
    },
    digest: {
      enabled: !!s.digest?.enabled,
      day: Math.max(0, Math.min(6, Math.round(Number(s.digest?.day ?? 1)))),
      hour: Math.max(0, Math.min(23, Math.round(Number(s.digest?.hour ?? 8)))),
      timezone: validZone(s.digest?.timezone) ? String(s.digest.timezone) : 'UTC',
      lastSent: /^\d{4}-\d{2}-\d{2}$/.test(String(s.digest?.lastSent ?? '')) ? s.digest.lastSent : '',
    },
  })
  return {
    init: f.init, flush: f.flush,
    get: () => clean(f.get()),
    async set(next) { Object.assign(f.get(), clean({ ...f.get(), ...next, backups: { ...f.get().backups, ...(next.backups ?? {}) }, digest: { ...f.get().digest, ...(next.digest ?? {}), lastSent: f.get().digest?.lastSent ?? '' } })); await f.save(); return clean(f.get()) },
    /** Remember the week a summary went out (a date inside it), so it is sent once. Not editable from the admin. */
    async markDigestSent(day) { f.get().digest = { ...(f.get().digest ?? {}), lastSent: day }; await f.save() },
  }
}
