import { useContent } from '../../hooks/useContent'
import { getSkillGroups } from '../../content/selectors'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'

/** Grouped skills. Levels are words, never percentage bars. */
export function Skills({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const groups = getSkillGroups(content)
  return (
    <Section config={config} tone="var(--c-paper)" eyebrow="Skills" title="What I can do" wave={false} className="skills">
      <div className="skills__grid">
        {groups.map((g) => (
          <Reveal key={g.id} className="skillgroup">
            <h3 className="h4 skillgroup__title">{g.name}</h3>
            <ul className="skilllist">
              {g.skills.map((s) => (
                <li key={s.name}>
                  <span className="skilllist__name">{s.name}</span>
                  {s.level && <span className="skilllist__level">{s.level}</span>}
                  {s.note && <span className="skilllist__note">{s.note}</span>}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
