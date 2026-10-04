import { useCallback, useEffect, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { api, type Enquiry } from '../api'
import { Badge, Card, Confirm, PageHead } from '../ui'

export function InboxPage() {
  const [items, setItems] = useState<Enquiry[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [del, setDel] = useState<string | null>(null)
  const load = useCallback(() => api.enquiries().then((r) => setItems(r.items)).catch((e: Error) => setError(e.message)), [])
  useEffect(() => { void load() }, [load])

  const toggle = async (e: Enquiry, read: boolean) => { await api.markEnquiry(e.id, read); setItems((l) => l?.map((x) => (x.id === e.id ? { ...x, read } : x)) ?? null) }
  const unread = items?.filter((x) => !x.read).length ?? 0

  return (
    <>
      <PageHead title="Inbox" intro="Messages sent through your contact form (when it is set to send here). Only you and your team can see them." actions={<a className="abtn" href="/api/admin/enquiries.csv" download><Download size={14} aria-hidden /> Export CSV</a>} />
      {error && <p className="abanner" role="alert">{error}</p>}
      <Card title={items ? `${items.length} messages, ${unread} unread` : 'Loading'}>
        {items?.length === 0 && <p className="ahelp">No messages yet. In Contact, set the form to send to your inbox.</p>}
        <ul className="arows">
          {items?.map((e) => (
            <li key={e.id} className="arow-item arow-item--block">
              <button type="button" className="arow-item__main" aria-expanded={open === e.id} onClick={() => { setOpen(open === e.id ? null : e.id); if (!e.read) void toggle(e, true) }}>
                <span className="arow-item__text"><strong>{e.name}</strong> <span className="ahelp">{e.email} · {new Date(e.at).toLocaleString()}</span><span className="ahelp">{e.type}{e.company ? ` · ${e.company}` : ''}{e.budget ? ` · ${e.budget}` : ''}</span></span>
                {!e.read && <Badge tone="info">New</Badge>}
              </button>
              {open === e.id && (
                <div className="ainbox__body">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{e.message}</p>
                  <span className="arow-item__actions">
                    <a className="abtn abtn--primary" href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: ${e.type || 'your message'}`)}`}>Reply by email</a>
                    <button type="button" className="abtn" onClick={() => void toggle(e, !e.read)}>{e.read ? 'Mark unread' : 'Mark read'}</button>
                    <button type="button" className="abtn abtn--danger" onClick={() => setDel(e.id)}><Trash2 size={14} aria-hidden /> Delete</button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Confirm open={!!del} title="Delete this message?" body="It is removed from the server and cannot be recovered." onCancel={() => setDel(null)} onConfirm={async () => { if (del) { await api.deleteEnquiry(del); setItems((l) => l?.filter((x) => x.id !== del) ?? null) } setDel(null) }} />
    </>
  )
}
