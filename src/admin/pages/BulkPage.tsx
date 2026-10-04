import { useMemo, useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useAdmin } from '../store'
import { Card, Confirm, PageHead } from '../ui'
import { CSV_SETS, exportCsv, importCsv } from '../csv'
import type { SiteContent } from '../../content/types'

/* eslint-disable @typescript-eslint/no-explicit-any */
const titleOf = (x: any) => x.title || x.name || x.metric || x.id
const shownOf = (x: any) => ('approved' in x ? !!x.approved : !x.hidden)
const setShown = (x: any, v: boolean) => { if ('approved' in x) x.approved = v; else x.hidden = !v }

export function BulkPage() {
  const { content, edit } = useAdmin()
  const [key, setKey] = useState(CSV_SETS[0].collection)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState('')
  const [del, setDel] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const set = CSV_SETS.find((s) => s.collection === key)!
  const list = (content as any)[key] as any[]
  const all = useMemo(() => list.map((x) => x.id), [list])
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const act = (fn: (x: any) => void) => { edit((c) => { for (const x of (c as any)[key]) if (picked.has(x.id)) fn(x) }); setMsg(`Updated ${picked.size} item${picked.size === 1 ? '' : 's'}.`) }
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportCsv(set, content as SiteContent)], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = `${key}.csv`; a.click(); URL.revokeObjectURL(url)
  }
  const upload = async (f: File) => {
    const r = importCsv(set, await f.text())
    if (!r.items.length) { setMsg(r.missing.length ? `No rows imported. The first row must name the columns, including: ${r.missing.join(', ')}.` : 'No rows found to import.'); return }
    edit((c) => { (c as any)[key].push(...r.items) })
    setMsg(`Imported ${r.items.length} new item${r.items.length === 1 ? '' : 's'} as drafts${r.skipped ? `, skipped ${r.skipped} row${r.skipped === 1 ? '' : 's'} with no ${set.columns[0]}` : ''}${r.missing.length ? `. Columns not found: ${r.missing.join(', ')}` : ''}. Review and publish them.`)
  }

  return (
    <>
      <PageHead title="Bulk Tools & CSV" intro="Change many items at once, or move content in and out of a spreadsheet. Imports always create new draft items, so nothing existing is overwritten and nothing goes live until you publish." />
      <Card>
        <div className="aform">
          <label className="afield"><span className="alabel">Content type</span>
            <select value={key} onChange={(e) => { setKey(e.target.value as typeof key); setPicked(new Set()); setMsg('') }}>{CSV_SETS.map((s) => <option key={s.collection} value={s.collection}>{s.label} ({((content as any)[s.collection] as any[]).length})</option>)}</select>
          </label>
          <div className="arow">
            <button type="button" className="abtn" onClick={download}><Download size={14} aria-hidden /> Export CSV</button>
            <button type="button" className="abtn" onClick={() => file.current?.click()}><Upload size={14} aria-hidden /> Import CSV</button>
            <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = '' }} />
          </div>
          <p className="ahelp">Columns: {set.columns.join(', ')}. Use yes or no for published and approved.</p>
          {msg && <p role="status" className="ahelp">{msg}</p>}
        </div>
      </Card>
      <Card title={`${picked.size} selected`} actions={
        <span className="arow">
          <button type="button" className="abtn" disabled={!picked.size} onClick={() => act((x) => setShown(x, true))}>Publish / approve</button>
          <button type="button" className="abtn" disabled={!picked.size} onClick={() => act((x) => setShown(x, false))}>Hide</button>
          <button type="button" className="abtn abtn--danger" disabled={!picked.size} onClick={() => setDel(true)}>Delete</button>
        </span>}>
        <div className="atable-wrap"><table className="atable"><thead><tr><th><input type="checkbox" aria-label="Select all" checked={picked.size === all.length && all.length > 0} onChange={(e) => setPicked(e.target.checked ? new Set(all) : new Set())} /></th><th>Title</th><th>Status</th></tr></thead><tbody>
          {list.map((x) => <tr key={x.id}><td><input type="checkbox" aria-label={`Select ${titleOf(x)}`} checked={picked.has(x.id)} onChange={() => toggle(x.id)} /></td><td>{titleOf(x)}</td><td>{shownOf(x) ? 'Visible' : 'Hidden'}</td></tr>)}
        </tbody></table></div>
      </Card>
      <Confirm open={del} title={`Delete ${picked.size} items?`} body="They are removed from the draft. You can restore an earlier version from the item history until you publish." onCancel={() => setDel(false)} onConfirm={() => { edit((c) => { (c as any)[key] = (c as any)[key].filter((x: any) => !picked.has(x.id)) }); setPicked(new Set()); setDel(false) }} />
    </>
  )
}
