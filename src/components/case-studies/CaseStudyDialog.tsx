import type { Project } from '../../content/types'
import { Modal } from '../ui/Modal'
import { PlatformIcons } from '../projects/PlatformChips'
import { MetricBar } from './MetricBar'
import { BeforeAfter } from './BeforeAfter'
import { safeHref } from '../../utils/text'

export function CaseStudyDialog({ project, locale, onClose }: { project: Project | null; locale: string; onClose: () => void }) {
  return (
    <Modal open={!!project} onClose={onClose} label={project ? `Case study: ${project.title}` : 'Case study'} className="dialog dialog--case">
      {project?.caseStudy && <Body project={project} locale={locale} />}
    </Modal>
  )
}

function Body({ project, locale }: { project: Project; locale: string }) {
  const cs = project.caseStudy!
  const link = safeHref(project.externalLink)
  return (
    <article className="case">
      <header className="case__hero">
        <p className="eyebrow">Case study</p>
        <h3 className="h2">{project.title}</h3>
        <dl className="case__facts">
          <div><dt>Client</dt><dd>{project.client}</dd></div>
          <div><dt>Industry</dt><dd>{project.industry}</dd></div>
          <div><dt>Period</dt><dd>{project.period ?? project.year}</dd></div>
          <div><dt>My role</dt><dd>{project.role}</dd></div>
          <div><dt>Platforms</dt><dd><PlatformIcons platforms={project.platforms} /></dd></div>
        </dl>
        <p className="lede">{cs.objective}</p>
      </header>

      <section className="case__block case__block--challenge">
        <h4 className="case__h"><span>01</span> The challenge</h4>
        <p className="prose">{cs.challenge}</p>
        {cs.objectives && <ul className="ticks">{cs.objectives.map((o) => <li key={o}>{o}</li>)}</ul>}
      </section>

      <section className="case__block case__block--strategy">
        <h4 className="case__h"><span>02</span> The strategy</h4>
        <p className="prose">{cs.strategy}</p>
      </section>

      <section className="case__block case__block--exec">
        <h4 className="case__h"><span>03</span> Execution</h4>
        <ol className="steps">{cs.execution.map((e) => <li key={e}>{e}</li>)}</ol>
        {cs.deliverables && <ul className="chips">{cs.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>}
      </section>

      {(cs.metrics?.length || cs.confidentialResults || cs.beforeAfter) && (
        <section className="case__block case__block--results">
          <h4 className="case__h"><span>04</span> Results</h4>
          {cs.metrics?.map((m) => <MetricBar key={m.label} metric={m} locale={locale} />)}
          {cs.confidentialResults && <p className="prose">{cs.confidentialResults}</p>}
          {cs.beforeAfter && <BeforeAfter {...cs.beforeAfter} />}
          {cs.metrics?.length ? <p className="fineprint">Figures show change across the stated measurement period. They are reported alongside the work, not as proof that the work was the only cause.</p> : null}
        </section>
      )}

      <section className="case__block case__block--mine">
        <h4 className="case__h"><span>05</span> My contribution</h4>
        <div className="case__split">
          <div><h5 className="h5">Delivered by me</h5><ul className="ticks">{cs.contribution.personal.map((c) => <li key={c}>{c}</li>)}</ul></div>
          {cs.contribution.team && cs.contribution.team.length > 0 && (
            <div><h5 className="h5">Delivered by the wider team</h5><ul className="ticks">{cs.contribution.team.map((c) => <li key={c}>{c}</li>)}</ul></div>
          )}
        </div>
      </section>

      <section className="case__block case__block--lessons">
        <h4 className="case__h"><span>06</span> Lessons and insights</h4>
        <ul className="ticks">{cs.lessons.map((l) => <li key={l}>{l}</li>)}</ul>
        {link && <a className="btn btn--ghost" href={link} target="_blank" rel="noopener noreferrer">View the live project<span className="sr-only"> (opens in a new tab)</span></a>}
      </section>
    </article>
  )
}
