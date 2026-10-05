import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { getResults } from '../../content/selectors'
import type { ResultsUi, SectionConfig } from '../../content/types'
import { resultRows, resultsToCsv, sortRows, type ResultRow, type ResultSort } from '../../content/resultsData'
import { Section } from '../ui/Section'
import { ResultCard } from './ResultCard'
import { CLASS_LABEL } from '../ui/Badge'
import { platformLabel } from '../ui/Icons'

const VIEW_LABEL: Record<ResultsUi['defaultView'], string> = { cards: 'Cards', compare: 'Compare', table: 'Table' }

const fmt = (n: number | null, locale: string, r: Pick<ResultRow, 'prefix' | 'unit'>) => (n === null ? '' : `${r.prefix}${n.toLocaleString(locale, { maximumFractionDigits: 1 })}${r.unit}`)
const pct = (n: number, locale: string) => `${n >= 0 ? '+' : ''}${Number(n.toFixed(1)).toLocaleString(locale)}%`

/** Every result with a start and an end, ranked by how far it moved. Only real, supplied or calculable changes are drawn. */
function Compare({ rows, locale }: { rows: ResultRow[]; locale: string }) {
  const charted = rows.filter((r) => r.change !== null)
  const max = Math.max(1, ...charted.map((r) => Math.abs(r.change as number)))
  return (
    <div className="cmp">
      {charted.length === 0 ? <p className="muted">None of these results has both a start and an end value, so there is nothing to compare yet.</p> : (
        <ul className="cmp__list">
          {charted.map((r) => {
            const c = r.change as number
            return (
              <li key={r.id} className="cmp__row">
                <span className="cmp__label"><strong>{r.metric}</strong><small>{[r.platform ? platformLabel(r.platform) : '', r.campaign, r.period].filter(Boolean).join(' · ')}</small></span>
                <span className="cmp__track" aria-hidden><span className={`cmp__bar${c < 0 ? ' is-down' : ''}`} style={{ width: `${Math.max(2, (Math.abs(c) / max) * 100)}%` }} /></span>
                <span className="cmp__value"><strong>{pct(c, locale)}</strong><small>{r.start !== null && r.end !== null ? `${fmt(r.start, locale, r)} to ${fmt(r.end, locale, r)}` : r.changeKind === 'reported' ? 'as reported' : ''}</small></span>
              </li>
            )
          })}
        </ul>
      )}
      {rows.length > charted.length && <p className="fineprint">{rows.length - charted.length} result{rows.length - charted.length === 1 ? ' has' : 's have'} no percentage, so {rows.length - charted.length === 1 ? 'it is' : 'they are'} not drawn here. They are in the table and the cards.</p>}
      <p className="fineprint">Bars show change from the start value to the end value over each result's own period. They are reported alongside the work, not as proof the work was the only cause.</p>
    </div>
  )
}

function Table({ rows, locale }: { rows: ResultRow[]; locale: string }) {
  return (
    <div className="resulttable">
      <table>
        <caption className="sr-only">Results</caption>
        <thead><tr><th scope="col">Metric</th><th scope="col">Platform</th><th scope="col">Period</th><th scope="col">Start</th><th scope="col">End</th><th scope="col">Change</th><th scope="col">Type</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">{r.metric}{r.campaign && <small>{r.campaign}</small>}</th>
              <td>{r.platform ? platformLabel(r.platform) : ''}</td>
              <td>{r.period}</td>
              <td>{r.masked ? 'Confidential' : fmt(r.start, locale, r)}</td>
              <td>{r.masked ? 'Confidential' : fmt(r.end, locale, r)}</td>
              <td>{r.change === null ? '' : <>{pct(r.change, locale)}{r.changeKind === 'calculated' && <small>calculated</small>}</>}</td>
              <td>{CLASS_LABEL[r.classification]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Results({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const ui = content.portfolio.resultsUi
  const locale = content.portfolio.site.locale
  const results = getResults(content)
  const [platform, setPlatform] = useState('')
  const [cls, setCls] = useState('')
  const [view, setView] = useState<ResultsUi['defaultView']>(ui.defaultView)
  const [sort, setSort] = useState<ResultSort>('change')
  const platforms = useMemo(() => [...new Set(results.map((r) => r.platform).filter((p): p is string => !!p))], [results])
  const classes = useMemo(() => [...new Set(results.map((r) => r.classification))], [results])
  const shown = results.filter((r) => (!platform || r.platform === platform) && (!cls || r.classification === cls))
  const rows = useMemo(() => sortRows(resultRows(shown, content.projects), sort), [shown, content.projects, sort])
  const current = ui.showSwitcher ? view : ui.defaultView

  const download = () => {
    const blob = new Blob([resultsToCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'results.csv'; a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <Section
      config={config} tone="var(--c-paper)" eyebrow="Analytics and results" title="What the work moved"
      intro="Each figure shows where it started, where it ended, how long it took and who produced it. Percentages are only shown when they are supplied or can be calculated from real start and end values."
      className="results"
    >
      {(platforms.length > 1 || classes.length > 1) && (
        <div className="filters" role="group" aria-label="Filter results">
          {platforms.length > 1 && (
            <>
              <button type="button" className="chip" aria-pressed={!platform} onClick={() => setPlatform('')}>All platforms</button>
              {platforms.map((p) => <button key={p} type="button" className="chip" aria-pressed={platform === p} onClick={() => setPlatform(platform === p ? '' : p)}>{platformLabel(p)}</button>)}
            </>
          )}
          {classes.length > 1 && classes.map((c) => <button key={c} type="button" className="chip chip--outline" aria-pressed={cls === c} onClick={() => setCls(cls === c ? '' : c)}>{CLASS_LABEL[c]}</button>)}
        </div>
      )}
      {(ui.showSwitcher || ui.allowDownload) && rows.length > 0 && (
        <div className="resulttools">
          {ui.showSwitcher && (
            <div className="resulttools__views" role="group" aria-label="How to view the results">
              {(Object.keys(VIEW_LABEL) as ResultsUi['defaultView'][]).map((v) => <button key={v} type="button" className="chip" aria-pressed={current === v} onClick={() => setView(v)}>{VIEW_LABEL[v]}</button>)}
            </div>
          )}
          {current !== 'cards' && (
            <label className="resulttools__sort">Sort by{' '}
              <select value={sort} onChange={(e) => setSort(e.target.value as ResultSort)}>
                <option value="change">Biggest change</option><option value="metric">Metric name</option><option value="platform">Platform</option>
              </select>
            </label>
          )}
          {ui.allowDownload && <button type="button" className="btn btn--ghost resulttools__dl" onClick={download}><Download size={16} aria-hidden /> Download the data (CSV)</button>}
        </div>
      )}
      {current === 'compare' ? <Compare rows={rows} locale={locale} />
        : current === 'table' ? <Table rows={rows} locale={locale} />
        : <div className="results__grid">{shown.map((r) => <ResultCard key={r.id} result={r} />)}</div>}
    </Section>
  )
}
