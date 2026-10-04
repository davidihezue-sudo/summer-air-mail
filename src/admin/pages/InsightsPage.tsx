import { useEffect, useState } from 'react'
import { api, type InsightsSummary } from '../api'
import { useAdmin } from '../store'
import { Card, PageHead } from '../ui'

const top = (o: Record<string, number>, n = 8) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n)

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
  const [data, setData] = useState<InsightsSummary | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.insights(range).then(setData).catch((e: Error) => setError(e.message)) }, [range])
  const on = content.portfolio.insights.enabled
  const max = Math.max(1, ...(data?.series.map((s) => s.views) ?? [1]))
  return (
    <>
      <PageHead title="Visit Insights" intro="Counts your own server keeps: no cookies, no IP addresses stored, no profile of anyone. Totals per day only. Your own visits while signed in are ignored." />
      {!on && <p className="abanner">Insights are switched off. Turn them on under Quality Rules &amp; Insights, then publish.</p>}
      {error && <p className="abanner" role="alert">{error}</p>}
      <Card title="Overview" actions={<select aria-label="Time range" value={range} onChange={(e) => setRange(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last year</option></select>}>
        {data && (
          <>
            <p className="astat"><strong>{data.visitors}</strong> visitors <span className="ahelp">(counted once per day each)</span> · <strong>{data.views}</strong> page views</p>
            <svg viewBox={`0 0 ${data.series.length * 8} 60`} className="aspark" role="img" aria-label={`Daily page views for the last ${range} days`} preserveAspectRatio="none">
              {data.series.map((s, i) => <rect key={s.day} x={i * 8 + 1} width={6} y={58 - (s.views / max) * 56} height={(s.views / max) * 56 + 0.5} fill="currentColor"><title>{s.day}: {s.views} views</title></rect>)}
            </svg>
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
    </>
  )
}
