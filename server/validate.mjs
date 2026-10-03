// Server-side validation of content saved from the admin. The client also sanitises on render;
// this is the second line of defence so nothing dangerous is ever stored or published.

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
const DANGEROUS = /^\s*(javascript|vbscript|data:text\/html|data:application)/i
export const MAX_BYTES = 3 * 1024 * 1024
const COLLECTIONS = ['projects', 'services', 'tools', 'testimonials', 'contentItems', 'websites', 'skills', 'platforms', 'aiSkills', 'results', 'screenshots', 'process', 'categories']
const SECTION_TYPES = new Set(['hero', 'overview', 'about', 'services', 'skills', 'platforms', 'process', 'work', 'caseStudies', 'results', 'tools', 'ai', 'content', 'screenshots', 'strategy', 'websites', 'testimonials', 'mentoring', 'richText', 'contact'])

function clean(value, depth, path) {
  if (depth > 14) throw new Error(`Content is nested too deeply at ${path}`)
  if (typeof value === 'string') {
    if (value.length > 60000) throw new Error(`Text is too long at ${path}`)
    if (DANGEROUS.test(value)) throw new Error(`Unsafe link or script at ${path}`)
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`Invalid number at ${path}`)
    return value
  }
  if (typeof value === 'boolean' || value === null) return value
  if (Array.isArray(value)) {
    if (value.length > 2000) throw new Error(`Too many items at ${path}`)
    return value.map((v, i) => clean(v, depth + 1, `${path}[${i}]`))
  }
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (BLOCKED_KEYS.has(k)) continue
      if (v === undefined) continue
      out[k] = clean(v, depth + 1, `${path}.${k}`)
    }
    return out
  }
  throw new Error(`Unsupported value at ${path}`)
}

export function validateContent(input) {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Content must be an object.' }
    if (Buffer.byteLength(JSON.stringify(input)) > MAX_BYTES) return { ok: false, error: 'Content is too large.' }
    const content = clean(input, 0, 'content')
    if (!content.portfolio || typeof content.portfolio !== 'object' || Array.isArray(content.portfolio)) return { ok: false, error: 'portfolio is required.' }
    for (const k of COLLECTIONS) {
      if (k in content && !Array.isArray(content[k])) return { ok: false, error: `${k} must be a list.` }
    }
    for (const k of COLLECTIONS) {
      if (k === 'categories') continue
      const ids = new Set()
      for (const item of content[k] ?? []) {
        if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id) return { ok: false, error: `Every item in ${k} needs an id.` }
        if (ids.has(item.id)) return { ok: false, error: `Duplicate id "${item.id}" in ${k}.` }
        ids.add(item.id)
      }
    }
    const sections = content.portfolio.sections
    if (sections !== undefined) {
      if (!Array.isArray(sections)) return { ok: false, error: 'sections must be a list.' }
      const ids = new Set()
      for (const s of sections) {
        if (!s || typeof s.id !== 'string' || !/^[a-z][a-z0-9-]{0,40}$/.test(s.id)) return { ok: false, error: 'Section ids must be lowercase letters, numbers and dashes.' }
        if (!SECTION_TYPES.has(s.type)) return { ok: false, error: `Unknown section type "${s.type}".` }
        if (ids.has(s.id)) return { ok: false, error: `Duplicate section id "${s.id}".` }
        ids.add(s.id)
      }
    }
    return { ok: true, content }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid content.' }
  }
}
