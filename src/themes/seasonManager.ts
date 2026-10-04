import type { Level, SeasonMode, SeasonName, SeasonOverride, SeasonSettings, ThemeColors } from '../content/types'
import { THEMES, SEASON_ORDER } from './index'
import type { SeasonTheme } from './types'

export const DEFAULT_RANGES: SeasonSettings['ranges'] = {
  spring: { month: 3, day: 20 },
  summer: { month: 6, day: 21 },
  autumn: { month: 9, day: 22 },
  winter: { month: 12, day: 21 },
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export function validDate(month: number, day: number): boolean {
  return Number.isInteger(month) && Number.isInteger(day) && month >= 1 && month <= 12 && day >= 1 && day <= DAYS_IN_MONTH[month - 1]
}

const key = (m: number, d: number) => m * 100 + d

/**
 * Season for a date. Each season starts on its configured date and lasts until the next
 * configured start. Invalid or duplicate boundaries fall back to the defaults so the
 * site can never end up without a season.
 */
export function detectSeason(date: Date, ranges: SeasonSettings['ranges']): SeasonName {
  const safe = rangesAreUsable(ranges) ? ranges : DEFAULT_RANGES
  const now = key(date.getMonth() + 1, date.getDate())
  const starts = SEASON_ORDER.map((s) => ({ s, k: key(safe[s].month, safe[s].day) })).sort((a, b) => a.k - b.k)
  let current = starts[starts.length - 1].s
  for (const st of starts) if (st.k <= now) current = st.s
  return current
}

export function rangesAreUsable(ranges: SeasonSettings['ranges'] | undefined): boolean {
  if (!ranges) return false
  const keys = SEASON_ORDER.map((s) => ranges[s]).map((r) => (r && validDate(r.month, r.day) ? key(r.month, r.day) : -1))
  return keys.every((k) => k > 0) && new Set(keys).size === 4
}

export function resolveSeason(settings: Pick<SeasonSettings, 'mode' | 'ranges'>, date = new Date()): SeasonName {
  const mode: SeasonMode = settings.mode
  return mode === 'auto' || !SEASON_ORDER.includes(mode as SeasonName) ? detectSeason(date, settings.ranges) : (mode as SeasonName)
}

const HEX = /^#[0-9a-f]{6}$/i
const FONT_SAFE = /^[A-Za-z0-9 ,'"-]{1,160}$/

export const FONT_CHOICES = [
  { label: 'Theme default', value: '' },
  { label: 'Italiana (editorial display)', value: "'Italiana', 'Didot', 'Bodoni 72', Georgia, serif" },
  { label: 'Georgia (classic serif)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Pinyon Script (signature)', value: "'Pinyon Script', 'Snell Roundhand', cursive" },
  { label: 'Figtree (clean sans)', value: "'Figtree Variable', 'Figtree', system-ui, sans-serif" },
  { label: 'System sans', value: 'system-ui, -apple-system, Segoe UI, sans-serif' },
]

export function safeFont(value: string | undefined): string {
  return value && FONT_SAFE.test(value) ? value : ''
}

export function emptyOverride(): SeasonOverride {
  return { colors: {}, decorations: {}, intensity: 'standard', fonts: {}, texture: true, heroCutout: null, heroFlowers: null, heroBackground: '', decorImage: '' }
}

export interface ResolvedTheme {
  season: SeasonName
  theme: SeasonTheme
  colors: ThemeColors
  /** Colours derived for readable text. See deriveTokens. */
  derived: { redText: string; seaDeep: string; seaText: string; greenText: string }
  decorations: string[]
  intensity: Level
  texture: boolean
  fonts: { display?: string; script?: string; body?: string }
  override: SeasonOverride
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

/** sRGB mix, matching CSS color-mix(in srgb). `amount` is the share of `a`. */
export function mixHex(a: string, b: string, amount: number): string {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return toHex(x.map((v, i) => v * amount + y[i] * (1 - amount)))
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Text-safe variants of accent colours so small labels stay readable on every season. */
export function deriveTokens(c: ThemeColors) {
  return {
    redText: mixHex(c.red, c.ink, 0.58),
    seaDeep: mixHex(c.sea, c.ink, 0.62),
    greenText: mixHex(c.green, c.ink, 0.8),
    seaText: mixHex(c.sea, c.ink, 0.62),
  }
}

/** A dark palette derived from any season's palette (including owner overrides), so every season has a dark mode. */
export function darkPalette(c: ThemeColors) {
  const black = '#000000'
  const white = '#ffffff'
  const dim = (hex: string) => mixHex(hex, black, 0.42)
  const ink = mixHex(c.paper, white, 0.85)
  const colors: ThemeColors = {
    ...c,
    paper: mixHex(c.ink, black, 0.62),
    sand: mixHex(c.ink, black, 0.8),
    ink,
    sea: dim(c.sea), aqua: dim(c.aqua), pink: dim(c.pink), sage: dim(c.sage), butter: dim(c.butter), peach: dim(c.peach), sky: dim(c.sky),
  }
  return {
    colors,
    derived: {
      redText: mixHex(c.red, white, 0.45),
      seaDeep: mixHex(c.sea, black, 0.42),
      seaText: mixHex(c.sea, white, 0.4),
      greenText: mixHex(c.sage, white, 0.5),
    },
    /** Dark bands (footer, case studies, tools): a deeper surface with the light text colour. */
    deep: mixHex(c.ink, black, 0.45),
    onDeep: ink,
  }
}

export function resolveTheme(season: SeasonName, settings: SeasonSettings): ResolvedTheme {
  const theme = THEMES[season]
  const override = { ...emptyOverride(), ...(settings.overrides?.[season] ?? {}) }
  const colors = { ...theme.colors }
  for (const [k, v] of Object.entries(override.colors ?? {})) {
    if (k in colors && typeof v === 'string' && HEX.test(v)) (colors as Record<string, string>)[k] = v
  }
  const decorations = theme.decorations
    .filter((d) => (d.id in (override.decorations ?? {}) ? override.decorations[d.id] : d.defaultOn))
    .map((d) => d.id)
  return {
    season,
    theme,
    colors,
    derived: deriveTokens(colors),
    decorations,
    intensity: override.intensity ?? theme.defaultIntensity,
    texture: override.texture !== false,
    fonts: { display: safeFont(override.fonts?.display), script: safeFont(override.fonts?.script), body: safeFont(override.fonts?.body) },
    override,
  }
}
