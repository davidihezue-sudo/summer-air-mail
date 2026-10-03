import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useActiveSection } from '../../hooks/useActiveSection'
import { goTo } from '../../utils/nav'
import { cvLink, hasValue } from '../../utils/text'
import { Modal } from '../ui/Modal'

export function Header() {
  const { content, nav, idOf } = useContent()
  const { profile } = content.portfolio
  const cv = cvLink(content.portfolio)
  const active = useActiveSection(nav.filter((n) => !n.external).map((n) => n.target))
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const signature = hasValue(profile.signature) ? profile.signature : profile.preferredName
  const top = idOf('hero') ?? 'top'
  const contactId = idOf('contact')

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    window.setTimeout(() => goTo(id, id === contactId ? 'enquiry-name' : undefined), 0)
  }

  return (
    <>
      <div ref={sentinel} className="header-sentinel" aria-hidden />
      <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="header__inner">
          <a href={`#${top}`} className="header__brand script" onClick={go(top)} aria-label={`${profile.preferredName}, back to top`}>
            {signature}
          </a>
          <nav className="header__nav" aria-label="Primary">
            {nav.map((i) =>
              i.external ? (
                <a key={i.id} href={i.target} target="_blank" rel="noopener noreferrer" className="navlink">{i.label}<span className="sr-only"> (opens in a new tab)</span></a>
              ) : (
                <a key={i.id} href={`#${i.target}`} onClick={go(i.target)} className={`navlink ${active === i.target ? 'is-active' : ''}`} aria-current={active === i.target ? 'true' : undefined}>
                  {i.label}
                </a>
              ),
            )}
            {cv && <a className="navlink navlink--cv" href={cv.href} download={cv.filename}>CV</a>}
          </nav>
          <button type="button" className="header__burger" onClick={() => setOpen(true)} aria-label="Open menu" aria-haspopup="dialog">
            <Menu aria-hidden />
          </button>
        </div>
      </header>
      <Modal open={open} onClose={() => setOpen(false)} label="Menu" className="drawer">
        <nav className="drawer__nav" aria-label="Mobile">
          <p className="script drawer__name">{signature}</p>
          {nav.map((i) =>
            i.external ? (
              <a key={i.id} href={i.target} target="_blank" rel="noopener noreferrer" className="drawer__link">{i.label}</a>
            ) : (
              <a key={i.id} href={`#${i.target}`} onClick={go(i.target)} className="drawer__link">{i.label}</a>
            ),
          )}
          {cv && <a className="btn btn--solid" href={cv.href} download={cv.filename}>Download CV</a>}
        </nav>
      </Modal>
    </>
  )
}
