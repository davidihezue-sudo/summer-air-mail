import type { ReactNode } from 'react'
import type { SectionConfig } from '../../content/types'
import { useTheme } from '../../hooks/useTheme'
import { goTo } from '../../utils/nav'
import { hasValue, safeHref } from '../../utils/text'
import { toneValue } from '../../utils/theme'
import { Reveal } from './Reveal'
import { Img } from './Img'
import type { DividerShape } from '../../themes/types'

const PATHS: Record<DividerShape, string> = (() => {
  const rnd = (i: number) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
  let deckle = 'M0 80V52'
  for (let x = 0; x <= 1440; x += 24) deckle += `L${x} ${40 + Math.round(rnd(x) * 26)}`
  deckle += 'V80z'
  let ridge = 'M0 80V58'
  const peaks = [0, 120, 210, 330, 440, 560, 650, 790, 900, 1010, 1130, 1250, 1350, 1440]
  peaks.forEach((x, i) => { ridge += `L${x} ${i % 2 ? 18 + Math.round(rnd(i) * 14) : 52 + Math.round(rnd(i + 7) * 12)}` })
  ridge += 'V80z'
  let hills = 'M0 80V60'
  for (let i = 0; i < 8; i++) hills += 'a90 46 0 0 1 180 0'
  hills += 'V80z'
  return {
    waves: 'M0 80V40C120 10 240 10 360 36s240 40 360 14S960 0 1080 12s240 36 360 14V80z',
    hills, deckle, ridge,
  }
})()

export function Divider({ shape }: { shape: DividerShape }) {
  return (
    <svg className="wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden focusable="false">
      <path d={PATHS[shape]} fill="currentColor" />
    </svg>
  )
}

interface SectionProps {
  config: SectionConfig
  /** Default background (CSS colour or var). The admin can override it per section. */
  tone: string
  eyebrow?: string
  title?: string
  intro?: string
  children: ReactNode
  wave?: boolean
  dark?: boolean
  className?: string
}

export function Section({ config, tone, eyebrow, title, intro, children, wave = true, dark, className = '' }: SectionProps) {
  const { resolved } = useTheme()
  const bg = toneValue(config.tone) || tone
  const heading = hasValue(config.heading) ? config.heading : title
  const kicker = hasValue(config.eyebrow) ? config.eyebrow : eyebrow
  const lede = hasValue(config.intro) ? config.intro : intro
  const href = config.cta ? safeHref(config.cta.href) || (config.cta.href.startsWith('#') ? config.cta.href : '') : ''
  const id = config.id

  return (
    <section
      id={id} className={`section ${dark ? 'section--dark' : ''} ${className}`} style={{ background: bg }} aria-labelledby={heading ? `${id}-title` : undefined}
      data-spacing={config.spacing || undefined} data-pattern={config.pattern || undefined} data-width={config.width || undefined}
    >
      {wave && config.divider !== 'none' && (
        <div className="section__wave" style={{ color: bg }}>
          <Divider shape={config.divider || resolved.theme.divider} />
        </div>
      )}
      <div className="container">
        {(kicker || heading) && (
          <Reveal className="section__head">
            {kicker && <p className="eyebrow">{kicker}</p>}
            {heading && <h2 id={`${id}-title`} className="h2">{heading}</h2>}
            {lede && <p className="lede">{lede}</p>}
            {config.image?.src && <Img image={config.image} className="section__image" />}
            {config.cta && hasValue(config.cta.label) && href && (
              <a
                className="btn btn--solid"
                href={href}
                {...(href.startsWith('#') ? { onClick: (e: React.MouseEvent) => { e.preventDefault(); goTo(href.slice(1)) } } : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {config.cta.label}
              </a>
            )}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  )
}
