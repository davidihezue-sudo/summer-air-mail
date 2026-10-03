import { ExternalLink } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { getAiSkills, getProjects } from '../../content/selectors'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { VideoPlayer } from '../ui/VideoPlayer'
import { hasValue, safeHref } from '../../utils/text'
import { useViewer } from '../projects/Viewer'

export function AiSkills({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const skills = getAiSkills(content)
  const projects = getProjects(content)
  const { openProject, openImages } = useViewer()
  const groups = [...new Set(skills.map((s) => s.category))].map((c) => ({ category: c, items: skills.filter((s) => s.category === c) }))

  return (
    <Section
      config={config} tone="var(--c-aqua)" eyebrow="AI and marketing technology" title="Using AI with judgement"
      intro="The AI tools and workflows I have actually used, what they were used for and what came out of it." className="ai"
    >
      {groups.map((g) => (
        <div key={g.category} className="aigroup">
          <h3 className="h4">{g.category}</h3>
          <div className="ai__grid">
            {g.items.map((s) => {
              const project = projects.find((p) => p.id === s.projectId)
              const link = safeHref(s.link)
              return (
                <Reveal key={s.id} className="aicard">
                  <h4 className="h5">{s.name}</h4>
                  <p className="aicard__tool">{[s.tool, s.level].filter(hasValue).join(' · ')}</p>
                  <p>{s.description}</p>
                  {hasValue(s.outcome) && <p className="aicard__outcome"><strong>Outcome:</strong> {s.outcome}</p>}
                  {s.screenshot?.src && (
                    <button type="button" className="result__shot" onClick={() => openImages([{ ...s.screenshot!, caption: s.name }], 0)} aria-label={`View screenshot: ${s.name}`}>
                      <img src={s.screenshot.src} alt={s.screenshot.alt || s.name} loading="lazy" decoding="async" />
                    </button>
                  )}
                  {s.video && <VideoPlayer src={s.video} title={s.name} />}
                  <div className="aicard__links">
                    {project && <button type="button" className="textlink" onClick={() => openProject(project.id)}>Example: {project.title}</button>}
                    {link && <a className="textlink" href={link} target="_blank" rel="noopener noreferrer">Learn more <ExternalLink size={14} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>}
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      ))}
    </Section>
  )
}
