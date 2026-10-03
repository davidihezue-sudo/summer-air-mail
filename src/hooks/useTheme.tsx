import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { useContent } from './useContent'
import { useMediaQuery } from './useMediaQuery'
import { resolveSeason, resolveTheme, type ResolvedTheme } from '../themes/seasonManager'
import { resolveMotion, type MotionPlan } from '../motion/motion'
import { applyTheme } from '../utils/theme'
import type { Level, ProfessionalIntensity, SeasonName } from '../content/types'
import type { SeasonCopy } from '../themes/types'

const NEUTRAL: SeasonCopy = {
  servicesTitle: 'Services',
  workTitle: 'Selected work',
  toolsTitle: 'Tools and platforms',
  contentTitle: 'Social and video content',
  websitesTitle: 'Websites and digital projects',
  testimonialsTitle: 'Recommendations',
  sticker: '',
}

interface ThemeState {
  season: SeasonName
  resolved: ResolvedTheme
  plan: MotionPlan
  professional: ProfessionalIntensity
  /** Legacy shape used by older components. */
  reduced: boolean
  finePointer: boolean
  copy: SeasonCopy
}

const Ctx = createContext<ThemeState | null>(null)

export interface ThemePreview {
  season?: SeasonName
  professional?: ProfessionalIntensity
  intensity?: Level
}

export function ThemeProvider({ preview, children }: { preview?: ThemePreview; children: ReactNode }) {
  const { content } = useContent()
  const { theme, seasons, hero } = content.portfolio
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const season = preview?.season ?? resolveSeason(seasons)
  const professional = preview?.professional ?? theme.professional

  const state = useMemo<ThemeState>(() => {
    const resolved = resolveTheme(season, seasons)
    const heroLevel = hero.animation === 'inherit' ? resolved.intensity : hero.animation
    const plan = resolveMotion({
      global: theme.animationIntensity,
      professional,
      season: preview?.intensity ?? (heroLevel as Level),
      prefersReduced,
      finePointer,
    })
    return {
      season, resolved, plan, professional,
      reduced: plan.reduced, finePointer,
      copy: professional === 'professional' ? NEUTRAL : resolved.theme.copy,
    }
  }, [season, seasons, hero.animation, theme.animationIntensity, professional, prefersReduced, finePointer, preview?.intensity])

  const first = useRef(true)
  useEffect(() => {
    const apply = () => applyTheme(state.resolved, content.portfolio, state.plan)
    if (first.current) {
      first.current = false
      apply()
      return
    }
    const mode = seasons.transition
    const root = document.documentElement
    if (mode === 'none' || mode === 'immediate' || state.plan.reduced) return apply()
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (mode === 'crossfade' && doc.startViewTransition) {
      doc.startViewTransition(apply)
      return
    }
    root.classList.add('theme-fading')
    apply()
    const t = window.setTimeout(() => root.classList.remove('theme-fading'), 900)
    return () => window.clearTimeout(t)
  }, [state, content.portfolio, seasons.transition])

  return (
    <Ctx.Provider value={state}>
      <MotionConfig reducedMotion={state.plan.reduced ? 'always' : 'never'}>{children}</MotionConfig>
    </Ctx.Provider>
  )
}

export function useTheme(): ThemeState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme must be used inside ThemeProvider')
  return v
}
