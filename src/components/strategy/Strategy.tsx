import type { SectionConfig } from '../../content/types'
import { useContent } from '../../hooks/useContent'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { toneValue } from '../../utils/theme'

export function Strategy({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const { strategy } = content.portfolio
  return (
    <Section config={config} tone="var(--c-pink)" eyebrow="Campaign and brand strategy" title={strategy.heading} intro={strategy.intro} className="strategy">
      <p className="stamp-badge"><span>{strategy.label}</span></p>
      <ol className="board">
        {strategy.steps.map((s, i) => (
          <li key={s.title} style={{ ['--note' as string]: toneValue(s.color) || 'var(--c-butter)', ['--tilt' as string]: `${((i * 53) % 7) - 3}deg` }}>
            <Reveal>
              <details className="note">
                <summary>
                  <span className="note__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="note__t">{s.title}</span>
                  <span className="note__s">{s.summary}</span>
                </summary>
                <ul>{s.questions.map((q) => <li key={q}>{q}</li>)}</ul>
              </details>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  )
}
