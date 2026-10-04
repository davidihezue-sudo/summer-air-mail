import { useEffect, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { api, type Subscriber } from '../api'
import { Card, Confirm, PageHead } from '../ui'

export function SubscribersPage() {
  const [items, setItems] = useState<Subscriber[] | null>(null)
  const [del, setDel] = useState<string | null>(null)
  useEffect(() => { void api.subscribers().then((r) => setItems(r.items)) }, [])
  return (
    <>
      <PageHead title="Subscribers" intro="People who ticked the consent box on your newsletter signup. Export them to your email service, and remove anyone who asks." actions={<a className="abtn" href="/api/admin/subscribers.csv" download><Download size={14} aria-hidden /> Export CSV</a>} />
      <Card title={items ? `${items.length} subscribers` : 'Loading'}>
        {items?.length === 0 && <p className="ahelp">No subscribers yet. Switch on the signup under Booking &amp; Newsletter and choose "Collect addresses here".</p>}
        {items && items.length > 0 && (
          <table className="atable"><thead><tr><th>Email</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {items.map((s) => <tr key={s.id}><td>{s.email}</td><td>{new Date(s.at).toLocaleDateString()}</td><td><button type="button" className="abtn abtn--danger" onClick={() => setDel(s.id)}><Trash2 size={14} aria-hidden /> Remove<span className="sr-only"> {s.email}</span></button></td></tr>)}
          </tbody></table>
        )}
      </Card>
      <Confirm open={!!del} title="Remove this subscriber?" body="Their address is deleted from the server." confirmLabel="Remove" onCancel={() => setDel(null)} onConfirm={async () => { if (del) { await api.deleteSubscriber(del); setItems((l) => l?.filter((x) => x.id !== del) ?? null) } setDel(null) }} />
    </>
  )
}
