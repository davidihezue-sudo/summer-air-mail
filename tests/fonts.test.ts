import { describe, expect, it } from 'vitest'
import { BODY_FONTS, FONT_CHOICES, HEADING_FONTS, SCRIPT_FONTS, fontOptions, safeFont } from '../src/themes/seasonManager'
import { LOADABLE_FONTS, firstFamily } from '../src/themes/fontLoader'

describe('font choices', () => {
  const named = FONT_CHOICES.filter((f) => f.value)
  it('keeps the three original fonts and adds more', () => {
    const labels = named.map((f) => f.label)
    expect(labels).toEqual(expect.arrayContaining([expect.stringMatching(/^Italiana/), expect.stringMatching(/^Pinyon Script/), expect.stringMatching(/^Figtree/)]))
    expect(named.length).toBeGreaterThanOrEqual(20)
  })
  it('every optional font has a loader, and every loader is offered', () => {
    const builtIn = new Set(['Georgia', 'system-ui'])
    const optional = named.map((f) => firstFamily(f.value)).filter((f) => !builtIn.has(f))
    for (const f of optional) expect(LOADABLE_FONTS, `no loader for ${f}`).toContain(f)
    for (const f of LOADABLE_FONTS) expect(optional, `${f} is bundled but not offered`).toContain(f)
  })
  it('every value is accepted by the safety check, so none is silently dropped', () => {
    for (const f of named) expect(safeFont(f.value), f.label).toBe(f.value)
    expect(safeFont("url(javascript:alert(1)); x")).toBe('')
  })
  it('each box offers fonts that suit it, with no repeats', () => {
    const script = fontOptions(SCRIPT_FONTS).map((f) => f.label)
    expect(script.filter((l) => /script|brush|Pinyon|Sacramento|Playball/i.test(l)).length).toBeGreaterThanOrEqual(8)
    expect(fontOptions(BODY_FONTS).map((f) => f.label).join()).not.toMatch(/Great Vibes|Allura/)
    expect(fontOptions(HEADING_FONTS).length).toBeGreaterThan(10)
    for (const set of [SCRIPT_FONTS, HEADING_FONTS, BODY_FONTS]) { const v = fontOptions(set).map((f) => f.value); expect(new Set(v).size).toBe(v.length) }
    expect(fontOptions(BODY_FONTS, true)[0].label).toBe('Theme default')
  })
  it('finds the first family in a stack', () => {
    expect(firstFamily("'Great Vibes', 'Snell Roundhand', cursive")).toBe('Great Vibes')
    expect(firstFamily('system-ui, sans-serif')).toBe('system-ui')
    expect(firstFamily(undefined)).toBe('')
  })
})
