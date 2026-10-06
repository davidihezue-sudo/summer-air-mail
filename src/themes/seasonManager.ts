import type { Celebration, Level, SeasonMode, SeasonName, SeasonOverride, SeasonSettings, ThemeColors } from '../content/types'
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

export type FontStyle = 'script' | 'display' | 'serif' | 'sans' | 'system'
export interface FontChoice { label: string; value: string; style?: FontStyle }
const stack = (family: string, fallback: string) => `'${family}', ${fallback}`
const SCRIPT_FALLBACK = "'Snell Roundhand', cursive"
const SERIF_FALLBACK = "Georgia, 'Times New Roman', serif"
const SANS_FALLBACK = 'system-ui, sans-serif'

/** Every font an owner can choose, by what it is like. Italiana, Pinyon Script and Figtree are the originals; the rest are free fonts bundled with the site. */
export const FONT_CHOICES: FontChoice[] = [
  { label: 'Theme default', value: '' },
  { label: 'Italiana (editorial display)', value: "'Italiana', 'Didot', 'Bodoni 72', Georgia, serif", style: 'display' },
  { label: 'Pinyon Script (signature)', value: "'Pinyon Script', 'Snell Roundhand', cursive", style: 'script' },
  { label: 'Figtree (clean sans)', value: "'Figtree Variable', 'Figtree', system-ui, sans-serif", style: 'sans' },
  // Handwritten and signature scripts
  { label: 'Great Vibes (flowing script)', value: stack('Great Vibes', SCRIPT_FALLBACK), style: 'script' },
  { label: 'Allura (elegant script)', value: stack('Allura', SCRIPT_FALLBACK), style: 'script' },
  { label: 'Parisienne (romantic script)', value: stack('Parisienne', SCRIPT_FALLBACK), style: 'script' },
  { label: 'Sacramento (thin monoline script)', value: stack('Sacramento', SCRIPT_FALLBACK), style: 'script' },
  { label: 'Alex Brush (brush script)', value: stack('Alex Brush', SCRIPT_FALLBACK), style: 'script' },
  { label: 'Satisfy (casual brush script)', value: stack('Satisfy', SCRIPT_FALLBACK), style: 'script' },
  { label: 'Playball (sporty script)', value: stack('Playball', SCRIPT_FALLBACK), style: 'script' },
  { label: 'Dancing Script (lively script)', value: stack('Dancing Script Variable', SCRIPT_FALLBACK), style: 'script' },
  // Display and serif
  { label: 'Playfair Display (high contrast serif)', value: stack('Playfair Display Variable', SERIF_FALLBACK), style: 'display' },
  { label: 'Cormorant Garamond (refined serif)', value: stack('Cormorant Garamond', SERIF_FALLBACK), style: 'display' },
  { label: 'Cinzel (classical capitals)', value: stack('Cinzel Variable', SERIF_FALLBACK), style: 'display' },
  { label: 'DM Serif Display (bold serif)', value: stack('DM Serif Display', SERIF_FALLBACK), style: 'display' },
  { label: 'Marcellus (graceful roman)', value: stack('Marcellus', SERIF_FALLBACK), style: 'display' },
  { label: 'Lora (readable serif)', value: stack('Lora Variable', SERIF_FALLBACK), style: 'serif' },
  { label: 'Georgia (classic serif)', value: "Georgia, 'Times New Roman', serif", style: 'serif' },
  // Sans serif
  { label: 'Inter (neutral sans)', value: stack('Inter Variable', SANS_FALLBACK), style: 'sans' },
  { label: 'Poppins (geometric sans)', value: stack('Poppins', SANS_FALLBACK), style: 'sans' },
  { label: 'Montserrat (modern sans)', value: stack('Montserrat Variable', SANS_FALLBACK), style: 'sans' },
  { label: 'DM Sans (friendly sans)', value: stack('DM Sans Variable', SANS_FALLBACK), style: 'sans' },
  { label: 'Nunito (rounded sans)', value: stack('Nunito Variable', SANS_FALLBACK), style: 'sans' },
  { label: 'System sans', value: 'system-ui, -apple-system, Segoe UI, sans-serif', style: 'system' },
]

/** The choices that suit a job: headings take display, serif and sans; the signature takes scripts and display; body text takes sans and serif. */
export const fontOptions = (styles: FontStyle[], withDefault = false) => FONT_CHOICES.filter((f) => (f.value ? !!f.style && styles.includes(f.style) : withDefault))
export const HEADING_FONTS: FontStyle[] = ['display', 'serif', 'sans', 'script']
export const SCRIPT_FONTS: FontStyle[] = ['script', 'display', 'serif']
export const BODY_FONTS: FontStyle[] = ['sans', 'serif', 'system']

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
  /** The celebration in effect, if any. Its colours and decorations are already folded into this theme. */
  celebration: { id: string; name: string; greeting: string } | null
}

/** Decorations a celebration may use. Kept here so the theme does not depend on the celebrations list. */
const FESTIVE_DECORATIONS = ['snow', 'lights', 'stars', 'hearts', 'confetti', 'fireworks', 'petals', 'leaves', 'glints']

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
  const dim = (hex: string) => mixHex(hex, black, 0.34)
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
      redText: mixHex(c.red, white, 0.28),
      seaDeep: mixHex(c.sea, black, 0.42),
      seaText: mixHex(c.sea, white, 0.3),
      greenText: mixHex(c.sage, white, 0.4),
    },
    /** Dark bands (footer, case studies, tools): a deeper surface with the light text colour. */
    deep: mixHex(c.ink, black, 0.45),
    onDeep: ink,
  }
}

export function resolveTheme(season: SeasonName, settings: SeasonSettings, festive: Celebration | null = null): ResolvedTheme {
  const theme = THEMES[season]
  const override = { ...emptyOverride(), ...(settings.overrides?.[season] ?? {}) }
  const colors = { ...theme.colors }
  // The season's own colours first, then the celebration's on top.
  for (const source of [override.colors, festive?.colors]) {
    for (const [k, v] of Object.entries(source ?? {})) {
      if (k in colors && typeof v === 'string' && HEX.test(v)) (colors as Record<string, string>)[k] = v
    }
  }
  // A celebration replaces the season's falling decorations (no autumn leaves at Christmas).
  const decorations = festive
    ? (festive.decorations ?? []).filter((d) => FESTIVE_DECORATIONS.includes(d))
    : theme.decorations
      .filter((d) => (d.id in (override.decorations ?? {}) ? override.decorations[d.id] : d.defaultOn))
      .map((d) => d.id)
  const festiveLevel = festive && ['none', 'subtle', 'standard', 'expressive'].includes(festive.intensity) ? (festive.intensity as Level) : null
  return {
    season,
    theme,
    colors,
    derived: deriveTokens(colors),
    decorations,
    celebration: festive ? { id: festive.id, name: festive.name, greeting: String(festive.greeting ?? '').trim() } : null,
    intensity: festiveLevel ?? override.intensity ?? theme.defaultIntensity,
    texture: override.texture !== false,
    fonts: { display: safeFont(override.fonts?.display), script: safeFont(override.fonts?.script), body: safeFont(override.fonts?.body) },
    override,
  }
}
