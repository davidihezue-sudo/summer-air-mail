import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

interface SectionProps {
  id: string
  tone: string
  eyebrow?: string
  title?: string
  intro?: string
  children: ReactNode
  wave?: boolean
  dark?: boolean
  className?: string
}

export function Wave({ flip }: { flip?: boolean }) {
  return (
    <svg className={`wave ${flip ? 'wave--flip' : ''}`} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden focusable="false">
      <path d="M0 80V40C120 10 240 10 360 36s240 40 360 14S960 0 1080 12s240 36 360 14V80z" fill="currentColor" />
    </svg>
  )
}

export function Section({ id, tone, eyebrow, title, intro, children, wave = true, dark, className = '' }: SectionProps) {
  return (
    <section id={id} className={`section ${dark ? 'section--dark' : ''} ${className}`} style={{ background: tone, color: dark ? undefined : undefined }} aria-labelledby={title ? `${id}-title` : undefined}>
      {wave && (
        <div className="section__wave" style={{ color: tone }}>
          <Wave />
        </div>
      )}
      <div className="container">
        {(eyebrow || title) && (
          <Reveal className="section__head">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 id={`${id}-title`} className="h2">{title}</h2>}
            {intro && <p className="lede">{intro}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  )
}
