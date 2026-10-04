import { Download } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'
import { hasValue } from '../../utils/text'

export function Resources({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const list = content.resources.filter((x) => !x.hidden && hasValue(x.title) && hasValue(x.file))
  return (
    <Section config={config} tone="var(--c-sand)" eyebrow="Free to download" title="Resources" className="resources">
      <ul className="filegrid">
        {list.map((r, i) => (
          <li key={r.id}>
            <Reveal delay={i * 0.04} className="filecard">
              {r.image?.src && <Img image={r.image} className="filecard__img" />}
              <h3 className="h5">{r.title}</h3>
              {r.description && <p>{r.description}</p>}
              <a className="btn btn--solid" href={r.file} download>
                <Download size={16} aria-hidden /> Download{r.format ? ` ${r.format}` : ''}<span className="sr-only">: {r.title}</span>
              </a>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  )
}
