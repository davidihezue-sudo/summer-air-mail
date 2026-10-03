import { useEffect, useRef } from 'react'
import { Surfer } from '../ui/art'

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      el.style.setProperty('--sp', max > 0 ? String(Math.min(1, window.scrollY / max)) : '0')
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return (
    <div ref={ref} className="progress" aria-hidden>
      <div className="progress__bar" />
      <div className="progress__surfer"><Surfer /></div>
    </div>
  )
}
