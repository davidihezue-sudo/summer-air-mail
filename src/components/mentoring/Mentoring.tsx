import type { SectionConfig } from '../../content/types'
import { Heart, MessageCircle } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { Section } from '../ui/Section'
import { Img } from '../ui/Img'
import { hasValue, whatsappUrl } from '../../utils/text'

export function Mentoring({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const { mentoring, profile } = content.portfolio
  const wa = whatsappUrl(profile.whatsapp, `Hello, I would like to ask about your training: ${mentoring.heading}`)
  return (
    <Section config={config} tone="var(--c-peach)" eyebrow="Mentoring and training" title={mentoring.heading} className="mentoring">
      <div className="mentoring__grid">
        <div className="live" aria-hidden={!mentoring.showLiveBadge}>
          {mentoring.instructorPhoto ? <Img image={mentoring.instructorPhoto} /> : <div className="live__ph" />}
          {mentoring.showLiveBadge && <span className="live__badge">Live</span>}
          <span className="bubble bubble--a"><MessageCircle size={14} aria-hidden /> Ask me anything</span>
          <span className="bubble bubble--b">Great tip</span>
          <Heart className="heart heart--a" aria-hidden fill="currentColor" />
          <Heart className="heart heart--b" aria-hidden fill="currentColor" />
        </div>
        <div>
          <p className="prose">{mentoring.overview}</p>
          {mentoring.topics.length > 0 && (<><h3 className="h4">Topics</h3><ul className="chips">{mentoring.topics.map((t) => <li key={t}>{t}</li>)}</ul></>)}
          {mentoring.outcomes.length > 0 && (<><h3 className="h4">Learning outcomes</h3><ul className="ticks">{mentoring.outcomes.map((t) => <li key={t}>{t}</li>)}</ul></>)}
          {hasValue(mentoring.format) && <p><strong>Format:</strong> {mentoring.format}</p>}
          {wa && <a className="btn btn--solid" href={wa} target="_blank" rel="noopener noreferrer">Ask on WhatsApp<span className="sr-only"> (opens in a new tab)</span></a>}
        </div>
      </div>
    </Section>
  )
}
