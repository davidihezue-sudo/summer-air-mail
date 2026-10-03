import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useMotion } from '../../hooks/useMotion'
import { getWebsites } from '../../content/selectors'
import { Section } from '../ui/Section'
import { safeHref } from '../../utils/text'

function useTyped(text: string, reduced: boolean) {
  const [n, setN] = useState(reduced ? text.length : 0)
  useEffect(() => {
    if (reduced) {
      setN(text.length)
      return
    }
    setN(0)
    const id = window.setInterval(() => setN((v) => (v >= text.length ? (window.clearInterval(id), v) : v + 1)), 55)
    return () => window.clearInterval(id)
  }, [text, reduced])
  return text.slice(0, n)
}

export function Websites() {
  const { content } = useContent()
  const { reduced } = useMotion()
  const sites = getWebsites(content)
  const [id, setId] = useState(sites[0]?.id)
  const [shot, setShot] = useState(0)
  const site = sites.find((s) => s.id === id) ?? sites[0]
  const typed = useTyped(site.url, reduced)
  const link = safeHref(site.externalLink)

  useEffect(() => {
    setShot(0)
    if (reduced || site.screenshots.length < 2) return
    const t = window.setInterval(() => setShot((s) => (s + 1) % site.screenshots.length), 7000)
    return () => window.clearInterval(t)
  }, [site, reduced])

  const current = site.screenshots[shot]
  return (
    <Section id="websites" tone="var(--c-sage)" eyebrow="Websites and digital projects" title="On the laptop" className="websites">
      {sites.length > 1 && (
        <div className="filters" role="group" aria-label="Choose a website project">
          {sites.map((s) => <button key={s.id} type="button" className="chip" aria-pressed={s.id === site.id} onClick={() => setId(s.id)}>{s.name}</button>)}
        </div>
      )}
      <div className="websites__grid">
        <div className="laptop" aria-label={`Laptop showing ${site.name}`}>
          <div className="laptop__lid">
            <div className="laptop__bar">
              <i /><i /><i />
              <span className="laptop__url" aria-label={`Address: ${site.url}`}>{typed}<b aria-hidden /></span>
            </div>
            <div className="laptop__screen">
              {current && (
                <img key={current.src} className={reduced ? '' : 'is-scrolling'} src={current.src} alt={current.alt} width={current.width} height={current.height} loading="lazy" />
              )}
            </div>
          </div>
          <div className="laptop__base" aria-hidden />
        </div>
        <div className="websites__info">
          <h3 className="h3">{site.name}</h3>
          <p className="prose">{site.description}</p>
          <h4 className="h4">My responsibilities</h4>
          <ul className="ticks">{site.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
          <p className="muted">Built on {site.platform}</p>
          {link && <a className="btn btn--solid" href={link} target="_blank" rel="noopener noreferrer">Visit the site <ArrowUpRight size={16} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>}
        </div>
      </div>
    </Section>
  )
}
