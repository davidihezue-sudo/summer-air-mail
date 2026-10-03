// What visitors are allowed to download. The published copy keeps everything the owner saved
// (so Discard and Restore work), but draft, hidden and unapproved items must never leave the server.

const HIDEABLE = ['projects', 'services', 'contentItems', 'websites', 'platforms', 'aiSkills', 'results', 'screenshots', 'process']

export function publicView(content) {
  if (!content || typeof content !== 'object') return null
  const out = { ...content }
  for (const key of HIDEABLE) {
    if (Array.isArray(content[key])) out[key] = content[key].filter((x) => x && x.hidden !== true)
  }
  if (Array.isArray(content.testimonials)) out.testimonials = content.testimonials.filter((t) => t && t.approved === true)
  if (Array.isArray(content.tools)) out.tools = content.tools.filter((t) => t && t.confirmed === true)
  if (Array.isArray(content.skills)) {
    out.skills = content.skills
      .filter((g) => g && g.hidden !== true)
      .map((g) => ({ ...g, skills: (g.skills ?? []).filter((s) => s && s.visible === true) }))
      .filter((g) => g.skills.length > 0)
  }
  // Drop references to items that were removed above so nothing points at private content.
  const live = new Set(HIDEABLE.flatMap((k) => (out[k] ?? []).map((x) => x.id)))
  if (Array.isArray(out.projects)) {
    out.projects = out.projects.map((p) => {
      const q = { ...p }
      for (const k of ['serviceIds', 'toolIds', 'aiSkillIds', 'resultIds', 'contentIds', 'screenshotIds', 'relatedIds']) {
        if (Array.isArray(q[k])) q[k] = q[k].filter((id) => live.has(id) || k === 'toolIds')
      }
      return q
    })
  }
  return out
}
