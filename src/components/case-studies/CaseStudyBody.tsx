import type { Project } from '../../content/types'
import { MetricBar } from './MetricBar'
import { BeforeAfter } from './BeforeAfter'
import { platformLabel } from '../ui/Icons'
import { RichText } from '../ui/RichText'
import { hasValue } from '../../utils/text'
import { useViewer } from '../projects/Viewer'

/** The structured case study. Only sections that have content are shown, and they are numbered in order. */
export function CaseStudyBody({ project, locale }: { project: Project; locale: string }) {
  const cs = project.caseStudy!
  const { openImages } = useViewer()
  const sections: { key: string; title: string; tone: string; body: React.ReactNode }[] = []
  const add = (key: string, title: string, tone: string, ok: boolean, body: React.ReactNode) => ok && sections.push({ key, title, tone, body })

  add('challenge', 'The challenge', 'challenge', hasValue(cs.challenge) || !!cs.objectives?.length, (
    <>
      <RichText text={cs.challenge} />
      {!!cs.objectives?.length && (<><h5 className="h5">Objectives</h5><ul className="ticks">{cs.objectives.map((o) => <li key={o}>{o}</li>)}</ul></>)}
    </>
  ))
  add('audience', 'The audience', 'strategy', hasValue(cs.audience), <RichText text={cs.audience} />)
  add('strategy', 'The strategy', 'strategy', hasValue(cs.strategy) || !!cs.framework?.length, (
    <>
      <RichText text={cs.strategy} />
      {!!cs.framework?.length && (
        <div className="blk-frame__cols">{cs.framework.map((c) => <div key={c.title}><h5 className="h5">{c.title}</h5><ul className="ticks">{c.items.map((i) => <li key={i}>{i}</li>)}</ul></div>)}</div>
      )}
    </>
  ))
  add('execution', 'Execution', 'exec', !!cs.execution?.length || !!cs.deliverables?.length, (
    <>
      {!!cs.execution?.length && <ol className="steps">{cs.execution.map((e) => <li key={e}>{e}</li>)}</ol>}
      {!!cs.deliverables?.length && <ul className="chips">{cs.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>}
    </>
  ))
  const creative = (cs.creative ?? []).filter((m) => m.src)
  add('creative', 'Creative', 'exec', creative.length > 0, (
    <div className="blk-gallery__grid">
      {creative.map((m, i) => m.type === 'video' ? (
        <video key={m.src} src={m.src} poster={m.poster} controls preload="none" playsInline aria-label={m.alt} />
      ) : (
        <button key={m.src} type="button" onClick={() => openImages(creative.filter((x) => x.type === 'image').map((x) => ({ src: x.src, alt: x.alt })), creative.filter((x) => x.type === 'image').findIndex((x) => x.src === m.src))} aria-label={`View creative ${i + 1} full size`}>
          <img src={m.src} alt={m.alt} loading="lazy" decoding="async" />
        </button>
      ))}
    </div>
  ))
  add('distribution', 'Distribution', 'exec', !!cs.distribution?.length, <ul className="chips">{cs.distribution!.map((d) => <li key={d}>{platformLabel(d)}</li>)}</ul>)
  add('paid', 'Paid media', 'exec', hasValue(cs.paidMedia), <RichText text={cs.paidMedia} />)
  add('results', 'Results', 'results', !!cs.metrics?.length || hasValue(cs.confidentialResults) || !!cs.beforeAfter, (
    <>
      {cs.metrics?.map((m) => <MetricBar key={m.label} metric={m} locale={locale} />)}
      {hasValue(cs.confidentialResults) && <p className="prose">{cs.confidentialResults}</p>}
      {cs.beforeAfter && <BeforeAfter {...cs.beforeAfter} />}
      {!!cs.metrics?.length && <p className="fineprint">Figures show change across the stated measurement period. They are reported alongside the work, not as proof that the work was the only cause.</p>}
    </>
  ))
  add('mine', 'My contribution', 'mine', !!cs.contribution?.personal?.length, (
    <div className="case__split">
      <div><h5 className="h5">Delivered by me</h5><ul className="ticks">{cs.contribution.personal.map((c) => <li key={c}>{c}</li>)}</ul></div>
      {!!cs.contribution.team?.length && <div><h5 className="h5">Delivered by the wider team</h5><ul className="ticks">{cs.contribution.team.map((c) => <li key={c}>{c}</li>)}</ul></div>}
    </div>
  ))
  add('lessons', 'Lessons and insights', 'lessons', !!cs.lessons?.length, <ul className="ticks">{cs.lessons.map((l) => <li key={l}>{l}</li>)}</ul>)

  return (
    <article className="case" id="case-start">
      {hasValue(cs.objective) && <p className="lede case__objective">{cs.objective}</p>}
      {sections.map((s, i) => (
        <section key={s.key} className={`case__block case__block--${s.tone}`}>
          <h4 className="case__h"><span>{String(i + 1).padStart(2, '0')}</span> {s.title}</h4>
          {s.body}
        </section>
      ))}
    </article>
  )
}
