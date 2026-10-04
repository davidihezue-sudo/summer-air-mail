import { describe, expect, it } from 'vitest'
import { brandFor, brandDataUri, brandKey, BRAND_CHOICES } from '../src/content/brands'
import { tools } from '../src/content/tools'

const t = (name: string, extra = {}) => ({ name, ...extra })

describe('tool logos', () => {
  it('matches common names to built-in marks regardless of spacing and case', () => {
    expect(brandFor(t('HubSpot')).kind).toBe('svg')
    expect(brandFor(t('Google  Analytics')).kind).toBe('svg')
    expect(brandFor(t('Meta Business Suite')).kind).toBe('svg')
    expect(brandKey('Meta Business Suite')).toBe('metabusinesssuite')
  })
  it('falls back to a coloured monogram when no mark exists, and never invents a logo', () => {
    const b = brandFor(t('Canva'))
    expect(b).toMatchObject({ kind: 'mono', text: 'C', color: '#00C4CC' })
    expect(brandFor(t('My Own Tool'))).toMatchObject({ kind: 'mono', text: 'MO' })
  })
  it('prefers an uploaded logo, then a linked one, then a chosen built-in mark', () => {
    expect(brandFor(t('Canva', { logo: '/uploads/canva.webp' }))).toEqual({ kind: 'image', src: '/uploads/canva.webp' })
    expect(brandFor(t('Canva', { logoUrl: 'https://example.com/c.png' })).kind).toBe('image')
    expect(brandFor(t('Anything', { logoSlug: 'figma' })).kind).toBe('svg')
  })
  it('refuses unsafe logo addresses and bad colours', () => {
    expect(brandFor(t('Canva', { logoUrl: 'javascript:alert(1)' })).kind).toBe('mono')
    expect(brandFor(t('Notion', { color: 'red; background:url(x)' }))).toMatchObject({ kind: 'svg' })
    expect((brandFor(t('Notion', { color: '#112233' })) as { color: string }).color).toBe('#112233')
  })
  it('builds a data address for admin lists', () => {
    expect(brandDataUri(brandFor(t('Figma')))).toMatch(/^data:image\/svg\+xml,/)
    expect(BRAND_CHOICES.length).toBeGreaterThan(40)
  })
  it('gives every catalogue tool a mark or a monogram', () => {
    for (const x of tools) expect(['svg', 'mono']).toContain(brandFor(x).kind)
  })
})

import { satellites } from '../src/components/hero/HeroOrb'
import { portfolio } from '../src/content/portfolio.config'
describe('hero orb', () => {
  it('defaults to a water bubble and keeps satellites stable and bounded', () => {
    expect(portfolio.hero.orb.style).toBe('bubble')
    expect(satellites(3)).toEqual(satellites(3))
    expect(satellites(99)).toHaveLength(8)
    expect(satellites(-4)).toHaveLength(0)
    expect(satellites(NaN)).toHaveLength(0)
  })
})
