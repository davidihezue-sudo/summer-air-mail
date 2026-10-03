import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Maximize2, BookOpen } from 'lucide-react'
import type { MediaItem, Project } from '../../content/types'
import { Modal } from '../ui/Modal'
import { PlatformIcons } from './PlatformChips'
import { safeHref } from '../../utils/text'

interface Props {
  project: Project | null
  onClose: () => void
  onCase: (id: string) => void
}

export function ProjectDialog({ project, onClose, onCase }: Props) {
  return (
    <Modal open={!!project} onClose={onClose} label={project ? `Project: ${project.title}` : 'Project'} className="dialog dialog--wide">
      {project && <ProjectBody key={project.id} project={project} onCase={onCase} />}
    </Modal>
  )
}

function ProjectBody({ project, onCase }: { project: Project; onCase: (id: string) => void }) {
  const media: MediaItem[] = project.media?.length ? project.media : [{ type: 'image', src: project.thumbnail.src, alt: project.thumbnail.alt }]
  const [i, setI] = useState(0)
  const stage = useRef<HTMLElement>(null)
  const start = useRef<number | null>(null)
  const go = (d: number) => setI((n) => (n + d + media.length) % media.length)
  const link = safeHref(project.externalLink)
  const current = media[i]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.length])

  return (
    <div className="project">
      <figure
        ref={stage}
        className="project__stage"
        onPointerDown={(e) => { start.current = e.clientX }}
        onPointerUp={(e) => {
          if (start.current === null) return
          const dx = e.clientX - start.current
          start.current = null
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        }}
      >
        {current.type === 'video' ? (
          <video key={current.src} className="project__media" src={current.src} poster={current.poster} controls preload="metadata" playsInline>
            Your browser does not support video playback.
          </video>
        ) : (
          <img key={current.src} className="project__media" src={current.src} alt={current.alt} draggable={false} />
        )}
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
        <p className="eyebrow">{project.client} · {project.category} · {project.year}</p>
        <h3 className="h3">{project.title}</h3>
        <p className="prose">{project.description}</p>
        <dl className="facts">
          <div><dt>My role</dt><dd>{project.role}</dd></div>
          <div><dt>Industry</dt><dd>{project.industry}</dd></div>
          {project.period && <div><dt>Period</dt><dd>{project.period}</dd></div>}
        </dl>
        <PlatformIcons platforms={project.platforms} />
        <div className="project__actions">
          {project.caseStudy && (
            <button type="button" className="btn btn--solid" onClick={() => onCase(project.id)}><BookOpen size={18} aria-hidden /> Read the case study</button>
          )}
          {link && (
            <a className="btn btn--ghost" href={link} target="_blank" rel="noopener noreferrer">View project <ArrowUpRight size={16} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>
          )}
        </div>
      </div>
    </div>
  )
}
