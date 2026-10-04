import { describe, expect, it } from 'vitest'
import { buildIndex, search } from '../src/admin/search'
import { normalizeContent, baseContent } from '../src/content/bundle'
import { newProject, newTool } from '../src/content/factories'

const c = normalizeContent(baseContent)
c.projects = [{ ...newProject(), id: 'p1', title: 'Spring Launch Campaign', client: 'Acme' }]
c.tools = [{ ...newTool(), id: 't1', name: 'Canva', confirmed: true }]
const index = buildIndex(c)
const top = (q: string) => search(index, q).map((h) => h.title)

describe('admin search', () => {
  it('indexes pages, settings and the things you have written', () => {
    expect(index.some((h) => h.kind === 'page' && h.title === 'Cursor effect')).toBe(true)
    expect(index.some((h) => h.kind === 'setting' && h.title === 'Opacity')).toBe(true)
    expect(index.some((h) => h.kind === 'item' && h.title === 'Spring Launch Campaign' && h.to === 'projects/p1')).toBe(true)
  })
  it('finds a page as soon as a few letters are typed', () => {
    expect(top('cur')[0]).toBe('Cursor effect')
    expect(top('serv')).toEqual(expect.arrayContaining(['Services']))
  })
  it('matches several words in any order and ignores case and accents', () => {
    expect(top('LAUNCH spring')).toContain('Spring Launch Campaign')
    expect(top('Dark')).toEqual(expect.arrayContaining(['Design']))
  })
  it('finds pages by what people call them, not only their title', () => {
    expect(top('dark mode').slice(0, 3)).toEqual(expect.arrayContaining(['Design', 'Colour mode']))
    expect(top('backup')).toEqual(expect.arrayContaining(['Server & Backups']))
    expect(top('logo')).toEqual(expect.arrayContaining(['Tools & Platforms']))
    expect(top('password')).toEqual(expect.arrayContaining(['Advanced Settings']))
  })
  it('finds individual settings and says where they are', () => {
    const h = search(index, 'colour mode').find((x) => x.kind === 'setting')
    expect(h?.where).toContain('Design')
    expect(h?.find).toBe('Colour mode')
  })
  it('finds your items by their name and opens the right editor', () => {
    const h = search(index, 'canva')[0]
    expect(h).toMatchObject({ kind: 'item', to: 'tools/t1' })
  })
  it('returns nothing for empty or unmatched searches and never floods the list', () => {
    expect(search(index, '')).toEqual([])
    expect(search(index, '   ')).toEqual([])
    expect(search(index, 'zzzqqq')).toEqual([])
    expect(search(index, 'e').length).toBeLessThanOrEqual(14)
  })
  it('keeps a mix of result kinds', () => {
    const kinds = new Set(search(index, 'a').map((h) => h.kind))
    expect(kinds.size).toBeGreaterThan(1)
  })
})
