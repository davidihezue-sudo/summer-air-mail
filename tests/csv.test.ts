/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'
import { CSV_SETS, exportCsv, importCsv, parseCsv, toCsv } from '../src/admin/csv'
import { normalizeContent, baseContent } from '../src/content/bundle'

describe('csv', () => {
  it('parses quotes, commas, newlines and BOM', () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\n\n"l1\nl2",z')).toEqual([['a', 'b'], ['x, y', 'say "hi"'], ['l1\nl2', 'z']])
  })
  it('neutralises formulas on export but keeps negative numbers', () => {
    const out = toCsv([{ a: '=1+1', b: '-5', c: '@cmd' }], ['a', 'b', 'c'])
    expect(out).toContain("'=1+1")
    expect(out).toContain(',-5,')
    expect(out).toContain("'@cmd")
  })
  it('round trips projects as new, draft items without touching existing ones', () => {
    const set = CSV_SETS.find((s) => s.collection === 'projects')!
    const c = normalizeContent(baseContent)
    const text = 'title,client,category,year,published,description\r\nLaunch,Acme,Brand Development,2025,yes,"Did, a thing"\r\n,Nobody,,,,\r\nSecond,,,,no,'
    const r = importCsv(set, text)
    expect(r.items).toHaveLength(2)
    expect(r.skipped).toBe(1)
    expect(r.items[0]).toMatchObject({ title: 'Launch', client: 'Acme', hidden: false, description: 'Did, a thing' })
    expect(r.items[1].hidden).toBe(true)
    expect(r.items[0].id).not.toBe(r.items[1].id)
    c.projects = r.items
    const back = importCsv(set, exportCsv(set, c))
    expect(back.items.map((x: any) => x.title)).toEqual(['Launch', 'Second'])
  })
  it('never approves testimonials unless the sheet says so', () => {
    const set = CSV_SETS.find((s) => s.collection === 'testimonials')!
    const r = importCsv(set, 'name,quote\r\nA,Great\r\n')
    expect(r.items[0].approved).toBe(false)
  })
  it('reports missing columns', () => {
    const set = CSV_SETS.find((s) => s.collection === 'notes')!
    expect(importCsv(set, 'title\r\nHi').missing).toContain('slug')
  })
})
