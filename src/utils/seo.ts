import type { Portfolio } from '../content/types'

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

export function buildMeta(p: Portfolio) {
  const base = p.site.url.replace(/\/$/, '')
  const image = p.site.ogImage ? (p.site.ogImage.startsWith('http') ? p.site.ogImage : `${base}${p.site.ogImage}`) : ''
  return {
    lang: p.site.locale.split('-')[0] || 'en',
    title: clean(p.site.title),
    description: clean(p.site.description),
    url: base ? `${base}/` : '/',
    image,
  }
}

export function buildJsonLd(p: Portfolio) {
  const sameAs = Object.values(p.profile.social).filter((u) => /^https?:\/\//.test(u))
  const person: Record<string, unknown> = {
    '@type': 'Person',
    name: p.profile.fullName,
    jobTitle: p.profile.title,
    description: p.site.description,
  }
  if (p.site.url) person.url = p.site.url
  if (sameAs.length) person.sameAs = sameAs
  if (p.profile.location) person.workLocation = { '@type': 'Place', name: p.profile.location }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      { '@type': 'WebSite', name: p.site.title, ...(p.site.url ? { url: p.site.url } : {}) },
    ],
  }
}
