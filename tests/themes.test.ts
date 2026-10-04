import { describe, expect, it } from 'vitest'
import { DEFAULT_RANGES, contrast, detectSeason, rangesAreUsable, resolveSeason, resolveTheme, safeFont, emptyOverride, deriveTokens } from '../src/themes/seasonManager'
import { THEMES, SEASON_ORDER } from '../src/themes'
import { resolveMotion } from '../src/motion/motion'
import { baseContent } from '../src/content/bundle'

const d = (m: number, day: number) => new Date(2026, m - 1, day)

describe('season detection', () => {
  it('uses the default boundaries', () => {
    expect(detectSeason(d(1, 15), DEFAULT_RANGES)).toBe('winter')
    expect(detectSeason(d(3, 19), DEFAULT_RANGES)).toBe('winter')
    expect(detectSeason(d(3, 20), DEFAULT_RANGES)).toBe('spring')
    expect(detectSeason(d(6, 20), DEFAULT_RANGES)).toBe('spring')
    expect(detectSeason(d(6, 21), DEFAULT_RANGES)).toBe('summer')
    expect(detectSeason(d(9, 21), DEFAULT_RANGES)).toBe('summer')
    expect(detectSeason(d(9, 22), DEFAULT_RANGES)).toBe('autumn')
    expect(detectSeason(d(12, 20), DEFAULT_RANGES)).toBe('autumn')
    expect(detectSeason(d(12, 21), DEFAULT_RANGES)).toBe('winter')
    expect(detectSeason(d(12, 31), DEFAULT_RANGES)).toBe('winter')
  })
  it('follows custom boundaries, including southern hemisphere dates', () => {
    const south = { spring: { month: 9, day: 22 }, summer: { month: 12, day: 21 }, autumn: { month: 3, day: 20 }, winter: { month: 6, day: 21 } }
    expect(detectSeason(d(1, 10), south)).toBe('summer')
    expect(detectSeason(d(4, 1), south)).toBe('autumn')
    expect(detectSeason(d(7, 4), south)).toBe('winter')
    expect(detectSeason(d(10, 4), south)).toBe('spring')
    const early = { ...DEFAULT_RANGES, summer: { month: 5, day: 1 } }
    expect(detectSeason(d(5, 2), early)).toBe('summer')
  })
  it('falls back to defaults when boundaries are invalid or duplicated', () => {
    const bad = { ...DEFAULT_RANGES, spring: { month: 2, day: 31 } }
    expect(rangesAreUsable(bad)).toBe(false)
    expect(detectSeason(d(7, 1), bad)).toBe('summer')
    const dup = { ...DEFAULT_RANGES, summer: { month: 3, day: 20 } }
    expect(rangesAreUsable(dup)).toBe(false)
  })
  it('manual mode overrides the date and auto follows it', () => {
    const s = { mode: 'winter' as const, ranges: DEFAULT_RANGES }
    expect(resolveSeason(s, d(7, 1))).toBe('winter')
    expect(resolveSeason({ ...s, mode: 'auto' }, d(7, 1))).toBe('summer')
  })
})

describe('theme resolution', () => {
  it('has four complete themes and keeps the original summer palette', () => {
    expect(SEASON_ORDER).toEqual(['spring', 'summer', 'autumn', 'winter'])
    expect(THEMES.summer.colors.sand).toBe('#EED9B4')
    expect(THEMES.summer.colors.green).toBe('#055C2F')
    for (const s of SEASON_ORDER) expect(Object.keys(THEMES[s].colors)).toHaveLength(13)
  })
  it('applies colour, decoration and font overrides but rejects unsafe values', () => {
    const settings = {
      ...baseContent.portfolio.seasons,
      overrides: { ...baseContent.portfolio.seasons.overrides, autumn: { ...emptyOverride(), colors: { red: '#112233', sand: 'url(x)' }, decorations: { leaves: false }, fonts: { display: 'Georgia, serif', body: 'x;}body{display:none' } } },
    }
    const r = resolveTheme('autumn', settings)
    expect(r.colors.red).toBe('#112233')
    expect(r.colors.sand).toBe(THEMES.autumn.colors.sand)
    expect(r.decorations).not.toContain('leaves')
    expect(r.fonts.display).toBe('Georgia, serif')
    expect(r.fonts.body).toBe('')
    expect(safeFont('a;b')).toBe('')
  })
})

describe('colour contrast', () => {
  const ink = (c: string, bg: string) => contrast(c, bg)
  for (const season of SEASON_ORDER) {
    const c = THEMES[season].colors
    const t = deriveTokens(c)
    it(`${season}: body text is readable on every light section tone`, () => {
      for (const tone of ['sand', 'sky', 'aqua', 'butter', 'pink', 'peach', 'sage', 'paper'] as const) {
        expect(ink(c.ink, c[tone]), `${season} ink on ${tone}`).toBeGreaterThanOrEqual(4.5)
      }
    })
    it(`${season}: small accent labels and dark sections are readable`, () => {
      for (const tone of ['sand', 'sky', 'aqua', 'butter', 'pink', 'peach', 'paper'] as const) {
        expect(ink(t.redText, c[tone]), `${season} red label on ${tone}`).toBeGreaterThanOrEqual(4.5)
      }
      expect(ink(c.paper, t.seaDeep), `${season} paper on deep sea`).toBeGreaterThanOrEqual(4.5)
      expect(ink(c.paper, c.ink), `${season} paper on ink`).toBeGreaterThanOrEqual(7)
      expect(ink(t.greenText, c.paper), `${season} green text on paper`).toBeGreaterThanOrEqual(4.5)
    })
  }
})

describe('motion plan', () => {
  const base = { global: 'full' as const, professional: 'creative' as const, season: 'expressive' as const, prefersReduced: false, finePointer: true }
  it('creative + expressive keeps the original summer experience', () => {
    const p = resolveMotion(base)
    expect(p).toMatchObject({ level: 'expressive', tide: true, cursorTrail: true, swing: true, float: true, tilt: true, breakout: true })
  })
  it('professional mode is restrained', () => {
    const p = resolveMotion({ ...base, professional: 'professional' })
    expect(p).toMatchObject({ level: 'subtle', tide: false, cursorTrail: false, swing: false, float: false, particles: 0 })
  })
  it('balanced keeps the night reveal but drops the cursor trail', () => {
    const p = resolveMotion({ ...base, professional: 'balanced' })
    expect(p.tide).toBe(true)
    expect(p.cursorTrail).toBe(false)
  })
  it('reduced motion and the global off switch remove everything decorative', () => {
    for (const p of [resolveMotion({ ...base, prefersReduced: true }), resolveMotion({ ...base, global: 'off' })]) {
      expect(p).toMatchObject({ reduced: true, level: 'none', particles: 0, tilt: false, breakout: false, tide: false, cursorTrail: false, swing: false, float: false })
    }
  })
  it('never raises a season above the global ceiling', () => {
    expect(resolveMotion({ ...base, global: 'subtle' }).level).toBe('subtle')
    expect(resolveMotion({ ...base, season: 'subtle' }).level).toBe('subtle')
  })
})

import { cursorAllowed, resolveRgb, isShapeStyle } from '../src/motion/cursor'
import { portfolio as basePortfolio } from '../src/content/portfolio.config'

describe('cursor effect', () => {
  const on = { ...basePortfolio.cursor, enabled: true }
  const env = { professional: 'creative' as const, global: 'full' as const, prefersReduced: false, finePointer: true }
  it('shows only on fine pointers and never under reduced motion', () => {
    expect(cursorAllowed(on, env)).toBe(true)
    expect(cursorAllowed(on, { ...env, finePointer: false })).toBe(false)
    expect(cursorAllowed(on, { ...env, prefersReduced: true })).toBe(false)
    expect(cursorAllowed(on, { ...env, global: 'off' })).toBe(false)
    expect(cursorAllowed({ ...on, enabled: false }, env)).toBe(false)
  })
  it('respects the chosen professional intensity', () => {
    expect(cursorAllowed(on, { ...env, professional: 'balanced' })).toBe(false)
    expect(cursorAllowed({ ...on, showIn: 'balanced' }, { ...env, professional: 'balanced' })).toBe(true)
    expect(cursorAllowed({ ...on, showIn: 'balanced' }, { ...env, professional: 'professional' })).toBe(false)
    expect(cursorAllowed({ ...on, showIn: 'professional' }, { ...env, professional: 'professional' })).toBe(true)
  })
  it('resolves colours', () => {
    expect(resolveRgb('', '1,2,3')).toBe('1,2,3')
    expect(resolveRgb('auto', '1,2,3')).toBe('1,2,3')
    expect(resolveRgb('#ff0000', '1,2,3')).toBe('255,0,0')
    expect(resolveRgb('sky', '1,2,3', () => '#00ff00')).toBe('0,255,0')
    expect(resolveRgb('nope', '1,2,3')).toBe('1,2,3')
  })
  it('knows which styles draw a shape', () => {
    expect(isShapeStyle('dot')).toBe(true)
    expect(isShapeStyle('bubbles')).toBe(false)
  })
})

import { darkPalette } from '../src/themes/seasonManager'
describe('dark mode palettes', () => {
  for (const season of SEASON_ORDER) {
    it(`${season}: text stays readable on every dark surface`, () => {
      const t = THEMES[season]
      const d = darkPalette(t.colors)
      const surfaces = [d.colors.paper, d.colors.sand, d.colors.sea, d.colors.aqua, d.colors.pink, d.colors.sage, d.colors.butter, d.colors.peach, d.colors.sky]
      for (const s of surfaces) expect(contrast(d.colors.ink, s), `${season} ink on ${s}`).toBeGreaterThanOrEqual(4.5)
      for (const k of ['redText', 'greenText', 'seaText'] as const) for (const s of surfaces) expect(contrast(d.derived[k], s), `${season} ${k} on ${s}`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(d.colors.ink, d.derived.seaDeep)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(d.onDeep, d.deep)).toBeGreaterThanOrEqual(7)
      expect(contrast('#ffffff', t.colors.red)).toBeGreaterThanOrEqual(4.5)
    })
  }
})
