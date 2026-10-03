import type { SectionConfig } from '../../content/types'
import { ArrowRight, Download } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { goTo } from '../../utils/nav'
import { cvLink } from '../../utils/text'

export function RecruiterOverview({ config }: { config: SectionConfig }) {
  const { content, has, idOf } = useContent()
  const { profile, recruiter } = content.portfolio

  const cv = cvLink(content.portfolio)
  const paths: { id: string; label: string }[] = []
  const add = (type: Parameters<typeof has>[0], label: string) => { const id = idOf(type); if (has(type) && id) paths.push({ id, label }) }
  add('work', 'View selected work')
  add('caseStudies', 'Read case studies')
  add('results', 'See results')
  add('services', 'Review skills')
  add('contact', 'Contact me')

  return (
    <Section config={config} tone="var(--c-paper)" eyebrow="At a glance" title="The 60 second overview" className="overview" wave={false}>
      <div className="overview__grid">
        <Reveal className="overview__summary">
          <h3 className="h4">Professional summary</h3>
          <p className="prose">{profile.intro}</p>
          {profile.targetJobs.length > 0 && (
            <>
              <h3 className="h4">Looking for</h3>
              <ul className="chips">{profile.targetJobs.map((j) => <li key={j}>{j}</li>)}</ul>
            </>
          )}
          <div className="overview__paths">
            {paths.map((p) => (
              <button key={p.id} type="button" className="btn btn--ghost" onClick={() => goTo(p.id, p.id === idOf('contact') ? 'enquiry-name' : undefined)}>
                {p.label} <ArrowRight size={16} aria-hidden />
              </button>
            ))}
            {cv && <a className="btn btn--solid" href={cv.href} download={cv.filename}><Download size={16} aria-hidden /> {cv.label}</a>}
          </div>
        </Reveal>

        <Reveal className="overview__facts" delay={0.1}>
          <Fact title="Core competencies" items={recruiter.competencies} />
          <Fact title="Platforms" items={recruiter.platforms} />
          <Fact title="Industries" items={recruiter.industries} />
          {recruiter.achievements.length > 0 && (
            <div>
              <h3 className="h4">Selected achievements</h3>
              <ul className="ticks">{recruiter.achievements.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          )}
          {recruiter.employment.length > 0 && (
            <div>
              <h3 className="h4">Experience</h3>
              <ul className="timeline">
                {recruiter.employment.map((e) => (
                  <li key={`${e.employer}${e.period}`}><strong>{e.role}</strong>, {e.employer} <span className="muted">{e.period}</span><br />{e.summary}</li>
                ))}
              </ul>
            </div>
          )}
          {(recruiter.education.length > 0 || recruiter.certifications.length > 0) && (
            <div>
              <h3 className="h4">Education and certifications</h3>
              <ul className="timeline">
                {recruiter.education.map((e) => <li key={e.title}><strong>{e.title}</strong>, {e.place} <span className="muted">{e.year}</span></li>)}
                {recruiter.certifications.map((c) => <li key={c.title}><strong>{c.title}</strong>, {c.issuer} <span className="muted">{c.year}</span></li>)}
              </ul>
            </div>
          )}
        </Reveal>
      </div>
    </Section>
  )
}

function Fact({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <h3 className="h4">{title}</h3>
      <ul className="chips">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  )
}
