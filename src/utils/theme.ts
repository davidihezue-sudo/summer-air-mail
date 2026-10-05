import type { Portfolio } from '../content/types'
import { darkPalette, type ResolvedTheme } from '../themes/seasonManager'
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

const RADIUS = { sharp: '4px', soft: '18px', round: '30px' }
/** The corner radius for each button shape. Shapes that are drawn with clipping or masks (slanted, cut, ticket, perforated) are handled in base.css. */
const BUTTON: Record<string, string> = {
  pill: '999px', rounded: '12px', square: '2px', soft: '6px', slanted: '0', perforated: '2px', outlined: '999px', underline: '0',
  airmail: '3px', hard: '8px', cut: '0', pebble: '28px 12px 28px 12px', tab: '14px 14px 0 0', ticket: '6px', glass: '999px', arrow: '999px',
}
const DENSITY = { compact: 0.78, comfortable: 1, spacious: 1.28 }
const BORDER = { thin: '1px', normal: '1.5px', bold: '3px' }
const SHADOW = { none: 'none', soft: '0 18px 40px -18px rgb(23 50 63 / 0.45)', strong: '0 24px 50px -14px rgb(23 50 63 / 0.7)' }

/** Writes the resolved season and the owner's design settings to CSS variables and data attributes. Safe to call repeatedly. */
export function applyTheme(resolved: ResolvedTheme, portfolio: Portfolio, plan: MotionPlan, scheme: 'light' | 'dark' = 'light') {
  const root = document.documentElement
  const dark = scheme === 'dark' ? darkPalette(resolved.colors) : null
  const colors = dark?.colors ?? resolved.colors
  const derived = dark ? dark.derived : resolved.derived
  const { theme, fonts } = resolved
  const d = portfolio.design
  for (const t of TOKENS) {
    root.style.setProperty(`--c-${t}`, colors[t])
    root.style.setProperty(`--l-${t}`, resolved.colors[t]) // the season's own light colours, for dark bands in dark mode
  }
  root.style.setProperty('--c-red-text', derived.redText)
  root.style.setProperty('--c-sea-deep', derived.seaDeep)
  root.style.setProperty('--c-sea-text', derived.seaText)
  root.style.setProperty('--c-green-text', derived.greenText)
  root.style.setProperty('--deep', dark?.deep ?? colors.ink)
  root.style.setProperty('--on-deep', dark?.onDeep ?? colors.paper)
  root.style.setProperty('--font-display', fonts.display || portfolio.theme.fonts.display)
  root.style.setProperty('--font-script', fonts.script || portfolio.theme.fonts.script)
  root.style.setProperty('--font-body', fonts.body || portfolio.theme.fonts.body)
  root.style.setProperty('--hero-bg', dark ? `radial-gradient(120% 90% at 78% 30%, ${colors.butter} 0%, ${colors.sand} 70%, ${colors.paper} 100%)` : theme.heroBg)
  root.style.setProperty('--sun', theme.sun)
  root.style.setProperty('--texture', noiseTexture(theme.textureFreq))
  root.style.setProperty('--texture-opacity', resolved.texture && !dark ? String(theme.textureOpacity) : '0')
  root.style.setProperty('--motion-speed', String(plan.speed))
  root.style.setProperty('--radius', RADIUS[d.radius] ?? RADIUS.soft)
  root.style.setProperty('--btn-radius', BUTTON[d.buttons] ?? BUTTON.pill)
  root.style.setProperty('--density', String(DENSITY[d.density] ?? 1))
  root.style.setProperty('--bw', BORDER[d.borderWeight] ?? BORDER.normal)
  root.style.setProperty('--shadow', SHADOW[d.shadow] ?? SHADOW.soft)
  root.style.setProperty('--surface', dark ? `color-mix(in srgb, ${colors.ink} 9%, ${colors.paper})` : '#ffffff')
  root.style.setProperty('--surface-soft', dark ? `color-mix(in srgb, ${colors.ink} 8%, transparent)` : 'rgb(255 255 255 / .6)')
  root.style.setProperty('--error-bg', dark ? '#3a1519' : '#fff1f1')
  root.style.fontSize = `${Math.round(Math.min(1.4, Math.max(0.8, d.fontScale || 1)) * 100)}%`
  const bg = resolved.override.heroBackground
  if (bg && SAFE_URL.test(bg)) root.style.setProperty('--hero-bg-image', `url("${bg}")`)
  else root.style.removeProperty('--hero-bg-image')
  root.dataset.season = resolved.season
  if (resolved.celebration) root.dataset.celebration = resolved.celebration.id
  else delete root.dataset.celebration
  root.dataset.scheme = scheme
  root.style.colorScheme = scheme
  root.dataset.professional = portfolio.theme.professional
  root.dataset.motion = plan.level
  root.dataset.border = portfolio.theme.borderStyle
  root.dataset.divider = theme.divider
  root.dataset.heroBg = portfolio.hero.background
  root.dataset.heroDecor = String(portfolio.hero.decorativeElements)
  root.dataset.headingCase = d.headingCase
  root.dataset.dialogTransition = d.dialogTransition
  root.dataset.buttons = d.buttons
  root.dataset.dialogSpeed = d.dialogSpeed
  root.dataset.cards = d.cards
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.sand)
}
