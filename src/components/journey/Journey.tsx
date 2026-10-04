import { useContent } from '../../hooks/useContent'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'
import { hasValue, safeHref } from '../../utils/text'

const KIND: Record<string, string> = { role: 'Role', project: 'Project', learning: 'Learning', award: 'Award', milestone: 'Milestone' }

export function Journey({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const list = content.journey.filter((x) => !x.hidden && hasValue(x.title))
  return (
    <Section config={config} tone="var(--c-paper)" eyebrow="The path so far" title="Career journey" wave={false} className="journey">
      <ol className="timeline">
        {list.map((j, i) => {
          const href = safeHref(j.link)
          return (
            <li key={j.id}>
              <Reveal delay={i * 0.04} className="timeline__item">
                <span className="timeline__dot" aria-hidden />
                <p className="timeline__meta">{j.period && <span>{j.period}</span>}<span className="chip chip--static">{KIND[j.kind] ?? j.kind}</span></p>
                <h3 className="h5">{j.title}</h3>
                {j.org && <p className="muted">{j.org}</p>}
                {j.description && <p>{j.description}</p>}
                {j.image?.src && <Img image={j.image} className="timeline__img" />}
                {href && <a className="link" href={href} target="_blank" rel="noopener noreferrer">Learn more<span className="sr-only"> about {j.title}</span></a>}
              </Reveal>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
