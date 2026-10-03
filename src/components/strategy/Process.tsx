import { useContent } from '../../hooks/useContent'
import { getProcess } from '../../content/selectors'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'
import { getIcon } from '../ui/iconMap'
import { toneValue } from '../../utils/theme'

export function Process({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const steps = getProcess(content)
  return (
    <Section config={config} tone="var(--c-paper)" eyebrow="How I work" title="From insight to impact" wave={false} className="process">
      <ol className="process__list">
        {steps.map((s, i) => {
          const Icon = getIcon(s.icon)
          return (
            <li key={s.id} style={{ ['--step' as string]: toneValue(s.color) || 'var(--c-sky)' }}>
              <Reveal delay={i * 0.05} className="step">
                <span className="step__icon"><Icon aria-hidden size={26} strokeWidth={1.6} /></span>
                <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h5">{s.title}</h3>
                <p>{s.description}</p>
                {s.image?.src && <Img image={s.image} className="step__img" />}
              </Reveal>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
