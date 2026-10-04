import { describe, expect, it } from 'vitest'
import { SHAPES, clampRatio, forcedRatio, guessRatio, ratioOf } from '../src/utils/media'
import { readingMinutes } from '../src/utils/text'
import { portfolio } from '../src/content/portfolio.config'

describe('pictures from different platforms', () => {
  it('knows the shape of common posts', () => {
    expect(SHAPES.portrait).toBeCloseTo(0.8)
    expect(SHAPES.story).toBeCloseTo(9 / 16)
    expect(SHAPES.landscape).toBeCloseTo(16 / 9)
  })
  it('guesses a shape from the platform until the real size is known', () => {
    expect(guessRatio(['tiktok'])).toBeCloseTo(9 / 16)
    expect(guessRatio(['instagram', 'tiktok'])).toBeCloseTo(0.8)
    expect(guessRatio([])).toBeCloseTo(0.8)
    expect(guessRatio(['somethingelse'])).toBeCloseTo(0.8)
  })
  it('follows the picture by default and forces a shape only when asked', () => {
    expect(forcedRatio({ cardFormat: '' }, portfolio.media)).toBeNull()
    expect(forcedRatio({ cardFormat: 'story' }, portfolio.media)).toBeCloseTo(9 / 16)
    expect(forcedRatio({ cardFormat: '' }, { ...portfolio.media, cardShape: 'square' })).toBe(1)
    expect(forcedRatio({ cardFormat: 'wide' }, { ...portfolio.media, cardShape: 'square' })).toBeCloseTo(1.91)
  })
  it('measures pictures and keeps extreme shapes in bounds', () => {
    expect(ratioOf({ width: 1170, height: 2532 })).toBeCloseTo(0.462, 2)
    expect(ratioOf({})).toBeNull()
    expect(clampRatio(0.2)).toBeCloseTo(9 / 16)
    expect(clampRatio(9)).toBe(2.4)
    expect(clampRatio(NaN)).toBe(1)
  })
  it('shows whole screenshots by default', () => {
    expect(portfolio.media).toMatchObject({ cardFit: 'smart', cardShape: 'auto', fill: 'blur', screenshots: 'masonry' })
  })
  it('estimates reading time', () => {
    expect(readingMinutes('')).toBe(1)
    expect(readingMinutes('word '.repeat(660))).toBe(3)
  })
})
