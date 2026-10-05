import { useEffect, useRef, useState } from 'react'
import { useMotion } from '../../hooks/useMotion'

/** Counts up to a number once it scrolls into view. A few lines of its own, so the page does not need an animation library for it. */
export function AnimatedNumber({ value, locale, prefix = '', suffix = '' }: { value: number; locale: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const { reduced } = useMotion()
  const [n, setN] = useState(reduced ? value : 0)
  const decimals = Number.isInteger(value) ? 0 : 1

  useEffect(() => {
    if (reduced) {
      setN(value)
      return
    }
    const el = ref.current
    if (!el) return
    let frame = 0
    const run = () => {
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400)
        setN(value * (1 - (1 - t) ** 3))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }
    if (typeof IntersectionObserver === 'undefined') { setN(value); return }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { io.disconnect(); run() } })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(frame) }
  }, [value, reduced])

  return (
    <span ref={ref}>
      {prefix}
      {n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}
