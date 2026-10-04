import type { ResultEntry } from '../../content/types'
import { useContent } from '../../hooks/useContent'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { ClassBadge } from '../ui/Badge'
import { LineChart } from '../charts/Charts'
import { MetricBar } from '../case-studies/MetricBar'
import { hasValue } from '../../utils/text'
import { platformLabel } from '../ui/Icons'
import { useViewer } from '../projects/Viewer'
import { toneValue } from '../../utils/theme'

const CONTRIBUTION = { individual: 'Individual contribution', team: 'Team result', shared: 'Shared with the team' } as const

/** Percentage change: the supplied value, or calculated only when both start and end exist. */
export function pctOf(r: ResultEntry): { value: number; calculated: boolean } | null {
  if (typeof r.pctChange === 'number') return { value: r.pctChange, calculated: false }
  if (typeof r.start === 'number' && typeof r.end === 'number' && r.start > 0) return { value: ((r.end - r.start) / r.start) * 100, calculated: true }
  return null
}

export function ResultCard({ result: r }: { result: ResultEntry }) {
  const { content } = useContent()
  const locale = content.portfolio.site.locale
  const { openImages } = useViewer()
  const hidden = r.classification === 'confidential' && r.showValues === false
  const pct = hidden ? null : pctOf(r)
  const series = r.series?.length ? r.series : typeof r.start === 'number' && typeof r.end === 'number' ? [{ label: 'Start', value: r.start }, { label: 'End', value: r.end }] : []
  const project = r.projectId ? content.projects.find((p) => p.id === r.projectId) : undefined

  return (
    <article className="result" style={toneValue(r.accent) ? ({ ['--accent' as string]: toneValue(r.accent) } as React.CSSProperties) : undefined}>
      <header className="result__head">
        <ClassBadge value={r.classification} />
        {r.contribution && <span className="result__who">{CONTRIBUTION[r.contribution]}</span>}
      </header>
      <h3 className="result__metric">{r.metric}</h3>
      <p className="result__meta">
        {[r.platform ? platformLabel(r.platform) : '', r.campaign, project?.title].filter(hasValue).join(' · ')}
        {(r.platform || r.campaign || project) && ' · '}Measured over {r.period || 'an unstated period'}
      </p>

      {hidden ? (
        <p className="prose">{r.anonymised || 'Details are confidential.'}</p>
      ) : (
        <>
          {r.chart === 'bar' && typeof r.end === 'number' && (
            <MetricBar locale={locale} metric={{ label: r.metric, baseline: typeof r.start === 'number' ? r.start : undefined, result: r.end, prefix: r.prefix, unit: r.unit, period: r.period, note: undefined }} bare />
          )}
          {r.chart === 'line' && series.length > 1 && <LineChart points={series} prefix={r.prefix} unit={r.unit} locale={locale} title={r.metric} />}
          {(r.chart === 'stat' || (r.chart === 'bar' && typeof r.end !== 'number')) && typeof r.end === 'number' && (
            <p className="result__big"><AnimatedNumber value={r.end} locale={locale} prefix={r.prefix} suffix={r.unit} /></p>
          )}
          {pct && (
            <p className="result__pct">
              <strong>{pct.value >= 0 ? '+' : ''}{Number(pct.value.toFixed(1)).toLocaleString(locale)}%</strong>{' '}
              <span className="muted">{pct.calculated ? 'calculated from the start and end values' : 'as reported'}</span>
            </p>
          )}
        </>
      )}
      {hasValue(r.context) && <p className="prose">{r.context}</p>}
      {hasValue(r.notes) && <p className="fineprint">{r.notes}</p>}
      {r.screenshot?.src && (
        <button type="button" className="result__shot" onClick={() => openImages([{ ...r.screenshot!, caption: r.metric }], 0)} aria-label={`View screenshot for ${r.metric}`}>
          <img src={r.screenshot.src} alt={r.screenshot.alt || `Screenshot: ${r.metric}`} loading="lazy" decoding="async" />
        </button>
      )}
    </article>
  )
}
