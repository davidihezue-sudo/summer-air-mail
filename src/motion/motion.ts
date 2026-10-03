import type { Intensity, Level, ProfessionalIntensity } from '../content/types'

export interface MotionPlan {
  /** Effective level after the global cap, professional cap, season setting and reduced motion. */
  level: Level
  reduced: boolean
  /** Number of decorative particles in total. */
  particles: number
  tilt: boolean
  breakout: boolean
  tide: boolean
  cursorTrail: boolean
  swing: boolean
  float: boolean
  /** Multiplier applied to durations, written to --motion-speed. */
  speed: number
}

const RANK: Record<Level, number> = { none: 0, subtle: 1, standard: 2, expressive: 3 }
const BY_RANK: Level[] = ['none', 'subtle', 'standard', 'expressive']

const GLOBAL_CAP: Record<Intensity, Level> = { off: 'none', subtle: 'subtle', full: 'expressive' }
const PRO_CAP: Record<ProfessionalIntensity, Level> = { creative: 'expressive', balanced: 'standard', professional: 'subtle' }

const PARTICLES: Record<Level, number> = { none: 0, subtle: 6, standard: 12, expressive: 20 }

export function resolveMotion(input: {
  global: Intensity
  professional: ProfessionalIntensity
  season: Level
  prefersReduced: boolean
  /** Fine pointer devices only (cursor effects). */
  finePointer: boolean
}): MotionPlan {
  const cap = Math.min(RANK[GLOBAL_CAP[input.global]], RANK[PRO_CAP[input.professional]], RANK[input.season])
  const level = input.prefersReduced ? 'none' : BY_RANK[cap]
  const r = RANK[level]
  const professional = input.professional === 'professional'
  return {
    level,
    reduced: input.prefersReduced || level === 'none',
    particles: professional ? 0 : PARTICLES[level],
    tilt: r >= 1,
    breakout: r >= 1,
    tide: r >= 2 && !professional,
    cursorTrail: r >= 3 && input.finePointer && input.professional === 'creative',
    swing: r >= 1 && !professional,
    float: r >= 1 && !professional,
    speed: level === 'subtle' ? 1.35 : level === 'expressive' ? 0.9 : 1,
  }
}
