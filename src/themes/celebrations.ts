import type { Celebration, CelebrationSettings, ThemeColors } from '../content/types'
import { validDate } from './seasonManager'

/** What a celebration can scatter or hang across the page. The first group falls from the top; lights and fireworks are drawn separately. */
export const CELEBRATION_DECORATIONS = [
  { id: 'snow', label: 'Falling snow' },
  { id: 'lights', label: 'String lights across the top' },
  { id: 'stars', label: 'Twinkling stars' },
  { id: 'hearts', label: 'Floating hearts' },
  { id: 'confetti', label: 'Confetti' },
  { id: 'fireworks', label: 'Fireworks' },
  { id: 'petals', label: 'Petals' },
  { id: 'leaves', label: 'Falling leaves' },
  { id: 'glints', label: 'Soft sparkles' },
] as const

export const DECORATION_IDS: string[] = CELEBRATION_DECORATIONS.map((d) => d.id)

const day = (month: number, d: number) => ({ month, day: d })

const palette = (c: ThemeColors): Partial<ThemeColors> => c

/**
 * The celebrations that come with the site. Christmas, Boxing Day and New Year are on from the start; the others are switched off
 * until you turn them on. Every date, colour, decoration and greeting can be changed in the admin, and you can add your own.
 */
export const DEFAULT_CELEBRATIONS: Celebration[] = [
  {
    id: 'christmas', name: 'Christmas', enabled: true, rule: 'fixed', from: day(12, 1), to: day(12, 25), easterFrom: -2, easterTo: 1,
    season: 'winter', greeting: 'Merry Christmas', decorations: ['snow', 'lights', 'stars'], intensity: '',
    colors: palette({
      paper: '#FBF6EC', sand: '#F1E6D0', ink: '#1D2B26', red: '#B3202A', green: '#0E5A3A', stone: '#8C8374', sea: '#14543F',
      aqua: '#BFE0D2', pink: '#F2B8BE', sage: '#8FBF9C', butter: '#EBCB6B', peach: '#F2B28C', sky: '#CFE6EE',
    }),
  },
  {
    id: 'boxing-day', name: 'Boxing Day', enabled: true, rule: 'fixed', from: day(12, 26), to: day(12, 26), easterFrom: -2, easterTo: 1,
    season: 'winter', greeting: 'Happy Boxing Day', decorations: ['confetti', 'stars'], intensity: '',
    colors: palette({
      paper: '#F6F4F0', sand: '#E8EAEE', ink: '#1A2233', red: '#A82430', green: '#1F4D3A', stone: '#8A8D96', sea: '#26406B',
      aqua: '#B9D3EA', pink: '#EBB4B8', sage: '#9DB8A2', butter: '#E3C26A', peach: '#EFB89A', sky: '#C9DCEE',
    }),
  },
  {
    id: 'new-year', name: 'New Year', enabled: true, rule: 'fixed', from: day(12, 31), to: day(1, 2), easterFrom: -2, easterTo: 1,
    season: 'winter', greeting: 'Happy New Year', decorations: ['fireworks', 'confetti', 'stars'], intensity: '',
    colors: palette({
      paper: '#F7F4EC', sand: '#E9E3D3', ink: '#14182B', red: '#A8283C', green: '#1D4B3C', stone: '#8B8A93', sea: '#1C2A5A',
      aqua: '#BCCBE6', pink: '#E9B3C2', sage: '#9DB5A0', butter: '#E8C45A', peach: '#EDB791', sky: '#C7D3EC',
    }),
  },
  {
    id: 'valentines', name: "Valentine's Day", enabled: false, rule: 'fixed', from: day(2, 7), to: day(2, 14), easterFrom: -2, easterTo: 1,
    season: 'spring', greeting: "Happy Valentine's Day", decorations: ['hearts', 'glints'], intensity: '',
    colors: palette({
      paper: '#FFF6F5', sand: '#F9E3E1', ink: '#3A1620', red: '#C21E4A', green: '#6E1F3A', stone: '#9A7F85', sea: '#8C2B4F',
      aqua: '#F3C9D2', pink: '#F4A6B8', sage: '#D9A7B3', butter: '#F6D5A0', peach: '#F7B79D', sky: '#F6D0D8',
    }),
  },
  {
    id: 'easter', name: 'Easter', enabled: false, rule: 'easter', from: day(4, 1), to: day(4, 1), easterFrom: -2, easterTo: 1,
    season: 'spring', greeting: 'Happy Easter', decorations: ['petals', 'glints'], intensity: '',
    colors: palette({
      paper: '#FBF8EE', sand: '#F2EBD3', ink: '#2B3A34', red: '#C94A63', green: '#3E7D4B', stone: '#9A9684', sea: '#3D7A8C',
      aqua: '#BDE3DA', pink: '#F5B9CC', sage: '#B5D6A1', butter: '#F8E08E', peach: '#F7BE9C', sky: '#C5E1F2',
    }),
  },
  {
    id: 'canada-day', name: 'Canada Day', enabled: false, rule: 'fixed', from: day(7, 1), to: day(7, 1), easterFrom: -2, easterTo: 1,
    season: 'summer', greeting: 'Happy Canada Day', decorations: ['confetti', 'fireworks'], intensity: '',
    colors: palette({
      paper: '#FFF9F6', sand: '#F6E9E4', ink: '#2A1517', red: '#D52B1E', green: '#7A1D18', stone: '#9A8683', sea: '#A5231B',
      aqua: '#F3CFC9', pink: '#F2A9A3', sage: '#E3B9B3', butter: '#F5D79B', peach: '#F4B197', sky: '#F5D6D1',
    }),
  },
  {
    id: 'halloween', name: 'Halloween', enabled: false, rule: 'fixed', from: day(10, 24), to: day(10, 31), easterFrom: -2, easterTo: 1,
    season: 'autumn', greeting: 'Happy Halloween', decorations: ['leaves', 'glints'], intensity: '',
    colors: palette({
      paper: '#F6F0E6', sand: '#EADCC4', ink: '#1E1426', red: '#B8470F', green: '#4B2A6B', stone: '#8A7C8C', sea: '#3B2158',
      aqua: '#C9B8E0', pink: '#E9A6B8', sage: '#9DB38A', butter: '#F2B84B', peach: '#F2A66A', sky: '#D3C9E6',
    }),
  },
]

/** Easter Sunday for a year (the Gregorian calendar, Meeus/Jones/Butcher method). */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  return new Date(year, month - 1, ((h + l - 7 * m + 114) % 31) + 1)
}

const key = (m: number, d: number) => m * 100 + d
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const shift = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)

/** True when the celebration covers the date. Windows that cross New Year (31 December to 2 January) work. Invalid dates never match. */
export function celebrationCovers(c: Celebration, date: Date): boolean {
  const today = dayStart(date)
  if (c.rule === 'easter') {
    const from = Number(c.easterFrom)
    const to = Number(c.easterTo)
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return false
    const easter = easterSunday(today.getFullYear())
    return today >= shift(easter, from) && today <= shift(easter, to)
  }
  if (!c.from || !c.to || !validDate(c.from.month, c.from.day) || !validDate(c.to.month, c.to.day)) return false
  const now = key(today.getMonth() + 1, today.getDate())
  const from = key(c.from.month, c.from.day)
  const to = key(c.to.month, c.to.day)
  return from <= to ? now >= from && now <= to : now >= from || now <= to
}

/** The celebration to show today: the first one in the list that is switched on and covers the date. */
export function activeCelebration(settings: CelebrationSettings | undefined, date = new Date()): Celebration | null {
  if (!settings?.enabled || !Array.isArray(settings.items)) return null
  return settings.items.find((c) => c && c.enabled && celebrationCovers(c, date)) ?? null
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** A plain sentence for the admin: when this celebration is on. */
export function celebrationWhen(c: Celebration): string {
  if (c.rule === 'easter') {
    const rel = (n: number) => (n === 0 ? 'Easter Sunday' : n < 0 ? `${-n} day${n === -1 ? '' : 's'} before Easter Sunday` : `${n} day${n === 1 ? '' : 's'} after Easter Sunday`)
    return `From ${rel(c.easterFrom)} to ${rel(c.easterTo)}, every year`
  }
  const fmt = (d: { month: number; day: number }) => (validDate(d.month, d.day) ? `${d.day} ${MONTHS[d.month - 1]}` : 'an invalid date')
  const one = c.from.month === c.to.month && c.from.day === c.to.day
  return one ? `${fmt(c.from)}, every year` : `${fmt(c.from)} to ${fmt(c.to)}, every year`
}
