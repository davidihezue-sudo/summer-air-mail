import { describe, expect, it } from 'vitest'
import { baseContent, normalizeContent, seedBuiltIns } from '../src/content/bundle'
import { getTools, toolCategories } from '../src/content/selectors'
import { ADDED_TOOLS } from '../src/content/tools'
import { validateContent } from '../server/validate.mjs'

describe('tools in more than one category', () => {
  it('lists the main category first, then the others, once each', () => {
    expect(toolCategories({ category: 'Content Creation', categories: ['Filming', 'Content Creation', 'AI and Automation'] })).toEqual(['Content Creation', 'Filming', 'AI and Automation'])
    expect(toolCategories({ category: 'Design' })).toEqual(['Design'])
  })
  it('keeps the extra categories through normalisation', () => {
    const c = normalizeContent({ ...baseContent, tools: [{ id: 'x', name: 'X', category: 'Filming', categories: ['Workflow and Automation'], confirmed: true, usage: '' }] })
    expect(c.tools[0].categories).toEqual(['Workflow and Automation'])
    expect(getTools(c)).toHaveLength(1)
  })
  it('accepts the new categories on the server', () => {
    const c = { ...baseContent, portfolio: { ...baseContent.portfolio, toolsSeeded: 1 }, tools: [{ id: 'x', name: 'X', category: 'Filming', categories: ['Workflow and Automation'], confirmed: true, usage: '' }] }
    expect(validateContent(c).ok).toBe(true)
  })
})

describe('built-in tools added later', () => {
  const old = normalizeContent({ ...baseContent, tools: [{ id: 'canva', name: 'Canva', category: 'Design', confirmed: true, usage: '' }], portfolio: { ...baseContent.portfolio, toolsSeeded: undefined } })
  it('are added once to a site saved before they existed', () => {
    const r = seedBuiltIns(old)
    expect(r.changed).toBe(true)
    expect(r.content.tools.map((t) => t.id)).toEqual(['canva', ...ADDED_TOOLS.map((t) => t.id)])
    expect(r.content.tools.map((t) => t.name)).toContain('Higgsfield')
    expect(r.content.tools.map((t) => t.name)).toContain('Grok')
  })
  it('stay deleted once the owner has saved without them', () => {
    const once = seedBuiltIns(old).content
    const removed = { ...once, tools: once.tools.filter((t) => t.id !== 'higgsfield') }
    const again = seedBuiltIns(normalizeContent(removed))
    expect(again.changed).toBe(false)
    expect(again.content.tools.map((t) => t.id)).not.toContain('higgsfield')
  })
  it('never change what the public site shows', () => {
    expect(normalizeContent(old).tools.map((t) => t.id)).toEqual(['canva'])
  })
})

describe('logos for the added tools', () => {
  it('Grok has a built-in mark, found by name', async () => {
    const { brandFor } = await import('../src/content/brands')
    for (const name of ['Grok', 'Grok AI', 'grok']) expect(brandFor({ name }).kind).toBe('svg')
  })
  it('Higgsfield has none, so it shows a letter tile until its logo is uploaded', async () => {
    const { brandFor } = await import('../src/content/brands')
    expect(brandFor({ name: 'Higgsfield' }).kind).toBe('mono')
    expect(brandFor({ name: 'Higgsfield', logo: '/uploads/higgsfield.png' }).kind).toBe('image')
  })
})
