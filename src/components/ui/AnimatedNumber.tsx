import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'
import { useMotion } from '../../hooks/useMotion'

export function AnimatedNumber({ value, locale, prefix = '', suffix = '' }: { value: number; locale: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const { reduced } = useMotion()
  const [n, setN] = useState(reduced ? value : 0)
  const decimals = Number.isInteger(value) ? 0 : 1

  useEffect(() => {
    if (reduced) {
      setN(value)
      return
    }
    if (!inView) return
    const controls = animate(0, value, { duration: 1.4, ease: 'easeOut', onUpdate: (v) => setN(v) })
    return () => controls.stop()
  }, [inView, value, reduced])

  return (
    <span ref={ref}>
      {prefix}
      {n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}
