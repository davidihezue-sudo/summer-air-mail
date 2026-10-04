import { hasValue } from '../../utils/text'
import { toneValue } from '../../utils/theme'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useTheme } from '../../hooks/useTheme'
import { buildFacets, filterProjects, getProjects, type FacetKey } from '../../content/selectors'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { Img } from '../ui/Img'
import { PlatformIcons } from './PlatformChips'
import { platformLabel } from '../ui/Icons'
import { useViewer } from './Viewer'

export function Work({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const { copy } = useTheme()
  const projects = useMemo(() => getProjects(content).filter((p) => !config.filterCategory || p.category === config.filterCategory), [content, config.filterCategory])
  const facets = useMemo(() => buildFacets(projects, content), [projects, content])
  const [active, setActive] = useState<Partial<Record<FacetKey, string>>>({})
  const [query, setQuery] = useState('')
  const [openFacet, setOpenFacet] = useState<FacetKey | null>(null)
  const { openProject } = useViewer()
  const shown = filterProjects(projects, active, query, content)
  const anyFilter = Object.values(active).some(Boolean) || !!query
  const toggle = (k: FacetKey, v: string) => setActive((a) => ({ ...a, [k]: a[k] === v ? '' : v }))

  return (
    <Section config={config} tone="var(--c-sky)" eyebrow="Recent work" title={copy.workTitle} intro="A selection of projects. Select one to see the work, the thinking and the results." className="work">
      {(facets.length > 0 || projects.length > 6) && (
        <div className="filterbar">
          <label className="search">
            <Search size={18} aria-hidden />
            <span className="sr-only">Search projects</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects, platforms, services" />
          </label>
          {facets.map((f) => (
            <div key={f.key} className="facet">
              <button type="button" className="chip" aria-expanded={openFacet === f.key} onClick={() => setOpenFacet(openFacet === f.key ? null : f.key)}>
                {f.label}{active[f.key] ? `: ${f.key === 'platform' ? platformLabel(active[f.key]!) : active[f.key]}` : ''}
              </button>
              {openFacet === f.key && (
                <div className="facet__menu" role="group" aria-label={f.label}>
                  {f.values.map((v) => (
                    <button key={v} type="button" className="chip" aria-pressed={active[f.key] === v} onClick={() => { toggle(f.key, v); setOpenFacet(null) }}>
                      {f.key === 'platform' ? platformLabel(v) : v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {anyFilter && <button type="button" className="textlink" onClick={() => { setActive({}); setQuery('') }}>Clear filters</button>}
        </div>
      )}
      <p className="sr-only" aria-live="polite">{shown.length} projects shown</p>
      {shown.length === 0 && <p className="prose">No projects match those filters.</p>}
      <ul className="polaroids">
        {shown.map((p, i) => (
          <li key={p.id} className="polaroid-wrap" style={{ ['--i' as string]: i, ...(toneValue(p.accent) ? { ['--accent' as string]: toneValue(p.accent) } : {}) }}>
            <button type="button" className="polaroid" onClick={() => openProject(p.id)} aria-label={`Open project: ${p.title}, ${p.client}`}>
              <span className="polaroid__pin" aria-hidden />
              <span className="polaroid__photo">{p.thumbnail?.src ? <Img image={p.thumbnail} sizes="(min-width: 900px) 25vw, 70vw" /> : <span className="polaroid__blank" />}</span>
              <span className="polaroid__meta">
                {(hasValue(p.badge) || p.featured) && <span className="polaroid__flag">{hasValue(p.badge) ? p.badge : 'Featured'}</span>}
                <span className="polaroid__brand">{p.client}</span>
                <span className="polaroid__title">{p.title}</span>
                <span className="polaroid__cat">{p.category} · {p.year}</span>
                <span className="polaroid__desc">{p.description}</span>
                <PlatformIcons platforms={p.platforms} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Section>
  )
}
