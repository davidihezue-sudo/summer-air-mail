import { ArrowRight } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { getCaseStudyProjects } from '../../content/selectors'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'
import { useViewer } from '../projects/Viewer'

export function CaseStudies() {
  const { content } = useContent()
  const projects = getCaseStudyProjects(content)
  const { openCase } = useViewer()
  return (
    <Section id="case-studies" tone="var(--c-ink)" dark eyebrow="Case studies" title="The thinking behind the work" intro="Challenge, strategy, execution and measured results, with a clear line between what I did and what the team did." className="cases">
      <div className="cases__list">
        {projects.map((p, i) => (
          <Reveal key={p.id} className={`casecard ${i % 2 ? 'casecard--flip' : ''}`}>
            <div className="casecard__img"><Img image={p.thumbnail} sizes="(min-width: 900px) 40vw, 90vw" /></div>
            <div className="casecard__body">
              <p className="eyebrow">{p.client} · {p.industry}</p>
              <h3 className="h3">{p.title}</h3>
              <p className="prose">{p.caseStudy!.objective}</p>
              {p.caseStudy!.metrics && p.caseStudy!.metrics.length > 0 && (
                <ul className="chips chips--light">{p.caseStudy!.metrics.slice(0, 3).map((m) => <li key={m.label}>{m.label}</li>)}</ul>
              )}
              <button type="button" className="btn btn--light" onClick={() => openCase(p.id)}>Read the case study <ArrowRight size={16} aria-hidden /></button>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
