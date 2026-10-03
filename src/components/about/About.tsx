import { Download } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { PortraitPlaceholder, Surfboard } from '../ui/art'
import { hasValue, visibleStats } from '../../utils/text'

export function About() {
  const { content } = useContent()
  const { portfolio } = content
  const { profile, site } = portfolio
  const stats = visibleStats(portfolio)

  return (
    <Section id="about" tone="var(--c-sand)" eyebrow="About" title={`Meet ${profile.preferredName}`} className="about">
      <div className="about__grid">
        <Reveal className="about__photo-col">
          <div className="rattan">
            <div className="rattan__inner">
              {profile.profilePhoto ? <Img image={profile.profilePhoto} className="rattan__img" /> : (
                <div className="rattan__ph"><PortraitPlaceholder /></div>
              )}
            </div>
          </div>
          <span className="sticker script" aria-hidden>hello!</span>
          <Surfboard />
        </Reveal>

        <div className="about__copy">
          <Reveal>
            {profile.bio.map((p, i) => (
              <p key={i} className={`prose ${hasValue(p) ? '' : 'is-placeholder'}`}>{p}</p>
            ))}
          </Reveal>
          {profile.highlights.length > 0 && (
            <Reveal>
              <ul className="ticks">
                {profile.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </Reveal>
          )}
          {stats.length > 0 && (
            <Reveal>
              <dl className="stats">
                {stats.map((s) => (
                  <div key={s.key} className="stat">
                    <dd className="stat__num"><AnimatedNumber value={s.value as number} locale={site.locale} prefix={s.prefix} suffix={s.suffix} /></dd>
                    <dt className="stat__label">{s.label}</dt>
                    {s.note && hasValue(s.note) && <p className="stat__note">{s.note}</p>}
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
          <Reveal className="about__actions">
            {hasValue(profile.cvFile) && (
              <a className="btn btn--solid" href={profile.cvFile} download>
                <Download size={18} aria-hidden /> Download CV
              </a>
            )}
            {hasValue(profile.availability) && <p className="availability"><span className="dot" aria-hidden />{profile.availability}{hasValue(profile.employmentType) ? `. ${profile.employmentType}.` : ''}</p>}
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
