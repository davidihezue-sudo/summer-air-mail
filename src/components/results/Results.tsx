import { useMemo, useState } from 'react'
import { useContent } from '../../hooks/useContent'
import { getResults } from '../../content/selectors'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { ResultCard } from './ResultCard'
import { CLASS_LABEL } from '../ui/Badge'
import { platformLabel } from '../ui/Icons'

export function Results({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const results = getResults(content)
  const [platform, setPlatform] = useState('')
  const [cls, setCls] = useState('')
  const platforms = useMemo(() => [...new Set(results.map((r) => r.platform).filter((p): p is string => !!p))], [results])
  const classes = useMemo(() => [...new Set(results.map((r) => r.classification))], [results])
  const shown = results.filter((r) => (!platform || r.platform === platform) && (!cls || r.classification === cls))

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
      <div className="results__grid">{shown.map((r) => <ResultCard key={r.id} result={r} />)}</div>
    </Section>
  )
}
