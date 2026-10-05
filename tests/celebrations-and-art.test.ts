import { describe, expect, it } from 'vitest'
import { DECORATION_IDS, DEFAULT_CELEBRATIONS, activeCelebration, celebrationCovers, celebrationWhen, easterSunday } from '../src/themes/celebrations'
import { DEFAULT_RANGES, contrast, resolveTheme, emptyOverride } from '../src/themes/seasonManager'
import { THEMES } from '../src/themes'
import { baseContent, normalizeContent } from '../src/content/bundle'
import { brandFor } from '../src/content/brands'
import { drawingFor, SERVICE_DRAWINGS } from '../src/content/serviceArt'
import { mediaCaption } from '../src/utils/media'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInsights } from '../server/records.mjs'
import type { Celebration, CelebrationSettings, SeasonSettings } from '../src/content/types'

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12)
const settings = (items: Celebration[] = DEFAULT_CELEBRATIONS, enabled = true): CelebrationSettings => ({ enabled, items })
const named = (id: string) => DEFAULT_CELEBRATIONS.find((c) => c.id === id)!
const seasons: SeasonSettings = { mode: 'auto', ranges: DEFAULT_RANGES, transition: 'none', overrides: { spring: emptyOverride(), summer: emptyOverride(), autumn: emptyOverride(), winter: emptyOverride() } }

describe('celebration dates', () => {
  it('knows Easter Sunday', () => {
    expect([2024, 2025, 2026, 2027, 2038].map((y) => easterSunday(y).toDateString())).toEqual([d(2024, 3, 31), d(2025, 4, 20), d(2026, 4, 5), d(2027, 3, 28), d(2038, 4, 25)].map((x) => x.toDateString()))
  })
  it('shows Christmas from 1 to 25 December, Boxing Day on the 26th, then the plain season', () => {
    expect(activeCelebration(settings(), d(2026, 11, 30))).toBeNull()
    expect(activeCelebration(settings(), d(2026, 12, 1))?.id).toBe('christmas')
    expect(activeCelebration(settings(), d(2026, 12, 25))?.id).toBe('christmas')
    expect(activeCelebration(settings(), d(2026, 12, 26))?.id).toBe('boxing-day')
    expect(activeCelebration(settings(), d(2026, 12, 27))).toBeNull()
  })
  it('handles a window that crosses New Year', () => {
    for (const date of [d(2026, 12, 31), d(2027, 1, 1), d(2027, 1, 2)]) expect(activeCelebration(settings(), date)?.id).toBe('new-year')
    expect(activeCelebration(settings(), d(2027, 1, 3))).toBeNull()
    expect(activeCelebration(settings(), d(2026, 12, 30))).toBeNull()
  })
  it('keeps the optional celebrations off until they are switched on', () => {
    expect(DEFAULT_CELEBRATIONS.filter((c) => c.enabled).map((c) => c.id)).toEqual(['christmas', 'boxing-day', 'new-year'])
    expect(activeCelebration(settings(), d(2026, 10, 30))).toBeNull()
    const on = DEFAULT_CELEBRATIONS.map((c) => ({ ...c, enabled: true }))
    expect(activeCelebration(settings(on), d(2026, 10, 30))?.id).toBe('halloween')
    expect(activeCelebration(settings(on), d(2026, 2, 14))?.id).toBe('valentines')
    expect(activeCelebration(settings(on), d(2026, 7, 1))?.id).toBe('canada-day')
  })
  it('moves Easter with the calendar', () => {
    const easter = { ...named('easter'), enabled: true }
    expect(celebrationCovers(easter, d(2026, 4, 3))).toBe(true) // Good Friday
    expect(celebrationCovers(easter, d(2026, 4, 6))).toBe(true) // Easter Monday
    expect(celebrationCovers(easter, d(2026, 4, 7))).toBe(false)
    expect(celebrationCovers(easter, d(2027, 3, 26))).toBe(true)
    expect(celebrationCovers(easter, d(2027, 4, 3))).toBe(false)
  })
  it('does nothing when switched off, and ignores invalid dates', () => {
    expect(activeCelebration(settings(DEFAULT_CELEBRATIONS, false), d(2026, 12, 10))).toBeNull()
    expect(activeCelebration(undefined, d(2026, 12, 10))).toBeNull()
    expect(celebrationCovers({ ...named('christmas'), from: { month: 2, day: 31 } }, d(2026, 12, 10))).toBe(false)
    expect(celebrationCovers({ ...named('easter'), easterFrom: 3, easterTo: 1 }, d(2026, 4, 5))).toBe(false)
  })
  it('lets the first celebration in the list win when two overlap', () => {
    const a = { ...named('christmas'), id: 'a' }
    const b = { ...named('christmas'), id: 'b' }
    expect(activeCelebration(settings([b, a]), d(2026, 12, 5))?.id).toBe('b')
  })
  it('describes the dates in words', () => {
    expect(celebrationWhen(named('christmas'))).toBe('1 December to 25 December, every year')
    expect(celebrationWhen(named('boxing-day'))).toBe('26 December, every year')
    expect(celebrationWhen(named('easter'))).toBe('From 2 days before Easter Sunday to 1 day after Easter Sunday, every year')
  })
})

describe('celebration themes', () => {
  it('give every celebration a full, readable palette and only known decorations', () => {
    for (const c of DEFAULT_CELEBRATIONS) {
      expect(Object.keys(c.colors).sort(), c.id).toEqual(Object.keys(THEMES.summer.colors).sort())
      for (const v of Object.values(c.colors)) expect(v, c.id).toMatch(/^#[0-9a-f]{6}$/i)
      expect(contrast(c.colors.ink!, c.colors.sand!), `${c.id} ink on sand`).toBeGreaterThanOrEqual(7)
      expect(contrast(c.colors.ink!, c.colors.paper!), `${c.id} ink on paper`).toBeGreaterThanOrEqual(7)
      for (const dec of c.decorations) expect(DECORATION_IDS, c.id).toContain(dec)
      expect(c.greeting).not.toContain(String.fromCharCode(8212))
    }
  })
  it('lays the celebration over the season and replaces its falling decorations', () => {
    const plain = resolveTheme('autumn', seasons)
    const xmas = resolveTheme('winter', seasons, named('christmas'))
    expect(plain.celebration).toBeNull()
    expect(plain.decorations).toContain('leaves')
    expect(xmas.celebration).toEqual({ id: 'christmas', name: 'Christmas', greeting: 'Merry Christmas' })
    expect(xmas.colors.red).toBe(named('christmas').colors.red)
    expect(xmas.decorations).toEqual(['snow', 'lights', 'stars'])
    expect(xmas.decorations).not.toContain('leaves')
  })
  it('keeps the season colour for any colour the celebration leaves out', () => {
    const custom: Celebration = { ...named('christmas'), colors: { red: '#112233' } }
    const r = resolveTheme('summer', seasons, custom)
    expect(r.colors.red).toBe('#112233')
    expect(r.colors.sand).toBe(THEMES.summer.colors.sand)
  })
  it('ignores bad colours and unknown decorations', () => {
    const r = resolveTheme('summer', seasons, { ...named('christmas'), colors: { red: 'not-a-colour' }, decorations: ['snow', 'bogus'] })
    expect(r.colors.red).toBe(THEMES.summer.colors.red)
    expect(r.decorations).toEqual(['snow'])
  })
  it('uses the celebration level when set and the season level when blank', () => {
    expect(resolveTheme('summer', seasons, { ...named('christmas'), intensity: 'subtle' }).intensity).toBe('subtle')
    expect(resolveTheme('summer', seasons, { ...named('christmas'), intensity: '' }).intensity).toBe(resolveTheme('summer', seasons).intensity)
  })
  it('ships with the celebrations on in the base content', () => {
    expect(baseContent.portfolio.celebrations.enabled).toBe(true)
    expect(normalizeContent({ portfolio: { celebrations: { enabled: false } } }).portfolio.celebrations.enabled).toBe(false)
  })
})

describe('Capabilities drawings', () => {
  it('picks a drawing that fits the name when none is chosen', () => {
    const pick = (name: string) => drawingFor({ id: name.toLowerCase().replace(/\s+/g, '-'), name, icon: 'Sparkles' })
    expect(pick('Copywriting')).toBe('pen')
    expect(pick('Reels and Short-Form Video')).toBe('clapper')
    expect(pick('Meta Ads')).toBe('megaphone')
    expect(pick('Brand Strategy')).toBe('compass')
    expect(pick('Performance Dashboards')).toBe('chart')
    expect(pick('Community Management')).toBe('bubbles')
    expect(pick('Content Scheduling')).toBe('calendar')
    expect(pick('Email Marketing')).toBe('mail')
    expect(pick('AI Marketing')).toBe('chip')
    expect(pick('Influencer Marketing')).toBe('star')
    expect(pick('Something unrelated')).toBe('')
  })
  it('keeps a deliberate choice, a chosen icon, and maps the old seasonal names', () => {
    expect(drawingFor({ id: 'x', name: 'Copywriting', object: 'camera', icon: 'Sparkles' })).toBe('camera')
    expect(drawingFor({ id: 'x', name: 'Copywriting', icon: 'Rocket' })).toBe('')
    expect(drawingFor({ id: 'x', name: 'Whatever', object: 'sunglasses' })).toBe('compass')
    expect(drawingFor({ id: 'x', name: 'Whatever', object: 'watermelon' })).toBe('chart')
  })
  it('migrates stored services that used the seasonal props', () => {
    const c = normalizeContent({ services: [{ id: 'a', name: 'A', object: 'sunscreen' }, { id: 'b', name: 'B', object: 'flipflops' }, { id: 'c', name: 'C', object: 'phone' }] })
    expect(c.services.map((s) => s.object)).toEqual(['palette', 'megaphone', 'phone'])
  })
  it('gives the starting services drawings of what they are', () => {
    expect(baseContent.services.filter((s) => !s.hidden).map((s) => drawingFor(s))).toEqual(['compass', 'camera', 'phone', 'palette', 'megaphone', 'chart'])
    for (const s of baseContent.services) expect(SERVICE_DRAWINGS.map((x) => x.value)).toContain(drawingFor(s) || 'phone')
  })
})

describe('real brand marks', () => {
  const mark = (name: string) => brandFor({ name })
  it('uses the real mark, not a letter, for the tools that used to show a monogram', () => {
    for (const name of ['ChatGPT', 'OpenAI', 'Canva', 'Adobe Photoshop', 'Adobe Premiere Pro', 'Adobe Creative Cloud', 'LinkedIn', 'Slack', 'CapCut', 'Midjourney', 'Runway', 'Power BI', 'Tableau', 'Microsoft Excel']) {
      expect(mark(name).kind, name).toBe('svg')
    }
  })
  it('ChatGPT keeps its own green and CapCut is drawn with the evenodd rule', () => {
    const chat = mark('ChatGPT')
    expect(chat.kind === 'svg' && chat.color).toBe('#10A37F')
    const cap = mark('CapCut')
    expect(cap.kind === 'svg' && cap.evenodd).toBe(true)
  })
  it('still falls back to a monogram for a tool with no mark, and to an upload when there is one', () => {
    expect(mark('Klaviyo').kind).toBe('mono')
    expect(brandFor({ name: 'ChatGPT', logo: '/uploads/mine.png' }).kind).toBe('image')
  })
})

describe('media captions', () => {
  it('shows the caption, or for a video the description written for it', () => {
    expect(mediaCaption({ type: 'video', alt: 'Behind the scenes', caption: 'Shot on location' })).toBe('Shot on location')
    expect(mediaCaption({ type: 'video', alt: 'Behind the scenes' })).toBe('Behind the scenes')
    expect(mediaCaption({ type: 'image', alt: 'A product on a table' })).toBe('')
    expect(mediaCaption({ type: 'image', alt: 'x', caption: '  A caption  ' })).toBe('A caption')
  })
})

describe('insights: outside visitors and home', () => {
  const day = (n: number) => new Date(Date.UTC(2026, 5, n, 12))
  const make = async () => { const dir = mkdtempSync(join(tmpdir(), 'sam-ins-')); const i = createInsights(dir); await i.init(); return { i, done: () => rmSync(dir, { recursive: true, force: true }) } }
  it('keeps outsiders and the owner in separate counts', async () => {
    const { i, done } = await make()
    await i.record({ type: 'view', path: '/', ip: '1.1.1.1', ua: 'a' }, day(1))
    await i.record({ type: 'view', path: '/', ip: '1.1.1.1', ua: 'a', own: true }, day(1))
    await i.record({ type: 'view', path: '/work', ip: '2.2.2.2', ua: 'b', own: true }, day(1))
    await i.record({ type: 'project', name: 'Secret', own: true }, day(1))
    const s = i.summary(7, day(1))
    expect(s.views).toBe(1)
    expect(s.visitors).toBe(1)
    expect((s.items as Record<string, unknown>).project).toBeUndefined()
    expect(s.own).toMatchObject({ views: 2, visitors: 2, daysSeen: 1, paths: { '/': 1, '/work': 1 } })
    done()
  })
  it('recognises a home network for 90 days, keeps five, and can forget them', async () => {
    const { i, done } = await make()
    expect(i.isHome('9.9.9.9', day(1))).toBe(false)
    expect(await i.markHome('9.9.9.9', day(1))).toBe(true)
    expect(await i.markHome('9.9.9.9', day(1))).toBe(false)
    expect(i.isHome('9.9.9.9', day(1))).toBe(true)
    expect(i.isHome('9.9.9.8', day(1))).toBe(false)
    expect(i.isHome('9.9.9.9', new Date(day(1).getTime() + 89 * 864e5))).toBe(true)
    expect(i.isHome('9.9.9.9', new Date(day(1).getTime() + 95 * 864e5))).toBe(false)
    for (let n = 0; n < 7; n++) await i.markHome(`10.0.0.${n}`, day(2 + n))
    expect(i.homeCount()).toBe(5)
    expect(i.isHome('10.0.0.6', day(9))).toBe(true)
    expect(i.isHome('10.0.0.0', day(9))).toBe(false)
    await i.forgetHome()
    expect(i.homeCount()).toBe(0)
    done()
  })
  it('never writes the address to disk', async () => {
    const { i, done } = await make()
    await i.markHome('203.0.113.44', day(1))
    await i.record({ type: 'view', path: '/', ip: '203.0.113.44', ua: 'ua-string', own: true }, day(1))
    await i.flush()
    expect(JSON.stringify(i.days())).not.toContain('203.0.113.44')
    done()
  })
})

describe('tools strip', () => {
  it('defaults to true logos only, and the admin offers both styles', async () => {
    const { portfolio } = await import('../src/content/portfolio.config')
    expect(portfolio.toolsUi).toMatchObject({ marquee: 'logos', logosBand: true })
    const { PAGES } = await import('../src/admin/schema')
    await import('../src/admin/schemaExtra')
    const fields = PAGES.toolsDisplay.blocks.flatMap((b) => b.fields) as { key?: string; options?: { value: string }[] }[]
    expect(fields.find((f) => f.key === 'marquee')?.options?.map((o) => o.value)).toEqual(['logos', 'chips'])
    expect(fields.some((f) => f.key === 'logosBand')).toBe(true)
  })
})
