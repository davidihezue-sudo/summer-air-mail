import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Megaphone, BarChart3, Camera, Palette, Users, Mail, Video, Target, PenTool, Search, Globe, type LucideIcon } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useMotion } from '../../hooks/useMotion'
import { getProjects, getServices } from '../../content/selectors'
import type { Service } from '../../content/types'
import { Section } from '../ui/Section'
import { Modal } from '../ui/Modal'
import { Img } from '../ui/Img'
import { TowelObject } from '../ui/art'
import { platformLabel } from '../ui/Icons'
import { useViewer } from '../projects/Viewer'

/** Icons selectable by name from services.ts (the `icon` field). Add more here if needed. */
const ICONS: Record<string, LucideIcon> = { Sparkles, Megaphone, BarChart3, Camera, Palette, Users, Mail, Video, Target, PenTool, Search, Globe }

function ServiceArt({ s }: { s: Service }) {
  if (s.object) return <TowelObject name={s.object} />
  const Icon = (s.icon && ICONS[s.icon]) || Sparkles
  return <Icon className="towel-art towel-art--icon" aria-hidden strokeWidth={1.4} />
}

export function Services() {
  const { content } = useContent()
  const { reduced, finePointer } = useMotion()
  const services = getServices(content)
  const projects = getProjects(content)
  const { openProject } = useViewer()
  const [active, setActive] = useState<Service | null>(null)
  const towel = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const canDrag = finePointer && !reduced

  const related = active ? projects.filter((p) => active.projectIds?.includes(p.id)) : []

  return (
    <Section
      id="services"
      tone="var(--c-aqua)"
      eyebrow="Capabilities"
      title="What I put on the towel"
      intro={canDrag ? 'Drag the objects around, or select one to read how I work.' : 'Select an object to read how I work.'}
      className="services"
    >
      <div ref={towel} className="towel">
        <div className="towel__fringe towel__fringe--l" aria-hidden />
        <div className="towel__fringe towel__fringe--r" aria-hidden />
        <ul className="towel__objects">
          {services.map((s, i) => {
            const rot = ((i * 37) % 13) - 6
            const body = (
              <>
                <ServiceArt s={s} />
                <span className="towel__label">{s.name}</span>
              </>
            )
            return (
              <li key={s.id}>
                {reduced ? (
                  <button type="button" className="towel__item" style={{ ['--tone' as string]: s.color, rotate: `${rot}deg` }} onClick={() => setActive(s)}>{body}</button>
                ) : (
                  <motion.button
                    type="button"
                    className="towel__item"
                    style={{ ['--tone' as string]: s.color }}
                    initial={{ y: -320, opacity: 0, rotate: rot * 4 }}
                    whileInView={{ y: 0, opacity: 1, rotate: rot }}
                    viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                    transition={{ type: 'spring', stiffness: 150, damping: 11, delay: i * 0.1 }}
                    drag={canDrag}
                    dragConstraints={towel}
                    dragElastic={0.12}
                    dragMomentum={false}
                    whileDrag={{ scale: 1.08, zIndex: 5, cursor: 'grabbing' }}
                    whileHover={{ scale: 1.04 }}
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

      <Modal open={!!active} onClose={() => setActive(null)} label={active ? `${active.name}: details` : 'Service details'} className="dialog dialog--narrow">
        {active && (
          <article className="service-detail" style={{ ['--tone' as string]: active.color }}>
            <div className="service-detail__art"><ServiceArt s={active} /></div>
            <h3 className="h3">{active.name}</h3>
            <p className="lede">{active.description}</p>
            <p className="prose">{active.detail}</p>
            {active.image && <Img image={active.image} className="service-detail__img" />}
            {active.platforms && active.platforms.length > 0 && (
              <ul className="chips">{active.platforms.map((p) => <li key={p}>{platformLabel(p)}</li>)}</ul>
            )}
            {related.length > 0 && (
              <div>
                <h4 className="h4">Related projects</h4>
                <ul className="linklist">
                  {related.map((p) => (
                    <li key={p.id}><button type="button" className="textlink" onClick={() => { setActive(null); openProject(p.id) }}>{p.title}</button></li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </Modal>
    </Section>
  )
}
