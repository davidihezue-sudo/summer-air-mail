import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { api, type BackupStatus, type EnvInfo, type ServerSettings } from '../api'
import { Badge, Card, PageHead, Switch } from '../ui'

const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`

export function ServerPage() {
  const [s, setS] = useState<ServerSettings | null>(null)
  const [env, setEnv] = useState<EnvInfo | null>(null)
  const [backups, setBackups] = useState<{ name: string; size: number }[]>([])
  const [bs, setBs] = useState<BackupStatus | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([api.settings(), api.backups()])
    setS(a.settings); setEnv(a.env); setBackups(b.backups); setBs(b.status)
  }, [])
  useEffect(() => { load().catch((e: Error) => setMsg(e.message)) }, [load])
  if (!s || !env) return <p role="status">{msg || 'Loading'}</p>

  const save = async (patch: Partial<ServerSettings>) => {
    const next = { ...s, ...patch, backups: { ...s.backups, ...(patch.backups ?? {}) } }
    setS(next)
    try { const r = await api.saveSettings(next); setS(r.settings); setEnv(r.env); setMsg('Saved.') } catch (e) { setMsg((e as Error).message) }
  }

  return (
    <>
      <PageHead title="Server Settings & Backups" intro="Settings that live on your server rather than in your published content. Passwords and keys are never shown here: they are set as environment variables." />
      <Card title="Where your data lives">
        <p>Storage: <Badge tone="info">{env.storage === 'postgres' ? 'Postgres database' : 'Files in the data folder'}</Badge></p>
        {env.dataDir && <p className="ahelp">Folder: <code>{env.dataDir}</code>{env.storage === 'postgres' ? ' (uploaded files and backups only)' : ' (everything)'}</p>}
        <p className="ahelp">Set DATABASE_URL to keep content, messages and settings in Postgres. Uploaded images and files stay in the data folder (or your host's persistent disk).</p>
      </Card>
      <Card title="Alerts">
        <div className="aform">
          <label className="afield"><span className="alabel">Send alerts to this email</span><input type="email" value={s.notifyEmail} onChange={(e) => setS({ ...s, notifyEmail: e.target.value })} onBlur={() => void save({ notifyEmail: s.notifyEmail })} /></label>
          <Switch checked={s.notifyOnEnquiry} onChange={(v) => void save({ notifyOnEnquiry: v })} label="Alert me about new messages" />
          <Switch checked={s.notifyOnSubscriber} onChange={(v) => void save({ notifyOnSubscriber: v })} label="Alert me about new newsletter subscribers" />
          <p className="ahelp">Email sending: {env.emailConfigured ? <Badge tone="good">SMTP configured</Badge> : <Badge tone="warn">Not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)</Badge>} · Webhook (Slack, Discord, Zapier): {env.webhookConfigured ? <Badge tone="good">Configured</Badge> : <Badge tone="neutral">Not set (ALERT_WEBHOOK_URL)</Badge>}</p>
          <button type="button" className="abtn" onClick={async () => { const r = await api.testAlert(); setMsg(`Test sent. Email: ${r.email ? 'delivered to the mail server' : 'not sent'}. Webhook: ${r.webhook ? 'delivered' : 'not sent'}.`) }}>Send a test alert</button>
          <label className="afield"><span className="alabel">Delete messages older than (days, 0 keeps them)</span><input type="number" min={0} max={3650} value={s.enquiryRetentionDays} onChange={(e) => setS({ ...s, enquiryRetentionDays: Number(e.target.value) })} onBlur={() => void save({ enquiryRetentionDays: s.enquiryRetentionDays })} /></label>
        </div>
      </Card>
      <Card title="Team">
        <Switch checked={s.editorsCanPublish} onChange={(v) => void save({ editorsCanPublish: v })} label="Editors may publish" help="Off means editors can change the draft but only you can make it live." />
      </Card>
      <Card title="Backups" actions={<a className="abtn" href="/api/admin/backups/download" download><Download size={14} aria-hidden /> Download a backup now</a>}>
        <div className="aform">
          <Switch checked={s.backups.enabled} onChange={(v) => void save({ backups: { ...s.backups, enabled: v } })} label="Make a backup automatically" help="Saved on the server in the data folder. A server disk failure would take them too, so also download one or use S3." />
          <label className="afield"><span className="alabel">How often (hours)</span><input type="number" min={1} max={720} value={s.backups.everyHours} onChange={(e) => setS({ ...s, backups: { ...s.backups, everyHours: Number(e.target.value) } })} onBlur={() => void save({ backups: s.backups })} /></label>
          <label className="afield"><span className="alabel">How many to keep</span><input type="number" min={1} max={60} value={s.backups.keep} onChange={(e) => setS({ ...s, backups: { ...s.backups, keep: Number(e.target.value) } })} onBlur={() => void save({ backups: s.backups })} /></label>
          <Switch checked={s.backups.s3} onChange={(v) => void save({ backups: { ...s.backups, s3: v } })} label="Also upload each backup to S3 compatible storage" help={env.s3Configured ? 'Configured through environment variables.' : 'Not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY.'} />
          <button type="button" className="abtn abtn--primary" disabled={busy} onClick={async () => { setBusy(true); try { const r = await api.runBackup(); setBackups(r.backups); setBs(r.result); setMsg(r.result.ok ? `Backup made${r.result.uploaded ? ' and uploaded' : ''}.` : `Backup failed: ${r.result.error}`) } finally { setBusy(false) } }}>Back up now</button>
          {bs?.at && <p className="ahelp">Last attempt {new Date(bs.at).toLocaleString()}: {bs.ok ? 'worked' : `failed (${bs.error})`}</p>}
        </div>
        {backups.length > 0 && <ul className="arows">{backups.map((b) => <li key={b.name} className="arow-item"><span className="arow-item__main">{b.name} <span className="ahelp">{mb(b.size)}</span></span><a className="abtn" href={`/api/admin/backups/file/${b.name}`} download>Download</a></li>)}</ul>}
      </Card>
      {msg && <p role="status" className="atoast">{msg}</p>}
    </>
  )
}
