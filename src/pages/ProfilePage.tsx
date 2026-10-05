import { useEffect } from 'react'
import { Visual } from '../components/ui/Visual'
import { Printer } from 'lucide-react'
import { useContent } from '../hooks/useContent'
import { getResults, getTools, getProjects } from '../content/selectors'
import { pctOf } from '../components/results/ResultCard'
import { BookingButton } from '../components/layout/BookingButton'
import { useT } from '../i18n/useT'
import { hasValue } from '../utils/text'
import { navigate } from '../utils/route'

const ACCENT = /^#[0-9a-f]{6}$/i

/** A clean one page profile for recruiters. Always light so it prints and saves to PDF predictably. */
export function ProfilePage() {
  const { content } = useContent()
  const { t } = useT()
  const p = content.portfolio
  const pp = p.profilePage
  const inc = pp.include
  const pr = p.profile
  const results = getResults(content).filter((r) => !pp.resultIds.length || pp.resultIds.includes(r.id)).slice(0, 6)
  const all = getProjects(content)
  const chosen = pp.projectIds.length ? pp.projectIds.map((id) => all.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x) : all.filter((x) => x.featured).concat(all.filter((x) => !x.featured))
  const projects = chosen.slice(0, Math.max(1, pp.maxProjects))
  const tools = getTools(content)
  const accent = ACCENT.test(pp.accent) ? pp.accent : '#b5262e'
  const title = hasValue(pp.title) ? pp.title : pr.fullName
  const sub = hasValue(pp.subtitle) ? pp.subtitle : pr.title

  useEffect(() => { document.title = `${title} | Profile`; window.scrollTo(0, 0) }, [title])

  const list = (items: string[]) => items.length > 0 && <ul className="pf__chips">{items.map((x) => <li key={x}>{x}</li>)}</ul>
  const r = p.recruiter

  return (
    <div className="pf" style={{ ['--pf-accent' as string]: accent }}>
      <div className="pf__bar no-print">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>{t('profile.back')}</a>
        <span className="pf__bar-actions">
          <BookingButton place="profile" className="pf__btn" />
          <button type="button" className="pf__btn" onClick={() => window.print()}><Printer size={16} aria-hidden /> {t('profile.print')}</button>
        </span>
      </div>
      <main className="pf__page" id="main">
        <header className="pf__head">
          <div>
            <h1>{title}</h1>
            {sub && <p className="pf__sub">{sub}</p>}
            {inc.contact && (
              <p className="pf__contact">
                {[pr.email, pr.phone, pr.location, p.site.url.replace(/^https?:\/\//, '')].filter(hasValue).join('  |  ')}
              </p>
            )}
          </div>
          {pp.showPhoto && pr.profilePhoto?.src && <Visual src={pr.profilePhoto.src} poster={pr.profilePhoto.poster} alt={pr.profilePhoto.alt || ''} className="pf__photo" />}
        </header>

        {inc.summary && (hasValue(pr.intro) || pr.highlights.length > 0) && (
          <section><h2>Summary</h2>{hasValue(pr.intro) && <p>{pr.intro}</p>}{pr.highlights.length > 0 && <ul className="pf__list">{pr.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}</section>
        )}
        {inc.competencies && r.competencies.length > 0 && <section><h2>Core competencies</h2>{list(r.competencies)}</section>}
        {inc.platforms && r.platforms.length > 0 && <section><h2>Platforms</h2>{list(r.platforms)}</section>}
        {inc.industries && r.industries.length > 0 && <section><h2>Industries</h2>{list(r.industries)}</section>}
        {inc.achievements && r.achievements.length > 0 && <section><h2>Achievements</h2><ul className="pf__list">{r.achievements.map((a) => <li key={a}>{a}</li>)}</ul></section>}
        {inc.results && results.length > 0 && (
          <section><h2>Measured results</h2>
            <div className="pf__results">
              {results.map((x) => {
                const pct = pctOf(x)
                return (
                  <div key={x.id} className="pf__result">
                    <strong>{x.classification === 'confidential' && x.showValues === false ? 'Confidential' : typeof x.end === 'number' ? `${x.prefix ?? ''}${x.end.toLocaleString(p.site.locale)}${x.unit ?? ''}` : ''}</strong>
                    <span>{x.metric}</span>
                    <small>{pct && x.classification !== 'confidential' ? `${pct.value >= 0 ? '+' : ''}${Number(pct.value.toFixed(1)).toLocaleString(p.site.locale)}%  ` : ''}{x.period}</small>
                  </div>
                )
              })}
            </div>
          </section>
        )}
        {inc.projects && projects.length > 0 && (
          <section><h2>Selected work</h2>
            {projects.map((x) => (
              <article key={x.id} className="pf__item">
                <h3>{x.title}{x.client ? `, ${x.client}` : ''}</h3>
                <p className="pf__meta">{[x.category, x.role, x.period || x.year].filter(hasValue).join('  |  ')}</p>
                {hasValue(x.description) && <p>{x.description}</p>}
              </article>
            ))}
          </section>
        )}
        {inc.employment && r.employment.length > 0 && (
          <section><h2>Experience</h2>{r.employment.map((e) => <article key={e.role + e.employer + e.period} className="pf__item"><h3>{e.role}, {e.employer}</h3><p className="pf__meta">{e.period}</p>{hasValue(e.summary) && <p>{e.summary}</p>}</article>)}</section>
        )}
        {inc.tools && tools.length > 0 && <section><h2>Tools</h2>{list(tools.map((x) => x.name))}</section>}
        {inc.education && r.education.length > 0 && <section><h2>Education</h2><ul className="pf__list">{r.education.map((e) => <li key={e.title + e.place}>{e.title}, {e.place} {e.year}</li>)}</ul></section>}
        {inc.certifications && r.certifications.length > 0 && <section><h2>Certifications</h2><ul className="pf__list">{r.certifications.map((e) => <li key={e.title + e.issuer}>{e.title}, {e.issuer} {e.year}</li>)}</ul></section>}
        {hasValue(pp.footerNote) && <footer className="pf__foot">{pp.footerNote}</footer>}
      </main>
    </div>
  )
}
