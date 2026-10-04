import { useContent } from '../../hooks/useContent'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'
import { hasValue } from '../../utils/text'

export function Notes({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const list = content.notes.filter((x) => !x.hidden && hasValue(x.title) && hasValue(x.slug)).sort((a, b) => b.date.localeCompare(a.date))
  return (
    <Section config={config} tone="var(--c-paper)" eyebrow="Thinking out loud" title="Notes" className="notes">
      <ul className="notegrid">
        {list.map((n, i) => (
          <li key={n.id}>
            <Reveal delay={i * 0.04} className="notecard">
              {n.cover?.src && <Img image={n.cover} className="notecard__img" />}
              <p className="muted">{n.date}</p>
              <h3 className="h5"><a href={`/notes/${n.slug}`}>{n.title}</a></h3>
              {n.summary && <p>{n.summary}</p>}
            </Reveal>
          </li>
        ))}
      </ul>
      <p><a className="link" href="/feed.xml">RSS feed</a></p>
    </Section>
  )
}
