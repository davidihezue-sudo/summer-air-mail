import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
import { useAdmin } from '../store'
import { Card, Confirm, PageHead } from '../ui'
import { Fields } from '../fields'
import { baseContent, normalizeContent } from '../../content/bundle'

export function AdvancedPage() {
  const { replace, status, logout } = useAdmin()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState('')
  const [reset, setReset] = useState(false)

  const change = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.changePassword(current, next)
      setMsg('Password changed. Please sign in again.')
      setTimeout(() => void logout(), 1200)
    } catch (err) { setMsg((err as ApiError).message) }
  }

  return (
    <>
      <PageHead title="Advanced Settings" />
      <Card title="Custom project types">
        <div className="aform"><Fields base="" fields={[{ kind: 'strings', key: 'categories', label: 'Extra project types', help: 'Added to the built-in list (Social Media Campaign, Reels, Paid Advertising and so on) wherever you choose a project type.' }]} /></div>
      </Card>
      <Card title="Change password">
        <form className="aform" onSubmit={change}>
          <label className="afield"><span>Current password</span><input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></label>
          <label className="afield"><span>New password (at least 12 characters)</span><input type="password" autoComplete="new-password" minLength={12} value={next} onChange={(e) => setNext(e.target.value)} required /></label>
          <button className="abtn abtn--primary" disabled={!current || next.length < 12}>Change password</button>
          {msg && <p role="status" className="ahelp">{msg}</p>}
        </form>
      </Card>
      <Card title="Start again">
        <p className="ahelp">Replace your draft with the built-in starter content. Your published site and uploaded files are not touched until you publish.</p>
        <button type="button" className="abtn abtn--danger" onClick={() => setReset(true)}>Reset draft to starter content</button>
      </Card>
      <Card title="About this install">
        <p className="ahelp">Draft revision {status?.draftRev ?? 0}. Content is stored in <code>data/content.json</code> and uploads in <code>data/uploads</code> on the server. Back that folder up.</p>
      </Card>
      <Confirm open={reset} title="Reset your draft?" body="All unpublished edits are replaced with the starter content." confirmLabel="Reset" onCancel={() => setReset(false)} onConfirm={async () => { setReset(false); const r = await api.importContent(structuredClone(baseContent)); replace(normalizeContent(r.draft), r.rev, r) }} />
    </>
  )
}
