import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import type { Intensity } from '../content/types'
import { useMediaQuery } from './useMediaQuery'

interface MotionState {
  /** True when motion should be replaced by static alternatives. */
  reduced: boolean
  intensity: Intensity
  finePointer: boolean
}
const Ctx = createContext<MotionState>({ reduced: false, intensity: 'full', finePointer: true })

export function MotionProvider({ intensity, children }: { intensity: Intensity; children: ReactNode }) {
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reduced = prefersReduced || intensity === 'off'
  const value = useMemo(() => ({ reduced, intensity, finePointer }), [reduced, intensity, finePointer])
  return (
    <Ctx.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
    </Ctx.Provider>
  )
}

export const useMotion = () => useContext(Ctx)
