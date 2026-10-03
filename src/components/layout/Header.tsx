import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useActiveSection } from '../../hooks/useActiveSection'
import { goTo } from '../../utils/nav'
import { hasValue } from '../../utils/text'
import { Modal } from '../ui/Modal'

export function useNavItems() {
  const { visible } = useContent()
  const items: { id: string; label: string }[] = []
  if (visible.work) items.push({ id: 'work', label: 'Work' })
  if (visible.caseStudies) items.push({ id: 'case-studies', label: 'Case studies' })
  if (visible.services) items.push({ id: 'services', label: 'Services' })
  if (visible.about) items.push({ id: 'about', label: 'About' })
  if (visible.contact) items.push({ id: 'contact', label: 'Contact' })
  return items
}

export function Header() {
  const { content } = useContent()
  const { profile } = content.portfolio
  const items = useNavItems()
  const active = useActiveSection(items.map((i) => i.id))
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const signature = hasValue(profile.signature) ? profile.signature : profile.preferredName

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const nav = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    window.setTimeout(() => goTo(id, id === 'contact' ? 'enquiry-name' : undefined), 0)
  }

  return (
    <>
      <div ref={sentinel} className="header-sentinel" aria-hidden />
      <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="header__inner">
          <a href="#top" className="header__brand script" onClick={nav('top')} aria-label={`${profile.preferredName}, back to top`}>
            {signature}
          </a>
          <nav className="header__nav" aria-label="Primary">
            {items.map((i) => (
              <a key={i.id} href={`#${i.id}`} onClick={nav(i.id)} className={`navlink ${active === i.id ? 'is-active' : ''}`} aria-current={active === i.id ? 'true' : undefined}>
                {i.label}
              </a>
            ))}
          </nav>
          <button type="button" className="header__burger" onClick={() => setOpen(true)} aria-label="Open menu" aria-haspopup="dialog">
            <Menu aria-hidden />
          </button>
        </div>
      </header>
      <Modal open={open} onClose={() => setOpen(false)} label="Menu" className="drawer">
        <nav className="drawer__nav" aria-label="Mobile">
          <p className="script drawer__name">{signature}</p>
          {items.map((i) => (
            <a key={i.id} href={`#${i.id}`} onClick={nav(i.id)} className="drawer__link">
              {i.label}
            </a>
          ))}
          {hasValue(profile.cvFile) && (
            <a className="btn btn--solid" href={profile.cvFile} download>
              Download CV
            </a>
          )}
        </nav>
      </Modal>
    </>
  )
}
