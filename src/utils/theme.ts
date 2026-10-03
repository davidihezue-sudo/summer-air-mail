import type { Portfolio } from '../content/types'
import type { ResolvedTheme } from '../themes/seasonManager'
import type { MotionPlan } from '../motion/motion'

const TOKENS = ['stone', 'green', 'red', 'sand', 'ink', 'sea', 'aqua', 'pink', 'sage', 'butter', 'peach', 'sky', 'paper'] as const
export const TONE_NAMES: readonly string[] = TOKENS

export function noiseTexture(freq: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.55 0'/></filter><rect width='180' height='180' filter='url(#n)'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const SAFE_URL = /^(\/[\w\-./%]+|https:\/\/[\w\-./%?=&:+~]+)$/

/** Resolves a colour field: a palette name becomes a CSS variable, a hex stays a hex, anything else is ignored. */
export function toneValue(value: string | undefined): string {
  if (!value) return ''
  if (TOKENS.includes(value as never)) return `var(--c-${value})`
  if (/^#[0-9a-f]{6}$/i.test(value)) return value
  return ''
}

/** Writes the resolved season to CSS variables and data attributes. Safe to call repeatedly. */
export function applyTheme(resolved: ResolvedTheme, portfolio: Portfolio, plan: MotionPlan) {
  const root = document.documentElement
  const { colors, derived, theme, fonts } = resolved
  for (const t of TOKENS) root.style.setProperty(`--c-${t}`, colors[t])
  root.style.setProperty('--c-red-text', derived.redText)
  root.style.setProperty('--c-sea-deep', derived.seaDeep)
  root.style.setProperty('--c-green-text', derived.greenText)
  root.style.setProperty('--font-display', fonts.display || portfolio.theme.fonts.display)
  root.style.setProperty('--font-script', fonts.script || portfolio.theme.fonts.script)
  root.style.setProperty('--font-body', fonts.body || portfolio.theme.fonts.body)
  root.style.setProperty('--hero-bg', theme.heroBg)
  root.style.setProperty('--sun', theme.sun)
  root.style.setProperty('--texture', noiseTexture(theme.textureFreq))
  root.style.setProperty('--texture-opacity', resolved.texture ? String(theme.textureOpacity) : '0')
  root.style.setProperty('--motion-speed', String(plan.speed))
  const bg = resolved.override.heroBackground
  if (bg && SAFE_URL.test(bg)) root.style.setProperty('--hero-bg-image', `url("${bg}")`)
  else root.style.removeProperty('--hero-bg-image')
  root.dataset.season = resolved.season
  root.dataset.professional = portfolio.theme.professional
  root.dataset.motion = plan.level
  root.dataset.border = portfolio.theme.borderStyle
  root.dataset.divider = theme.divider
  root.dataset.heroBg = portfolio.hero.background
  root.dataset.heroDecor = String(portfolio.hero.decorativeElements)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.sand)
}
