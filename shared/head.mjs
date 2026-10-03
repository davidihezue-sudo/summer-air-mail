// Shared by the build (vite.config.ts), the Node server and the browser.
// Pure functions, no dependencies. Types are intentionally loose: input comes from stored JSON.

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const isHttp = (u) => /^https?:\/\//i.test(String(u ?? ''))

export function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function baseUrl(p) {
  return String(p?.site?.url ?? '').replace(/\/$/, '')
}

function absolute(p, path) {
  if (!path) return ''
  if (isHttp(path)) return path
  const base = baseUrl(p)
  return base ? `${base}${path.startsWith('/') ? '' : '/'}${path}` : path
}

export function buildMeta(p) {
  const seo = p.seo ?? {}
  const title = clean(seo.title) || `${clean(p.profile?.fullName)} | Portfolio`
  const description = clean(seo.description)
  const base = baseUrl(p)
  return {
    lang: String(p.site?.locale ?? 'en-GB').split('-')[0] || 'en',
    title,
    description,
    keywords: clean(seo.keywords),
    ogTitle: clean(seo.ogTitle) || title,
    ogDescription: clean(seo.ogDescription) || description,
    url: isHttp(seo.canonical) ? seo.canonical : base ? `${base}/` : '/',
    image: absolute(p, seo.ogImage),
    robots: seo.robots === 'noindex' ? 'noindex, nofollow' : 'index, follow',
  }
}

export function buildJsonLd(p) {
  const profile = p.profile ?? {}
  const sameAs = Object.values(profile.social ?? {}).filter(isHttp)
  const person = {
    '@type': 'Person',
    name: profile.fullName,
    jobTitle: profile.title,
    description: clean(p.seo?.description),
  }
  if (baseUrl(p)) person.url = baseUrl(p)
  if (sameAs.length) person.sameAs = sameAs
  if (profile.location) person.workLocation = { '@type': 'Place', name: profile.location }
  return {
    '@context': 'https://schema.org',
    '@graph': [person, { '@type': 'WebSite', name: clean(p.seo?.title), ...(baseUrl(p) ? { url: baseUrl(p) } : {}) }],
  }
}

/** The SEO block placed between the head markers in index.html. */
export function buildHeadTags(p) {
  const m = buildMeta(p)
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    m.keywords ? `<meta name="keywords" content="${esc(m.keywords)}" />` : '',
    `<meta name="robots" content="${m.robots}" />`,
    /^https?:\/\//.test(m.url) ? `<link rel="canonical" href="${esc(m.url)}" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(m.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(m.ogDescription)}" />`,
    /^https?:\/\//.test(m.url) ? `<meta property="og:url" content="${esc(m.url)}" />` : '',
    m.image ? `<meta property="og:image" content="${esc(m.image)}" />` : '',
    `<meta name="twitter:card" content="${m.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(m.ogTitle)}" />`,
    `<meta name="twitter:description" content="${esc(m.ogDescription)}" />`,
    m.image ? `<meta name="twitter:image" content="${esc(m.image)}" />` : '',
    p.seo?.structuredData === false
      ? ''
      : `<script type="application/ld+json">${JSON.stringify(buildJsonLd(p)).replace(/</g, '\\u003c')}</script>`,
  ]
  return tags.filter(Boolean).join('\n    ')
}

export function injectHead(html, p) {
  const m = buildMeta(p)
  return html
    .replace(/<html lang="[^"]*"/, `<html lang="${esc(m.lang)}"`)
    .replace(/<!--head:start-->[\s\S]*?<!--head:end-->/, `<!--head:start-->\n    ${buildHeadTags(p)}\n    <!--head:end-->`)
}

export function buildRobots(p) {
  const base = baseUrl(p)
  if (p.seo?.robots === 'noindex') return 'User-agent: *\nDisallow: /\n'
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`
}

export function buildSitemap(p) {
  const base = baseUrl(p)
  if (!base || p.seo?.robots === 'noindex') return ''
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(base)}/</loc></url></urlset>\n`
}

/** Content Security Policy built from the analytics the owner has switched on. */
export function buildCsp(p) {
  const a = p.analytics ?? {}
  const on = a.enabled
  const script = ["'self'"]
  const connect = ["'self'"]
  const img = ["'self'", 'data:', 'blob:', 'https:']
  if (on && a.ga4) { script.push('https://www.googletagmanager.com'); connect.push('https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com') }
  if (on && a.gtm) { script.push('https://www.googletagmanager.com'); connect.push('https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://www.googletagmanager.com') }
  if (on && a.metaPixel) { script.push('https://connect.facebook.net'); connect.push('https://www.facebook.com', 'https://connect.facebook.net') }
  return [
    "default-src 'self'",
    `script-src ${[...new Set(script)].join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img.join(' ')}`,
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src ${[...new Set(connect)].join(' ')}`,
    "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ')
}
