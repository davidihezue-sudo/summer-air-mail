import { useEffect, useState } from 'react'
import { api, type InsightsSummary } from '../api'
import { useAdmin } from '../store'
import { Card, PageHead } from '../ui'
import { Fields } from '../fields'
import { INSIGHT_FIELDS, STATS_FIELDS } from '../schemaExtra'

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
      <PageHead title="Visit Insights" intro="Counts your own server keeps: no cookies, no profile of anyone, totals per day only. Visits by outsiders are counted on their own. Your visits, and visits from your home network, are counted apart so checking the site never inflates the numbers." />
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
            <p className="ahelp">A visit counts as yours when the browser is signed in to this admin, when it is a device you have used for the admin, or when it comes from the network you signed in from ({data.homeNetworks === 0 ? 'none recognised yet: sign in once from home' : `${data.homeNetworks} recognised, kept for 90 days after you last signed in from it`}). Only a scrambled fingerprint of the network is kept, never the address.</p>
            {data.homeNetworks > 0 && <div className="arow"><button type="button" className="abtn abtn--danger" onClick={forget}>Forget my home network</button></div>}
            {msg && <p role="status" className="ahelp">{msg}</p>}
          </>
        )}
      </Card>
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
