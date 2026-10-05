import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { api, type Endorsement, type Enquiry } from '../api'
import { useAdmin } from '../store'
import { newTestimonial } from '../../content/factories'
import { Badge, Card, Confirm, PageHead } from '../ui'
import { Modal } from '../../components/ui/Modal'
import { STAGES, STAGE_HELP, STAGE_LABEL, addDays, followUpState, todayLocal, type Stage } from '../pipeline'

const when = (e: Enquiry) => new Date(e.at).toLocaleDateString()

function FollowUpBadge({ e, today }: { e: Enquiry; today: string }) {
  const s = followUpState(e.followUp, e.stage, today)
  if (!s) return null
  return <Badge tone={s === 'later' ? 'info' : 'warn'}>{s === 'overdue' ? `Chase: was due ${e.followUp}` : s === 'today' ? 'Chase today' : `Follow up ${e.followUp}`}</Badge>
}

/** Everything about one message: where it stands, when to chase it, and your own notes. */
function Detail({ e, onChange, onDelete, onClose }: { e: Enquiry; onChange: (next: Enquiry, counts: { unread: number; due: number }) => void; onDelete: () => void; onClose: () => void }) {
  const [notes, setNotes] = useState(e.notes)
  const [error, setError] = useState('')
  const today = todayLocal()
  const save = async (patch: Parameters<typeof api.updateEnquiry>[1]) => {
    setError('')
    try { const r = await api.updateEnquiry(e.id, patch); onChange(r.item, { unread: r.unread, due: r.due }) } catch (x) { setError((x as Error).message) }
  }
  return (
    <div className="ainbox__detail">
      <h2 className="adialog__title">{e.name}</h2>
      <p className="ahelp">{e.email} · {new Date(e.at).toLocaleString()}</p>
      <p className="ahelp">{[e.type, e.company, e.budget].filter(Boolean).join(' · ')}</p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{e.message}</p>
      <div className="aform">
        <label className="afield"><span className="alabel">Where it stands</span>
          <select value={e.stage} onChange={(ev) => void save({ stage: ev.target.value as Stage })}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}: {STAGE_HELP[s]}</option>)}</select>
        </label>
        <label className="afield"><span className="alabel">Follow up on</span>
          <input type="date" value={e.followUp} onChange={(ev) => void save({ followUp: ev.target.value })} />
          <span className="arow">
            {[['Tomorrow', 1], ['In 3 days', 3], ['In a week', 7], ['In two weeks', 14]].map(([label, n]) => <button key={label} type="button" className="abtn abtn--ghost" onClick={() => void save({ followUp: addDays(today, n as number) })}>{label}</button>)}
            {e.followUp && <button type="button" className="abtn abtn--ghost" onClick={() => void save({ followUp: '' })}>Clear</button>}
          </span>
        </label>
        <label className="afield"><span className="alabel">Your private notes</span>
          <textarea rows={5} value={notes} onChange={(ev) => setNotes(ev.target.value)} maxLength={4000} />
          <span className="arow"><button type="button" className="abtn abtn--primary" disabled={notes === e.notes} onClick={() => void save({ notes })}>Save notes</button><span className="ahelp">Only you and your team see these.</span></span>
        </label>
      </div>
      {error && <p role="alert" className="aerror">{error}</p>}
      <span className="arow-item__actions">
        <a className="abtn abtn--primary" href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: ${e.type || 'your message'}`)}`} onClick={() => { if (e.stage === 'new') void save({ stage: 'replied' }) }}>Reply by email</a>
        <button type="button" className="abtn" onClick={() => void save({ read: !e.read })}>{e.read ? 'Mark unread' : 'Mark read'}</button>
        <button type="button" className="abtn abtn--danger" onClick={onDelete}><Trash2 size={14} aria-hidden /> Delete</button>
        <button type="button" className="abtn" onClick={onClose}>Close</button>
      </span>
    </div>
  )
}

/** What visitors wrote through the recommendation form. Approving adds it to your Testimonials as a draft change; it is public only after you publish. */
function Recommendations({ onCount }: { onCount: (n: number) => void }) {
  const { edit } = useAdmin()
  const [items, setItems] = useState<Endorsement[] | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => { api.endorsements().then((r) => { setItems(r.items); onCount(r.pending) }).catch((e: Error) => setError(e.message)) }, [onCount])
  const set = async (e: Endorsement, status: Endorsement['status']) => {
    try { const r = await api.setEndorsementStatus(e.id, status); setItems((l) => l?.map((x) => (x.id === e.id ? r.item : x)) ?? null); onCount(r.pending) } catch (x) { setError((x as Error).message) }
  }
  const approve = async (e: Endorsement) => {
    edit((c) => { c.testimonials.push({ ...newTestimonial(), name: e.name, title: e.role, company: e.company, quote: e.quote, relationship: 'Left through this website', approved: true }) })
    await set(e, 'approved')
    setNote(`${e.name}'s recommendation was added to your Testimonials. Press Publish to show it on the site.`)
  }
  const remove = async (e: Endorsement) => { try { const r = await api.deleteEndorsement(e.id); setItems((l) => l?.filter((x) => x.id !== e.id) ?? null); onCount(r.pending) } catch (x) { setError((x as Error).message) } }
  const pending = items?.filter((x) => x.status === 'pending') ?? []
  const done = items?.filter((x) => x.status !== 'pending') ?? []
  return (
    <>
      {error && <p className="abanner" role="alert">{error}</p>}
      {note && <p className="abanner" role="status">{note}</p>}
      <Card title={items ? `${pending.length} waiting for you` : 'Loading'}>
        {items?.length === 0 && <p className="ahelp">Nothing yet. Turn on the form under Booking &amp; Newsletter, and people you have worked with can leave a recommendation. Nothing appears on your site until you approve it.</p>}
        <ul className="arows">
          {pending.map((e) => (
            <li key={e.id} className="arow-item arow-item--block">
              <div className="ainbox__body">
                <p><strong>{e.name}</strong> <span className="ahelp">{[e.role, e.company].filter(Boolean).join(', ')} · {new Date(e.at).toLocaleDateString()}</span></p>
                <blockquote style={{ whiteSpace: 'pre-wrap', margin: '0 0 .6rem' }}>{e.quote}</blockquote>
                <span className="arow-item__actions">
                  <button type="button" className="abtn abtn--primary" onClick={() => void approve(e)}>Approve and add to Testimonials</button>
                  <button type="button" className="abtn" onClick={() => void set(e, 'dismissed')}>Dismiss</button>
                  <button type="button" className="abtn abtn--danger" onClick={() => void remove(e)}><Trash2 size={14} aria-hidden /> Delete</button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      {done.length > 0 && (
        <Card title="Already dealt with">
          <ul className="arows">{done.map((e) => (
            <li key={e.id} className="arow-item"><span className="arow-item__main"><span className="arow-item__text"><strong>{e.name}</strong><span className="ahelp">{e.quote.slice(0, 90)}{e.quote.length > 90 ? '...' : ''}</span></span></span>
              <span className="arow-item__badges"><Badge tone={e.status === 'approved' ? 'good' : 'neutral'}>{e.status === 'approved' ? 'Approved' : 'Dismissed'}</Badge></span>
              <button type="button" className="abtn abtn--danger" aria-label={`Delete the recommendation from ${e.name}`} onClick={() => void remove(e)}><Trash2 size={14} aria-hidden /></button></li>
          ))}</ul>
        </Card>
      )}
    </>
  )
}

export function InboxPage() {
  const [items, setItems] = useState<Enquiry[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [del, setDel] = useState<string | null>(null)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [onlyDue, setOnlyDue] = useState(false)
  const [tab, setTab] = useState<'messages' | 'recommendations'>('messages')
  const [pendingRecs, setPendingRecs] = useState(0)
  useEffect(() => { api.endorsements().then((r) => setPendingRecs(r.pending)).catch(() => {}) }, [])
  const load = useCallback(() => api.enquiries().then((r) => setItems(r.items)).catch((e: Error) => setError(e.message)), [])
  useEffect(() => { void load() }, [load])
  const today = todayLocal()
  const unread = items?.filter((x) => !x.read).length ?? 0
  const dueCount = items?.filter((x) => ['overdue', 'today'].includes(followUpState(x.followUp, x.stage, today))).length ?? 0
  const shown = useMemo(() => (items ?? []).filter((x) => !onlyDue || ['overdue', 'today'].includes(followUpState(x.followUp, x.stage, today))), [items, onlyDue, today])
  const current = items?.find((x) => x.id === open) ?? null
  const replace = (next: Enquiry) => setItems((l) => l?.map((x) => (x.id === next.id ? next : x)) ?? null)
  const move = async (e: Enquiry, stage: Stage) => { try { const r = await api.updateEnquiry(e.id, { stage }); replace(r.item) } catch (x) { setError((x as Error).message) } }
  const openIt = (e: Enquiry) => { setOpen(e.id); if (!e.read) void api.updateEnquiry(e.id, { read: true }).then((r) => replace(r.item)).catch(() => {}) }

  return (
    <>
      <PageHead title="Inbox" intro="Messages sent through your contact form, laid out like a simple pipeline so nothing goes cold: where each one stands, when to chase it, and your own notes. Only you and your team can see any of it." actions={<a className="abtn" href="/api/admin/enquiries.csv" download><Download size={14} aria-hidden /> Export CSV</a>} />
      {error && <p className="abanner" role="alert">{error}</p>}
      <div className="arow" role="group" aria-label="What to look at" style={{ marginBottom: '.8rem' }}>
        <button type="button" aria-pressed={tab === 'messages'} className={`abtn ${tab === 'messages' ? 'abtn--primary' : ''}`} onClick={() => setTab('messages')}>Messages</button>
        <button type="button" aria-pressed={tab === 'recommendations'} className={`abtn ${tab === 'recommendations' ? 'abtn--primary' : ''}`} onClick={() => setTab('recommendations')}>Recommendations{pendingRecs > 0 ? ` (${pendingRecs} waiting)` : ''}</button>
      </div>
      {tab === 'recommendations' ? <Recommendations onCount={setPendingRecs} /> : (<>
      <Card title={items ? `${items.length} message${items.length === 1 ? '' : 's'}, ${unread} unread` : 'Loading'}>
        <div className="atoolbar">
          <div className="arow" role="group" aria-label="How to view messages">
            <button type="button" aria-pressed={view === 'board'} className={`abtn ${view === 'board' ? 'abtn--primary' : ''}`} onClick={() => setView('board')}>Board</button>
            <button type="button" aria-pressed={view === 'list'} className={`abtn ${view === 'list' ? 'abtn--primary' : ''}`} onClick={() => setView('list')}>List</button>
          </div>
          <label className="aswitch__label"><input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} /> Only those to chase now ({dueCount})</label>
        </div>
        {items?.length === 0 && <p className="ahelp">No messages yet. In Contact, set the form to send to your inbox.</p>}
        {view === 'board' ? (
          <div className="apipe">
            {STAGES.map((s) => {
              const col = shown.filter((x) => x.stage === s)
              return (
                <section key={s} className="apipe__col" aria-label={`${STAGE_LABEL[s]}, ${col.length}`}>
                  <h3 className="apipe__head">{STAGE_LABEL[s]} <span className="ahelp">{col.length}</span></h3>
                  <ul className="apipe__list">
                    {col.map((e) => (
                      <li key={e.id} className="apipe__card">
                        <button type="button" className="apipe__open" onClick={() => openIt(e)}>
                          <strong>{e.name}{!e.read && ' •'}</strong>
                          <span className="ahelp">{[e.company, e.type].filter(Boolean).join(' · ') || e.email}</span>
                          <span className="ahelp">{when(e)}</span>
                        </button>
                        <FollowUpBadge e={e} today={today} />
                        <label className="sr-only" htmlFor={`mv-${e.id}`}>Move {e.name} to</label>
                        <select id={`mv-${e.id}`} value={e.stage} onChange={(ev) => void move(e, ev.target.value as Stage)}>{STAGES.map((x) => <option key={x} value={x}>{STAGE_LABEL[x]}</option>)}</select>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        ) : (
          <ul className="arows">
            {shown.map((e) => (
              <li key={e.id} className="arow-item arow-item--block">
                <button type="button" className="arow-item__main" onClick={() => openIt(e)}>
                  <span className="arow-item__text"><strong>{e.name}</strong> <span className="ahelp">{e.email} · {new Date(e.at).toLocaleString()}</span><span className="ahelp">{e.type}{e.company ? ` · ${e.company}` : ''}{e.budget ? ` · ${e.budget}` : ''}</span></span>
                  {!e.read && <Badge tone="info">New</Badge>}
                </button>
                <span className="arow-item__badges"><Badge>{STAGE_LABEL[e.stage]}</Badge><FollowUpBadge e={e} today={today} /></span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      </>)}
      <Modal open={!!current} onClose={() => setOpen(null)} label={current ? `Message from ${current.name}` : 'Message'} className="dialog dialog--narrow adialog">
        {current && <Detail e={current} onChange={(next) => replace(next)} onDelete={() => setDel(current.id)} onClose={() => setOpen(null)} />}
      </Modal>
      <Confirm open={!!del} title="Delete this message?" body="It is removed from the server and cannot be recovered." onCancel={() => setDel(null)} onConfirm={async () => { if (del) { await api.deleteEnquiry(del); setItems((l) => l?.filter((x) => x.id !== del) ?? null); if (open === del) setOpen(null) } setDel(null) }} />
    </>
  )
}
