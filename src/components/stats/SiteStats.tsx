import { useEffect, useState } from 'react'
import { useContent } from '../../hooks/useContent'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { AnimatedNumber } from '../ui/AnimatedNumber'

interface Stats { range: number; visitors: number; views: number | null; series: { day: string; views: number }[]; topPages: { path: string; views: number }[]; updated: string }

/** This site's own visit counts, shown only when the owner switches the panel on. Counted on the site's own server, with no cookies. */
export function SiteStats({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const ui = content.portfolio.publicStats
  const locale = content.portfolio.site.locale
  const [data, setData] = useState<Stats | null>(null)
  useEffect(() => {
    let live = true
    fetch('/api/stats').then((r) => (r.ok ? r.json() : null)).then((j) => { if (live) setData(j) }).catch(() => {})
    return () => { live = false }
  }, [])
  if (!data) return null
  const title = (path: string) => {
    if (path === '/') return 'Home page'
    const work = /^\/work\/([^/]+)$/.exec(path)
    if (work) return content.projects.find((p) => p.id === decodeURIComponent(work[1]))?.title ?? path
    const note = /^\/notes\/([^/]+)$/.exec(path)
    if (note) return content.notes.find((n) => n.slug === decodeURIComponent(note[1]))?.title ?? path
    return path
  }
  const max = Math.max(1, ...data.series.map((s) => s.views))
  return (
    <Section config={config} tone="var(--c-sky)" eyebrow="Behind the scenes" title="This site, in numbers" intro={ui.note || `I measure my own site too. These are real counts from the last ${data.range} days, kept on this site's own server with no cookies.`} className="sitestats">
      <div className="sitestats__grid">
        <p className="sitestats__big"><strong><AnimatedNumber value={data.visitors} locale={locale} /></strong><span>visitors</span></p>
        {data.views !== null && <p className="sitestats__big"><strong><AnimatedNumber value={data.views} locale={locale} /></strong><span>page views</span></p>}
        <figure className="sitestats__spark">
          <svg viewBox={`0 0 ${data.series.length * 8} 60`} preserveAspectRatio="none" role="img" aria-label={`Daily page views for the last ${data.range} days`}>
            {data.series.map((s, i) => <rect key={s.day} x={i * 8 + 1} width={6} y={58 - Math.max(2, (s.views / max) * 56)} height={Math.max(2, (s.views / max) * 56)} rx={1} fill="currentColor" opacity={s.views ? 1 : 0.22}><title>{s.day}: {s.views} views</title></rect>)}
          </svg>
        </figure>
        {data.topPages.length > 0 && (
          <div className="sitestats__top">
            <h3 className="h5">Most read</h3>
            <ol>{data.topPages.map((p) => <li key={p.path}><span>{title(p.path)}</span> <strong>{p.views.toLocaleString(locale)}</strong></li>)}</ol>
          </div>
        )}
      </div>
    </Section>
  )
}
