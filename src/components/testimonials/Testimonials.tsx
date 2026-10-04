import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SectionConfig } from '../../content/types'
import { useContent } from '../../hooks/useContent'
import { getTestimonials } from '../../content/selectors'
import { Section } from '../ui/Section'
import { useTheme } from '../../hooks/useTheme'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'
import { VideoPlayer } from '../ui/VideoPlayer'
import { useT } from '../../i18n/useT'
import { hasValue } from '../../utils/text'

export function Testimonials({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const items = getTestimonials(content)
  const { copy } = useTheme()
  const { t } = useT()
  const track = useRef<HTMLUListElement>(null)
  const carousel = config.layout === 'carousel'
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * Math.max(280, track.current.clientWidth * 0.8), behavior: 'smooth' })
  return (
    <Section config={config} tone="var(--c-paper)" eyebrow="Recommendations" title={copy.testimonialsTitle} className="testimonials">
      {carousel && items.length > 1 && (
        <div className="carousel__ctl">
          <button type="button" className="header__icon" onClick={() => scroll(-1)} aria-label={t('carousel.prev')}><ChevronLeft aria-hidden /></button>
          <button type="button" className="header__icon" onClick={() => scroll(1)} aria-label={t('carousel.next')}><ChevronRight aria-hidden /></button>
        </div>
      )}
      <ul ref={track} className={`quotes ${carousel ? 'quotes--carousel' : config.layout === 'list' ? 'quotes--list' : ''}`} tabIndex={carousel ? 0 : undefined} aria-label={carousel ? 'Testimonials, scroll sideways' : undefined}>
        {items.map((q) => (
          <li key={q.id}>
            <Reveal>
              <figure className="quote">
                {hasValue(q.video) && <VideoPlayer src={q.video} poster={q.photo?.src} title={`Video recommendation from ${q.name}`} />}
                <blockquote><p>{q.quote}</p></blockquote>
                <figcaption>
                  {q.photo && <Img image={q.photo} className="quote__photo" />}
                  <span><strong>{q.name}</strong><br />{q.title}, {q.company}<br /><span className="muted">{q.relationship}</span></span>
                </figcaption>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  )
}
