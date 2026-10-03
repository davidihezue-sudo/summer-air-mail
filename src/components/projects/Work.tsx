import { useMemo, useState } from 'react'
import { useContent } from '../../hooks/useContent'
import { getCategories, getProjects } from '../../content/selectors'
import { Section } from '../ui/Section'
import { Img } from '../ui/Img'
import { PlatformIcons } from './PlatformChips'
import { useViewer } from './Viewer'

export function Work() {
  const { content } = useContent()
  const projects = getProjects(content)
  const categories = useMemo(() => getCategories(content), [content])
  const [filter, setFilter] = useState('All Work')
  const { openProject } = useViewer()
  const shown = filter === 'All Work' ? projects : projects.filter((p) => p.category === filter)

  return (
    <Section id="work" tone="var(--c-sky)" eyebrow="Recent work" title="Pinned up to dry" intro="A selection of projects, hung out like holiday prints. Select one to open it." className="work">
      {categories.length > 1 && (
        <div className="filters" role="group" aria-label="Filter projects by category">
          {['All Work', ...categories].map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
      )}
      <ul className="polaroids">
        {shown.map((p, i) => (
          <li key={p.id} className="polaroid-wrap" style={{ ['--i' as string]: i }}>
            <button type="button" className="polaroid" onClick={() => openProject(p.id)} aria-label={`Open project: ${p.title}, ${p.client}`}>
              <span className="polaroid__pin" aria-hidden />
              <span className="polaroid__photo"><Img image={p.thumbnail} sizes="(min-width: 900px) 25vw, 70vw" /></span>
              <span className="polaroid__meta">
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
