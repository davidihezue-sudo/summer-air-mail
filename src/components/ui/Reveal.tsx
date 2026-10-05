import * as mo from 'framer-motion/m'
import type { ReactNode } from 'react'
import { useMotion } from '../../hooks/useMotion'

export function Reveal({ children, delay = 0, y = 28, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const { reduced } = useMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <mo.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </mo.div>
  )
}
