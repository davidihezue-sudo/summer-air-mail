import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useContent } from '../../hooks/useContent'
import { useMotion } from '../../hooks/useMotion'
import { useTheme } from '../../hooks/useTheme'
import { getProjects, getServices } from '../../content/selectors'
import type { SectionConfig, Service } from '../../content/types'
import { Section } from '../ui/Section'
import { Modal } from '../ui/Modal'
import { Img } from '../ui/Img'
import { TowelObject } from '../ui/art'
import { getIcon } from '../ui/iconMap'
import { drawingFor } from '../../content/serviceArt'
import { platformLabel } from '../ui/Icons'
import { toneValue } from '../../utils/theme'
import { useViewer } from '../projects/Viewer'

export function Services({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const { reduced, finePointer } = useMotion()
  const { resolved, professional, copy } = useTheme()
  const services = getServices(content)
  const projects = getProjects(content)
  const { openProject } = useViewer()
  const [active, setActive] = useState<Service | null>(null)
  const towel = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const playful = professional !== 'professional'
  const canDrag = finePointer && !reduced && playful

  const art = (s: Service) => {
    const drawing = drawingFor(s)
    if (drawing) return <TowelObject name={drawing} />
    const Icon = getIcon(s.icon)
    return <Icon className="towel-art towel-art--icon" aria-hidden strokeWidth={1.4} />
  }

  const related = active ? projects.filter((p) => active.projectIds?.includes(p.id) || p.serviceIds?.includes(active.id)) : []
  const categories = [...new Set(services.map((s) => s.category || 'Services'))]

  return (
    <Section
      config={config} tone="var(--c-aqua)" eyebrow="Capabilities" title={copy.servicesTitle}
      intro={playful ? (canDrag ? 'Drag the objects around, or select one to read how I work.' : 'Select an object to read how I work.') : 'Select a service to read how I work.'}
      className="services"
    >
      {playful ? (
        <div ref={towel} className={`towel towel--${resolved.season}`}>
          <div className="towel__fringe towel__fringe--l" aria-hidden />
          <div className="towel__fringe towel__fringe--r" aria-hidden />
          <ul className="towel__objects">
            {services.map((s, i) => {
              const rot = (((i * 37) % 13) - 6) * (professional === 'balanced' ? 0.6 : 1)
              const body = (<>{art(s)}<span className="towel__label">{s.name}</span></>)
              const style = { ['--tone' as string]: toneValue(s.color) || 'var(--c-sky)' }
              return (
                <li key={s.id}>
                  {reduced ? (
                    <button type="button" className="towel__item" style={{ ...style, rotate: `${rot}deg` }} onClick={() => setActive(s)}>{body}</button>
                  ) : (
                    <motion.button
                      type="button" className="towel__item" style={style}
                      initial={{ y: -320, opacity: 0, rotate: rot * 4 }}
                      whileInView={{ y: 0, opacity: 1, rotate: rot }}
                      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                      transition={{ type: 'spring', stiffness: 150, damping: 11, delay: Math.min(i, 8) * 0.1 }}
                      drag={canDrag} dragConstraints={towel} dragElastic={0.12} dragMomentum={false}
                      whileDrag={{ scale: 1.08, zIndex: 5, cursor: 'grabbing' }} whileHover={{ scale: 1.04 }}
                      onDragStart={() => { dragged.current = true }}
                      onDragEnd={() => { window.setTimeout(() => { dragged.current = false }, 0) }}
                      onClick={() => { if (!dragged.current) setActive(s) }}
                    >
                      {body}
                    </motion.button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="svc-groups">
          {categories.map((c) => (
            <div key={c} className="svc-group">
              <h3 className="h4">{c}</h3>
              <ul className="svc-cards">
                {services.filter((s) => (s.category || 'Services') === c).map((s) => (
                  <li key={s.id}>
                    <button type="button" className="svc-card" style={{ ['--tone' as string]: toneValue(s.color) || 'var(--c-sky)' }} onClick={() => setActive(s)}>
                      <span className="svc-card__art">{art(s)}</span>
                      <span className="svc-card__name">{s.name}</span>
                      <span className="svc-card__desc">{s.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} label={active ? `${active.name}: details` : 'Service details'} className="dialog dialog--narrow">
        {active && (
          <article className="service-detail" style={{ ['--tone' as string]: toneValue(active.color) || 'var(--c-sky)' }}>
            <div className="service-detail__art">{art(active)}</div>
            {active.category && <p className="eyebrow">{active.category}</p>}
            <h3 className="h3">{active.name}</h3>
            <p className="lede">{active.description}</p>
            <p className="prose">{active.detail !== active.description ? active.detail : ''}</p>
            {active.image?.src && <Img image={active.image} className="service-detail__img" />}
            {active.platforms && active.platforms.length > 0 && <ul className="chips">{active.platforms.map((p) => <li key={p}>{platformLabel(p)}</li>)}</ul>}
            {related.length > 0 && (
              <div>
                <h4 className="h4">Related projects</h4>
                <ul className="linklist">
                  {related.map((p) => <li key={p.id}><button type="button" className="textlink" onClick={() => { setActive(null); openProject(p.id) }}>{p.title}</button></li>)}
                </ul>
              </div>
            )}
          </article>
        )}
      </Modal>
    </Section>
  )
}
