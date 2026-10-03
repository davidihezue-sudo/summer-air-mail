import type { SectionConfig } from '../../content/types'
import { useContent } from '../../hooks/useContent'
import { getTestimonials } from '../../content/selectors'
import { Section } from '../ui/Section'
import { useTheme } from '../../hooks/useTheme'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'

export function Testimonials({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const items = getTestimonials(content)
  const { copy } = useTheme()
  return (
    <Section config={config} tone="var(--c-paper)" eyebrow="Recommendations" title={copy.testimonialsTitle} className="testimonials">
      <ul className="quotes">
        {items.map((t) => (
          <li key={t.id}>
            <Reveal>
              <figure className="quote">
                <blockquote><p>{t.quote}</p></blockquote>
                <figcaption>
                  {t.photo && <Img image={t.photo} className="quote__photo" />}
                  <span><strong>{t.name}</strong><br />{t.title}, {t.company}<br /><span className="muted">{t.relationship}</span></span>
                </figcaption>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  )
}
