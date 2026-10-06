import { useEffect, useState } from 'react'
import { api, type InsightsSummary } from '../api'
import { useAdmin } from '../store'
import { Badge, Card, PageHead } from '../ui'
import { Fields } from '../fields'
import { INSIGHT_FIELDS, STATS_FIELDS } from '../schemaExtra'
import { QrCode } from '../../components/ui/QrCode'

const top = (o: Record<string, number>, n = 8) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n)

function Spark({ series, label, tone }: { series: { day: string; views: number }[]; label: string; tone?: 'own' }) {
  const max = Math.max(1, ...series.map((s) => s.views))
  return (
    <svg viewBox={`0 0 ${series.length * 8} 60`} className={`aspark${tone === 'own' ? ' aspark--own' : ''}`} role="img" aria-label={label} preserveAspectRatio="none">
      {series.map((s, i) => <rect key={s.day} x={i * 8 + 1} width={6} y={58 - (s.views / max) * 56} height={(s.views / max) * 56 + 0.5} fill="currentColor"><title>{s.day}: {s.views} views</title></rect>)}
    </svg>
  )
}

function Bars({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(1, ...data.map((d) => d[1]))
  return (
    <Card title={title}>
      {data.length === 0 ? <p className="ahelp">Nothing yet.</p> : (
        <ul className="abars">{data.map(([k, v]) => <li key={k}><span className="abars__k">{k}</span><span className="abars__bar" style={{ width: `${(v / max) * 100}%` }} /><span className="abars__v">{v}</span></li>)}</ul>
      )}
    </Card>
  )
}

const ACTIONS: Record<string, [string, string]> = { project: ['project opened', 'projects opened'], cta: ['button click', 'button clicks'], download: ['download', 'downloads'], contact: ['message sent', 'messages sent'], note: ['note read', 'notes read'], share: ['share', 'shares'] }
const actionsText = (events: Record<string, number>) => Object.entries(events).filter(([, n]) => n > 0).sort((p, q) => q[1] - p[1]).map(([k, n]) => `${n} ${ACTIONS[k]?.[n === 1 ? 0 : 1] ?? k}`).join(', ')

/**
 * One row for each audience view and application link: what outside visitors did, and, kept apart and quieter, what you and the
 * household did. A visit that starts in a view is followed through the site, so a project opened or a message sent is credited to it.
 */
function ApplicationLinks({ data }: { data: InsightsSummary }) {
  const { content } = useAdmin()
  const views = content.audiences.map((v) => ({ key: v.id, title: v.name || v.slug, slug: v.slug, off: v.enabled === false, kind: 'view' as const }))
  const apps = content.applications.map((a) => ({ key: a.id, title: a.company || a.label || a.slug, slug: a.slug, off: a.enabled === false, kind: 'link' as const }))
  if (!views.length && !apps.length) return null
  const rows = [...views, ...apps].filter((x) => x.slug).map((x) => ({
    x, opened: data.paths[`/for/${x.slug}`] ?? 0, last: data.pathLast?.[`/for/${x.slug}`] ?? '',
    out: data.via?.[x.slug], home: data.own.via?.[x.slug], homeOpened: data.own.paths[`/for/${x.slug}`] ?? 0,
  })).sort((p, q) => q.opened - p.opened || p.x.slug.localeCompare(q.x.slug))
  return (
    <Card title="Audience views and application links">
      <ul className="arows">
        {rows.map(({ x, opened, last, out, home, homeOpened }) => {
          const did = out ? actionsText(out.events) : ''
          const homeViews = Math.max(homeOpened, home?.views ?? 0)
          const homeDid = home ? actionsText(home.events) : ''
          return (
            <li key={x.key} className="arow-item arow-item--stack">
              <span className="arow-item__main"><span className="arow-item__text"><strong>{x.title}</strong><span className="ahelp">{x.kind === 'view' ? 'Audience view' : 'Application link'} · /for/{x.slug}{x.off ? ' · switched off' : ''}</span></span></span>
              <span className="arow-item__badges">{opened > 0 ? <Badge tone="good">Outside visitors opened it {opened} time{opened === 1 ? '' : 's'}{last ? `, last on ${last}` : ''}</Badge> : <Badge>Not opened by outside visitors yet</Badge>}</span>
              {out && out.views > 0 && <span className="ahelp">During those visits: {out.visitors} {out.visitors === 1 ? 'person' : 'people'}, {out.views} page view{out.views === 1 ? '' : 's'}{did ? `, ${did}` : ''}.</span>}
              {(homeViews > 0 || homeDid) && <span className="ahelp ahome">You and home, counted separately: {homeViews} page view{homeViews === 1 ? '' : 's'}{homeDid ? `, ${homeDid}` : ''}.</span>}
            </li>
          )
        })}
      </ul>
      <p className="ahelp">Outside visitors and your household are never added together. A visit that starts in a view is followed through the site, so a project opened or a message sent is credited to the view it came from, until that tab is closed. Counted without cookies for visitors; a person opening the same link several times counts each time.</p>
    </Card>
  )
}

/** The ways a visit counts as yours, and a one-time link to add another device, such as a phone on mobile data. */
function Household({ data, onChange }: { data: InsightsSummary; onChange: () => void }) {
  const [link, setLink] = useState<{ url: string; expires: string } | null>(null)
  const [note, setNote] = useState('')
  const make = async () => {
    setNote('')
    try { const r = await api.ownLink(); setLink({ url: `${location.origin}${r.path}`, expires: new Date(r.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }) } catch (e) { setNote((e as Error).message) }
  }
  const forget = async () => {
    if (!window.confirm('Forget every device you added with a link? They will count as outside visitors again until you add them again. This browser stays yours while you are signed in.')) return
    try { await api.forgetDevices(); setLink(null); setNote('Added devices forgotten.'); onChange() } catch (e) { setNote((e as Error).message) }
  }
  return (
    <div className="ahousehold">
      <h3 className="ahousehold__title">What counts as you and home</h3>
      <ul className="ahousehold__list">
        <li><strong>Any browser signed in to this admin</strong>, on any network. This browser is already counted.</li>
        <li><strong>Your home network</strong>: {data.homeNetworks === 0 ? 'none recognised yet. Sign in once from home.' : `${data.homeNetworks} recognised, kept for 90 days after you last signed in from it.`} Anyone on that Wi-Fi counts, including your wife's phone while it is on the home Wi-Fi.</li>
        <li><strong>Devices you add with a link</strong>: {data.devices.added === 0 ? 'none yet.' : `${data.devices.added} added, the latest on ${data.devices.last}.`} A phone added this way counts as yours on mobile data and anywhere else.</li>
      </ul>
      <div className="arow">
        <button type="button" className="abtn abtn--primary" onClick={() => void make()}>Add another device (your wife's phone, for example)</button>
        {data.devices.added > 0 && <button type="button" className="abtn abtn--danger" onClick={() => void forget()}>Forget added devices</button>}
      </div>
      {link && (
        <div className="ahousehold__link" role="status">
          <QrCode value={link.url} size={160} label="Scan to add this device" />
          <div>
            <p className="ahelp">Open this on the device you want to add, once, before {link.expires} (15 minutes). Scan the code with its camera, or send yourself the link. It works one time only.</p>
            <input readOnly aria-label="One-time link" value={link.url} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="abtn" onClick={() => { void navigator.clipboard?.writeText(link.url); setNote('Link copied.') }}>Copy link</button>
          </div>
        </div>
      )}
      {note && <p role="status" className="ahelp">{note}</p>}
      <p className="ahelp">The device keeps a small private marker from your own site (a cookie that only you can create from here). Visitors never receive it.</p>
    </div>
  )
}

export function InsightsPage() {
  const { content } = useAdmin()
  const [range, setRange] = useState(30)
  const [msg, setMsg] = useState('')
  const [data, setData] = useState<InsightsSummary | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.insights(range).then(setData).catch((e: Error) => setError(e.message)) }, [range])
  const on = content.portfolio.insights.enabled
  const countOn = content.portfolio.insights.countOwn !== false
  const forget = async () => {
    if (!window.confirm('Forget the home network? Visits from it will count as outside visitors again until you sign in from it.')) return
    try { await api.forgetHome(); setMsg('Home network forgotten.'); setData(await api.insights(range)) } catch (e) { setMsg((e as Error).message) }
  }
  return (
    <>
      <PageHead title="Visit Insights" intro="Counts your own server keeps: no cookies for visitors, no profile of anyone, totals per day only. Visits by outsiders are counted on their own. Your visits, and visits from your home network, are counted apart so checking the site never inflates the numbers." />
      {!on && <p className="abanner">Counting visits is switched off. Turn it on in Settings at the bottom of this page, then publish.</p>}
      {error && <p className="abanner" role="alert">{error}</p>}
      <Card title="Outside visitors" actions={<select aria-label="Time range" value={range} onChange={(e) => setRange(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last year</option></select>}>
        {data && (
          <>
            <p className="astat"><strong>{data.visitors}</strong> visitors <span className="ahelp">(counted once per day each)</span> · <strong>{data.views}</strong> page views</p>
            <Spark series={data.series} label={`Daily page views from outside visitors for the last ${range} days`} />
          </>
        )}
      </Card>
      <Card title="You and home">
        {!countOn ? (
          <p className="ahelp">Your own visits are being ignored completely. To see them here, turn on &quot;Count my own visits separately&quot; in Settings at the bottom of this page, then publish.</p>
        ) : data && (
          <>
            <p className="astat"><strong>{data.own.views}</strong> page views from you and home <span className="ahelp">· on <strong>{data.own.daysSeen}</strong> of the last {range} days · {data.own.visitors} device{data.own.visitors === 1 ? '' : 's'} counted per day</span></p>
            <Spark series={data.own.series} label={`Daily page views from you and home for the last ${range} days`} tone="own" />
            <Household data={data} onChange={() => void api.insights(range).then(setData)} />
            {data.homeNetworks > 0 && <div className="arow"><button type="button" className="abtn abtn--danger" onClick={forget}>Forget my home network</button></div>}
            {msg && <p role="status" className="ahelp">{msg}</p>}
          </>
        )}
      </Card>
 {data && <ApplicationLinks data={data} />}
      {data && (
        <>
          <Bars title="Pages" data={top(data.paths)} />
          <Bars title="Where visitors came from" data={top(data.refs)} />
          <Bars title="What they did" data={top(data.events)} />
          {Object.entries(data.items).map(([k, v]) => <Bars key={k} title={{ project: 'Projects opened', note: 'Notes read', download: 'Downloads', share: 'Shares and short links', cta: 'Button clicks', contact: 'Messages sent' }[k] ?? k} data={top(v)} />)}
        </>
      )}
      <Card title="Settings">
        <div className="aform"><Fields base="portfolio.insights" fields={INSIGHT_FIELDS} /></div>
        <p className="ahelp">Changes here go live when you publish.</p>
      </Card>
      <Card title="Show some of this publicly (optional)">
        <div className="aform"><Fields base="portfolio.publicStats" fields={STATS_FIELDS} /></div>
        <p className="ahelp">Adds a section called &quot;This site, in numbers&quot; with real visit counts. Turn it on, then switch the section on in Sections &amp; Visibility. It never shows your own visits, application links or the admin.</p>
      </Card>
    </>
  )
}
