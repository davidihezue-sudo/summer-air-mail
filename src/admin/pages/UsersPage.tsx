import { useCallback, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { api, type UserRow } from '../api'
import { Badge, Card, Confirm, PageHead } from '../ui'

const ROLE_HELP = { owner: 'Everything.', editor: 'Edits content, media and the inbox. Publishes only if you allow it.', viewer: 'Looks but cannot change anything.' }

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [form, setForm] = useState({ username: '', password: '', role: 'editor' })
  const [msg, setMsg] = useState('')
  const [del, setDel] = useState<string | null>(null)
  const load = useCallback(() => api.users().then((r) => setUsers(r.users)).catch((e: Error) => setMsg(e.message)), [])
  useEffect(() => { void load() }, [load])
  const run = async (fn: () => Promise<{ users: UserRow[] }>, ok: string) => { try { setUsers((await fn()).users); setMsg(ok) } catch (e) { setMsg((e as Error).message) } }

  return (
    <>
      <PageHead title="Team & Access" intro="Invite a collaborator, such as a designer, a mentor or a client. Roles are enforced on the server, not just hidden in the screen." />
      <Card title="People">
        <ul className="arows">
          {users.map((u) => (
            <li key={u.username} className="arow-item">
              <span className="arow-item__main"><strong>{u.username}</strong> <Badge tone={u.role === 'owner' ? 'info' : 'neutral'}>{u.role}</Badge></span>
              {u.role !== 'owner' && (
                <span className="arow-item__actions">
                  <select aria-label={`Role for ${u.username}`} value={u.role} onChange={(e) => void run(() => api.updateUser(u.username, { role: e.target.value }), 'Role changed. They are signed out and must sign in again.')}><option value="editor">Editor</option><option value="viewer">Viewer</option></select>
                  <button type="button" className="abtn abtn--danger" onClick={() => setDel(u.username)}><Trash2 size={14} aria-hidden /> Remove<span className="sr-only"> {u.username}</span></button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Add a person">
        <form className="aform" onSubmit={(e) => { e.preventDefault(); void run(() => api.addUser(form.username, form.password, form.role), 'Added. Send them the username and password separately.').then(() => setForm({ username: '', password: '', role: 'editor' })) }}>
          <label className="afield"><span className="alabel">Username</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" required /></label>
          <label className="afield"><span className="alabel">Temporary password (12 characters or more)</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" minLength={12} required /></label>
          <label className="afield"><span className="alabel">Role</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="editor">Editor</option><option value="viewer">Viewer</option></select><span className="ahelp">{ROLE_HELP[form.role as 'editor' | 'viewer']}</span></label>
          <button className="abtn abtn--primary">Add person</button>
        </form>
        {msg && <p role="status" className="ahelp">{msg}</p>}
      </Card>
      <Confirm open={!!del} title={`Remove ${del}?`} body="They are signed out at once and can no longer reach the admin." confirmLabel="Remove" onCancel={() => setDel(null)} onConfirm={() => { const u = del; setDel(null); if (u) void run(() => api.removeUser(u), 'Removed.') }} />
    </>
  )
}
