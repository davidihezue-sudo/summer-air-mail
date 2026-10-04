import { useEffect, useRef, useState } from 'react'
import { Download, Rocket, Upload } from 'lucide-react'
import { useAdmin } from '../store'
import { api } from '../api'
import { Badge, Card, Confirm, PageHead } from '../ui'
import { PreviewFrame, type Viewport } from '../PreviewFrame'
import { normalizeContent } from '../../content/bundle'
import { SEASON_ORDER, THEMES } from '../../themes'
import type { ProfessionalIntensity, SeasonName } from '../../content/types'

export function PublishPage() {
  const { content, status, publish, discard, replace, saveNow, save } = useAdmin()
  const [viewport, setViewport] = useState<Viewport>(() => (window.innerWidth < 700 ? 'mobile' : 'desktop'))
  const [season, setSeason] = useState<SeasonName | 'live'>('live')
  const [pro, setPro] = useState<ProfessionalIntensity | 'live'>('live')
  const [history, setHistory] = useState<{ id: string; publishedAt: string }[]>([])
  const [msg, setMsg] = useState('')
  const [confirm, setConfirm] = useState<'discard' | 'publish' | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => { api.history().then((r) => setHistory(r.history)).catch(() => {}) }, [status?.publishedAt])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      const r = await api.importContent(data)
      replace(normalizeContent(r.draft), r.rev, r)
      setMsg('Backup imported into your draft. Review it, then publish.')
    } catch (e) { setMsg(`Could not import: ${(e as Error).message}`) }
  }

  return (
    <>
      <PageHead title="Preview & Publish" intro="Edits save automatically as a private draft. Preview them on any screen size or season, then publish to update the live site." />

      <Card title="Publish">
        <p>{status?.publishedAt ? <>Live site last published <strong>{new Date(status.publishedAt).toLocaleString()}</strong>.</> : 'Nothing has been published yet. Until you publish, visitors see the built-in starter content.'}</p>
        <p>{status?.unpublished ? <Badge tone="warn">Unpublished changes</Badge> : <Badge tone="good">Up to date</Badge>} <Badge>{save === 'saved' ? 'Draft saved' : save === 'saving' ? 'Saving' : 'Unsaved changes'}</Badge></p>
        <div className="arow">
          <button type="button" className="abtn abtn--primary" onClick={() => setConfirm('publish')}><Rocket size={14} aria-hidden /> Publish draft to the live site</button>
          <button type="button" className="abtn" disabled={!status?.unpublished} onClick={() => setConfirm('discard')}>Discard draft changes</button>
          <a className="abtn" href="/" target="_blank" rel="noopener noreferrer">View live site<span className="sr-only"> (opens in a new tab)</span></a>
        </div>
        {msg && <p role="status" className="ahelp">{msg}</p>}
      </Card>

      <Card title="Preview">
        <div className="atoolbar">
          <div className="arow" role="group" aria-label="Preview size">{(['desktop', 'tablet', 'mobile'] as Viewport[]).map((v) => <button key={v} type="button" aria-pressed={viewport === v} className={`abtn ${viewport === v ? 'abtn--primary' : ''}`} onClick={() => setViewport(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}</div>
          <label>Season <select value={season} onChange={(e) => setSeason(e.target.value as SeasonName | 'live')}><option value="live">As configured</option>{SEASON_ORDER.map((s) => <option key={s} value={s}>{THEMES[s].label}</option>)}</select></label>
          <label>Intensity <select value={pro} onChange={(e) => setPro(e.target.value as ProfessionalIntensity | 'live')}><option value="live">As configured</option><option value="creative">Creative</option><option value="balanced">Balanced</option><option value="professional">Professional</option></select></label>
        </div>
        <PreviewFrame viewport={viewport} season={season === 'live' ? undefined : season} professional={pro === 'live' ? undefined : pro} />
      </Card>

      <Card title="Earlier versions">
        {history.length === 0 ? <p className="ahelp">Each time you publish, the previous live version is kept here so you can go back.</p> : (
          <ul className="arows">{history.map((h) => (
            <li key={h.id} className="arow-item"><span className="arow-item__main"><span className="arow-item__text"><strong>{new Date(h.publishedAt).toLocaleString()}</strong></span></span>
              <button type="button" className="abtn" onClick={async () => { await saveNow(); const r = await api.restore(h.id); replace(normalizeContent(r.draft), r.rev, r); setMsg('Restored into your draft. Publish to make it live.') }}>Restore to draft</button></li>
          ))}</ul>
        )}
      </Card>

      <Card title="Backup">
        <p className="ahelp">Download a copy of your draft, or load a backup into it. Media files are not included; they live in the data folder on the server.</p>
        <div className="arow">
          <button type="button" className="abtn" onClick={exportJson}><Download size={14} aria-hidden /> Download backup</button>
          <button type="button" className="abtn" onClick={() => file.current?.click()}><Upload size={14} aria-hidden /> Load a backup into the draft</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importJson(f); e.target.value = '' }} />
        </div>
      </Card>

      <Confirm open={confirm === 'publish'} title="Publish to the live site?" body="Everything in your draft becomes visible to visitors." confirmLabel="Publish" onCancel={() => setConfirm(null)} onConfirm={async () => { setConfirm(null); setMsg((await publish()) ? 'Published.' : 'Could not publish.') }} />
      <Confirm open={confirm === 'discard'} title="Discard unpublished changes?" body="Your draft goes back to match the live site. This cannot be undone." confirmLabel="Discard" onCancel={() => setConfirm(null)} onConfirm={async () => { setConfirm(null); await discard(); setMsg('Draft reset to the live version.') }} />
    </>
  )
}
