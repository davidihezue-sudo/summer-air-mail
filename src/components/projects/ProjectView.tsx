import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, FileDown, Maximize2 } from 'lucide-react'
import type { MediaItem, Project } from '../../content/types'
import { useContent } from '../../hooks/useContent'
import { getAiSkills, getContentItems, getProjects, getResults, getScreenshots, getTools, relatedProjects } from '../../content/selectors'
import { Modal } from '../ui/Modal'
import { PlatformIcons } from './PlatformChips'
import { BlockRenderer } from './Blocks'
import { CaseStudyBody } from '../case-studies/CaseStudyBody'
import { ResultCard } from '../results/ResultCard'
import { ContentCard } from '../content-gallery/ContentGallery'
import { ScreenshotGrid } from '../screenshots/Screenshots'
import { Img } from '../ui/Img'
import { hasValue, safeHref } from '../../utils/text'
import { ShareButton } from '../layout/ShareButton'
import { workUrl } from '../../utils/route'
import { isVideoSrc, mediaCaption } from '../../utils/media'

interface Props {
  project: Project | null
  focusCase: boolean
  onClose: () => void
  onOpen: (id: string) => void
}

export function ProjectView({ project, focusCase, onClose, onOpen }: Props) {
  return (
    <Modal open={!!project} onClose={onClose} label={project ? `Project: ${project.title}` : 'Project'} className="dialog dialog--wide">
      {project && <Body key={project.id} project={project} focusCase={focusCase} onOpen={onOpen} />}
    </Modal>
  )
}

function Body({ project, focusCase, onOpen }: { project: Project; focusCase: boolean; onOpen: (id: string) => void }) {
  const { content } = useContent()
  const locale = content.portfolio.site.locale
  const media: MediaItem[] = project.media?.length ? project.media : project.thumbnail?.src ? [{ type: isVideoSrc(project.thumbnail.src) ? 'video' : 'image', src: project.thumbnail.src, alt: project.thumbnail.alt, ...(project.thumbnail.poster ? { poster: project.thumbnail.poster } : {}) }] : []
  const [i, setI] = useState(0)
  const stage = useRef<HTMLElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const start = useRef<number | null>(null)
  const go = (d: number) => setI((n) => (n + d + media.length) % media.length)
  const link = safeHref(project.externalLink)
  const current = media[i]
  const { profile, site, extras } = content.portfolio

  /** Opens the print dialog on a clean version of this case study. The visitor chooses "Save as PDF" there. */
  const savePdf = () => {
    const root = document.documentElement
    const done = () => { root.classList.remove('print-case'); window.removeEventListener('afterprint', done) }
    root.classList.add('print-case')
    window.addEventListener('afterprint', done)
    window.setTimeout(() => window.print(), 60)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, video, iframe')) return
      if (e.key === 'ArrowRight' && media.length > 1) go(1)
      if (e.key === 'ArrowLeft' && media.length > 1) go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.length])

  useEffect(() => {
    if (focusCase) window.setTimeout(() => root.current?.querySelector('#case-start')?.scrollIntoView({ block: 'start' }), 60)
  }, [focusCase])

  const services = (project.serviceIds ?? []).map((id) => content.services.find((s) => s.id === id)?.name).filter((x): x is string => !!x)
  const tools = getTools(content).filter((t) => project.toolIds?.includes(t.id))
  const ai = getAiSkills(content).filter((a) => project.aiSkillIds?.includes(a.id))
  const results = getResults(content).filter((r) => project.resultIds?.includes(r.id) || r.projectId === project.id)
  const reels = getContentItems(content).filter((c) => project.contentIds?.includes(c.id))
  const shots = getScreenshots(content).filter((s) => project.screenshotIds?.includes(s.id) || s.projectId === project.id)
  const related = relatedProjects(project, getProjects(content))
  const siblings = getProjects(content)
  const pos = siblings.findIndex((x) => x.id === project.id)

  return (
    <div className="project" ref={root}>
      <div className="project__print">
        <strong>{project.title}</strong><br />
        {[profile.fullName, profile.title].filter(hasValue).join(', ')}{site.url ? ` | ${site.url.replace(/\/$/, '')}${workUrl(project.id)}` : ''}
      </div>
      {media.length > 0 && (
        <figure
          ref={stage}
          className={`project__stage${mediaCaption(current) ? ' project__stage--cap' : ''}`}
          onPointerDown={(e) => { start.current = e.clientX }}
          onPointerUp={(e) => {
            if (start.current === null) return
            const dx = e.clientX - start.current
            start.current = null
            if (Math.abs(dx) > 50 && media.length > 1) go(dx < 0 ? 1 : -1)
          }}
        >
          {current.type === 'video' ? (
            <video key={current.src} className="project__media" src={current.src} poster={current.poster} controls preload="metadata" playsInline>Your browser does not support video playback.</video>
          ) : (
            <img key={current.src} className="project__media" src={current.src} alt={current.alt} draggable={false} />
          )}
          {mediaCaption(current) && <figcaption className="project__cap">{mediaCaption(current)}</figcaption>}
          {media.length > 1 && (
            <>
              <button type="button" className="project__nav project__nav--prev" onClick={() => go(-1)} aria-label="Previous image"><ChevronLeft aria-hidden /></button>
              <button type="button" className="project__nav project__nav--next" onClick={() => go(1)} aria-label="Next image"><ChevronRight aria-hidden /></button>
              <figcaption className="project__count" aria-live="polite">{i + 1} / {media.length}</figcaption>
            </>
          )}
          {typeof document !== 'undefined' && document.fullscreenEnabled && (
            <button type="button" className="project__full" onClick={() => void stage.current?.requestFullscreen?.()} aria-label="View full screen"><Maximize2 size={18} aria-hidden /></button>
          )}
        </figure>
      )}

      {media.length > 1 && (
        <ul className="project__thumbs">
          {media.map((m, n) => (
            <li key={m.src + n}>
              <button type="button" aria-current={n === i} aria-label={`Show item ${n + 1}`} onClick={() => setI(n)}>
                <img src={m.type === 'video' ? m.poster ?? project.thumbnail.src : m.src} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="project__info">
        <p className="eyebrow">{[project.client, project.category, project.year].filter(hasValue).join(' · ')}</p>
        <h3 className="h3">{project.title}</h3>
        <p className="prose">{project.description}</p>
        <dl className="facts">
          {hasValue(project.role) && <div><dt>My role</dt><dd>{project.role}</dd></div>}
          {hasValue(project.industry) && <div><dt>Industry</dt><dd>{project.industry}</dd></div>}
          {hasValue(project.period) && <div><dt>Period</dt><dd>{project.period}</dd></div>}
        </dl>
        <PlatformIcons platforms={project.platforms} />
        <div className="project__actions">
          <ShareButton path={workUrl(project.id)} title={project.title} />
          {project.caseStudy && extras.casePdf && <button type="button" className="btn btn--ghost sharebtn" onClick={savePdf}><FileDown size={16} aria-hidden /> Save as PDF</button>}
          {content.portfolio.extras.projectNav && siblings.length > 1 && (
            <>
              <button type="button" className="btn btn--ghost sharebtn" onClick={() => onOpen(siblings[(pos - 1 + siblings.length) % siblings.length].id)}><ChevronLeft size={16} aria-hidden /> Previous project</button>
              <button type="button" className="btn btn--ghost sharebtn" onClick={() => onOpen(siblings[(pos + 1) % siblings.length].id)}>Next project <ChevronRight size={16} aria-hidden /></button>
            </>
          )}
        </div>
        {link && (
          <div className="project__actions">
            <a className="btn btn--ghost" href={link} target="_blank" rel="noopener noreferrer">View project <ArrowUpRight size={16} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>
          </div>
        )}
      </div>

      <div className="project__story">
        {project.caseStudy && <CaseStudyBody project={project} locale={locale} />}
        {!!project.blocks?.length && <BlockRenderer blocks={project.blocks} />}

        {results.length > 0 && !project.caseStudy && (
          <section className="rel"><h4 className="h4">Results</h4><div className="results__grid">{results.map((r) => <ResultCard key={r.id} result={r} />)}</div></section>
        )}
        {results.length > 0 && project.caseStudy && (
          <section className="rel"><h4 className="h4">Related results</h4><div className="results__grid">{results.map((r) => <ResultCard key={r.id} result={r} />)}</div></section>
        )}
        {reels.length > 0 && <section className="rel"><h4 className="h4">Reels and content</h4><ul className="vgrid vgrid--small">{reels.map((c) => <ContentCard key={c.id} item={c} />)}</ul></section>}
        {shots.length > 0 && <section className="rel"><h4 className="h4">Screenshots</h4><ScreenshotGrid items={shots} /></section>}

        {(services.length > 0 || tools.length > 0 || ai.length > 0) && (
          <section className="rel rel--facts">
            {services.length > 0 && <div><h4 className="h4">Services delivered</h4><ul className="chips">{services.map((s) => <li key={s}>{s}</li>)}</ul></div>}
            {tools.length > 0 && <div><h4 className="h4">Tools used</h4><ul className="chips">{tools.map((t) => <li key={t.id}>{t.name}</li>)}</ul></div>}
            {ai.length > 0 && <div><h4 className="h4">AI used</h4><ul className="chips">{ai.map((a) => <li key={a.id}>{a.name}{a.tool ? ` (${a.tool})` : ''}</li>)}</ul></div>}
          </section>
        )}

        {related.length > 0 && (
          <section className="rel">
            <h4 className="h4">Related work</h4>
            <ul className="related">
              {related.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => onOpen(p.id)}>
                    {p.thumbnail?.src && <Img image={p.thumbnail} />}
                    <span><strong>{p.title}</strong><br /><span className="muted">{p.client}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
