/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'
import { ENTITIES, PAGES } from '../src/admin/schema'
import '../src/admin/schemaExtra'
import { normalizeContent, baseContent } from '../src/content/bundle'
import type { Field } from '../src/admin/fields'

const content: any = normalizeContent(baseContent)
const dig = (o: any, path: string) => path.split('.').filter(Boolean).reduce((v, k) => (v == null ? undefined : v[k]), o)

/** Every leaf field (groups are walked into) with the object path it edits. */
function leaves(fields: Field[], base: string, out: { path: string; kind: string; label: string }[] = []) {
  for (const f of fields as any[]) {
    if (f.kind === 'group') leaves(f.fields, f.key ? `${base}.${f.key}` : base, out)
    else if (f.kind === 'blocks' || f.kind === 'viewSections') continue
    else out.push({ path: `${base}.${f.key}`, kind: f.kind, label: f.label })
  }
  return out
}

describe('admin pages edit fields that exist in the content', () => {
  for (const [id, page] of Object.entries(PAGES)) {
    it(`page ${id}`, () => {
      for (const b of page.blocks) for (const l of leaves(b.fields, b.base)) {
        // Optional image fields may be null and optional numbers may be absent; everything else must have a default.
        const v = dig(content, l.path)
        const optional = ['image', 'file', 'number', 'select', 'refs', 'ref'].includes(l.kind)
        expect(v !== undefined || optional, `${l.path} (${l.label}) has no default`).toBe(true)
      }
    })
  }
})

describe('admin lists create items with the fields they edit', () => {
  for (const [id, def] of Object.entries(ENTITIES)) {
    it(`entity ${id}`, () => {
      const item: any = def.make()
      expect(typeof item.id).toBe('string')
      for (const l of leaves(def.fields, '')) {
        const key = l.path.replace(/^\./, '')
        const v = dig(item, key)
        const optional = ['image', 'file', 'number', 'select', 'refs', 'ref', 'bool', 'text', 'textarea', 'rich', 'strings', 'url', 'date', 'multi', 'tone', 'icon', 'list'].includes(l.kind)
        expect(v !== undefined || optional, `${key} missing on a new ${id}`).toBe(true)
      }
      expect(def.titleOf(item)).toBeTruthy()
      expect(typeof def.shown(item)).toBe('boolean')
    })
  }
})

describe('every section type has a label, a registry slot and a default position', async () => {
  const { SECTION_LABELS, defaultSections } = await import('../src/content/sections')
  it('covers every section type', () => {
    const types = new Set(defaultSections().map((s) => s.type))
    for (const t of Object.keys(SECTION_LABELS)) if (t !== 'richText') expect(types.has(t as never), t).toBe(true)
  })
})

describe('no admin page goes missing', () => {
  it('registers every page the menu links to', async () => {
    const { NAV } = await import('../src/admin/nav')
    const custom = new Set(['dashboard', 'sections', 'seasons', 'navigation', 'publish', 'advanced', 'media', 'cursor', 'looks', 'celebrations', 'languages', 'inbox', 'subscribers', 'insights', 'qualityScore', 'bulk', 'altText', 'team', 'server'])
    for (const g of NAV) for (const i of g.items) {
      expect(custom.has(i.id) || !!ENTITIES[i.id] || !!PAGES[i.id], `menu item "${i.label}" (${i.id}) has no page`).toBe(true)
    }
  })
})
