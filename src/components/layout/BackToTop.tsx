import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useContent } from '../../hooks/useContent'

/** Appears after the visitor has scrolled a screen or two. */
export function BackToTop() {
  const on = useContent().content.portfolio.extras.backToTop
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!on) return
    const f = () => setShow(window.scrollY > window.innerHeight * 1.2)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [on])
  if (!on || !show) return null
  return <button type="button" className="totop" aria-label="Back to the top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp aria-hidden size={20} /></button>
}
