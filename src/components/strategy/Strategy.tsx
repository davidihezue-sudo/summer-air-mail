import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SectionConfig } from '../../content/types'
import { useContent } from '../../hooks/useContent'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { useT } from '../../i18n/useT'
import { toneValue } from '../../utils/theme'

export function Strategy({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const { strategy } = content.portfolio
  const { t } = useT()
  const board = useRef<HTMLOListElement>(null)
  const [allOpen, setAllOpen] = useState(false)
  const toggleAll = () => {
    const next = !allOpen
    board.current?.querySelectorAll('details').forEach((d) => { d.open = next })
    setAllOpen(next)
  }
  return (
    <Section config={config} tone="var(--c-pink)" eyebrow="Campaign and brand strategy" title={strategy.heading} intro={strategy.intro} className="strategy">
      <p className="stamp-badge"><span>{strategy.label}</span></p>
      {(strategy.hint || strategy.showToggleAll) && (
        <div className="board-hint">
          {strategy.hint && <p className="board-hint__t"><ChevronDown size={16} aria-hidden="true" /> {strategy.hint}</p>}
          {strategy.showToggleAll && <button type="button" className="chip" onClick={toggleAll}>{allOpen ? t('note.closeAll') : t('note.openAll')}</button>}
        </div>
      )}
      <ol className="board" ref={board}>
        {strategy.steps.map((s, i) => (
          <li key={s.title} style={{ ['--note' as string]: toneValue(s.color) || 'var(--c-butter)', ['--tilt' as string]: `${((i * 53) % 7) - 3}deg` }}>
            <Reveal>
              <details className="note">
                <summary>
                  <span className="note__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="note__t">{s.title}</span>
                  <span className="note__s">{s.summary}</span>
                  <span className="note__more"><span className="note__open">{t('note.open')}</span><span className="note__shut">{t('note.close')}</span><ChevronDown size={16} aria-hidden="true" /></span>
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
