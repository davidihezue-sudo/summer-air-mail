import type { CursorSettings, CursorStyle, Intensity, ProfessionalIntensity } from '../content/types'

export const CURSOR_STYLES: { value: CursorStyle; label: string; help: string; shape: boolean }[] = [
  { value: 'bubbles', label: 'Bubbles', help: 'Soft bubbles drift up from the pointer.', shape: false },
  { value: 'water', label: 'Water drop', help: 'A translucent drop that sends out ripples as it moves.', shape: true },
  { value: 'ripple', label: 'Ripples', help: 'Rings spread out from where the pointer travels.', shape: false },
  { value: 'ring', label: 'Ring', help: 'A thin ring that glides behind the pointer.', shape: true },
  { value: 'dot', label: 'Circle', help: 'A solid circle that follows the pointer.', shape: true },
  { value: 'blob', label: 'Blob', help: 'A squishy circle that stretches as you move fast.', shape: true },
  { value: 'spotlight', label: 'Spotlight', help: 'A wide soft pool of light.', shape: true },
  { value: 'glow', label: 'Halo glow', help: 'A tight coloured halo.', shape: true },
  { value: 'comet', label: 'Comet', help: 'A tapering tail behind a bright head.', shape: false },
  { value: 'sparkles', label: 'Sparkles', help: 'Little four point stars fall away.', shape: false },
  { value: 'crosshair', label: 'Crosshair', help: 'Fine lines through a small ring.', shape: true },
  { value: 'seasonal', label: 'Seasonal', help: 'Petals in spring, glints in summer, leaves in autumn, snow in winter.', shape: false },
  { value: 'emoji', label: 'Emoji or symbol', help: 'Any character you choose follows the pointer.', shape: true },
  { value: 'image', label: 'Your own image', help: 'A transparent PNG or WebP follows the pointer.', shape: true },
]

const RANK: Record<ProfessionalIntensity, number> = { creative: 0, balanced: 1, professional: 2 }

/** Should the pointer effect run? It never runs when the visitor or the site asks for calm. */
export function cursorAllowed(c: CursorSettings, input: {
  professional: ProfessionalIntensity
  global: Intensity
  prefersReduced: boolean
  finePointer: boolean
}): boolean {
  if (!c.enabled || input.prefersReduced || input.global === 'off' || !input.finePointer) return false
  return RANK[input.professional] <= RANK[c.showIn]
}

/** Which styles draw a single shape that stands in for the pointer. */
export const isShapeStyle = (s: CursorStyle) => CURSOR_STYLES.find((x) => x.value === s)?.shape ?? false

/** Reads "r,g,b" from a hex colour, tone name (resolved through CSS) or the season default. */
export function resolveRgb(color: string, fallback: string, read: (token: string) => string = () => ''): string {
  const hex = (h: string) => {
    const m = /^#([0-9a-f]{6})$/i.exec(h.trim())
    return m ? `${parseInt(m[1].slice(0, 2), 16)},${parseInt(m[1].slice(2, 4), 16)},${parseInt(m[1].slice(4), 16)}` : ''
  }
  if (!color || color === 'auto') return fallback
  return hex(color) || hex(read(color)) || fallback
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo))
