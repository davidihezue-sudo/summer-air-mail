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

/** The automatic share preview card for a page, when the site has a public address to serve it from. */
export function ogCardUrl(p, key) {
  const base = baseUrl(p)
  return base ? `${base}/og/${encodeURIComponent(key)}.png` : ''
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
    image: absolute(p, seo.ogImage) || ogCardUrl(p, 'home'),
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

/** Names for the home-screen app, from settings the owner already edits: the SEO title and the profile name. */
export function appNames(p) {
  const person = clean(p?.profile?.preferredName) || clean(p?.profile?.fullName)
  const name = clean(p?.seo?.title) || person || 'Portfolio'
  return { name, shortName: person || name }
}

/** Web app manifest for "Add to Home Screen". Colours come from the design tokens, passed in by the caller. */
export function buildManifest(p, colors = {}) {
  const { name, shortName } = appNames(p)
  return {
    id: '/',
    name,
    short_name: shortName,
    description: clean(p?.seo?.description) || undefined,
    lang: String(p?.site?.locale ?? 'en-GB'),
    start_url: '/',
    scope: '/',
    display: 'standalone',
    ...(colors.background ? { background_color: colors.background } : {}),
    ...(colors.theme ? { theme_color: colors.theme } : {}),
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

/** The SEO block placed between the head markers in index.html. */
export function buildHeadTags(p) {
  const m = buildMeta(p)
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="apple-mobile-web-app-title" content="${esc(appNames(p).shortName)}" />`,
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

/** Dashboard and report sites that may be shown inside a page. Anything else is shown as a link instead. */
export const DASHBOARD_HOSTS = ['lookerstudio.google.com', 'datastudio.google.com', 'public.tableau.com', 'app.powerbi.com']

/** The address to put in the frame for a pasted dashboard link, or '' when the site is not on the list. Looker Studio share links are turned into embed links. */
export function dashboardEmbedUrl(url) {
  let u
  try { u = new URL(String(url ?? '').trim()) } catch { return '' }
  if (u.protocol !== 'https:' || !DASHBOARD_HOSTS.includes(u.hostname)) return ''
  if ((u.hostname === 'lookerstudio.google.com' || u.hostname === 'datastudio.google.com') && /^\/reporting\//.test(u.pathname)) u.pathname = `/embed${u.pathname}`
  return u.toString()
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
    `frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com ${DASHBOARD_HOSTS.map((h) => `https://${h}`).join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ')
}

const xml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])
const visibleNotes = (c) => (Array.isArray(c?.notes) ? c.notes : []).filter((n) => n && n.hidden !== true && n.title && n.slug)

/** RSS 2.0 feed of published notes. Empty string when there is nothing to publish or no site URL. */
export function buildFeed(c) {
  const p = c?.portfolio ?? {}
  const base = baseUrl(p)
  const notes = visibleNotes(c).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 50)
  if (!base || !notes.length) return ''
  const items = notes.map((n) => {
    const t = Date.parse(n.date)
    return `<item><title>${xml(n.title)}</title><link>${xml(`${base}/notes/${n.slug}`)}</link><guid isPermaLink="true">${xml(`${base}/notes/${n.slug}`)}</guid>${Number.isNaN(t) ? '' : `<pubDate>${new Date(t).toUTCString()}</pubDate>`}<description>${xml(n.summary)}</description></item>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${xml(clean(p.seo?.title) || clean(p.profile?.fullName))}</title><link>${xml(base)}/</link><description>${xml(clean(p.seo?.description))}</description>${items}</channel></rss>\n`
}

/** Sitemap with the home page, notes and the profile page. */
export function buildFullSitemap(c) {
  const p = c?.portfolio ?? {}
  const base = baseUrl(p)
  if (!base || p.seo?.robots === 'noindex') return ''
  const urls = [`${base}/`, ...(p.profilePage?.enabled ? [`${base}/profile`] : []), ...(p.card?.enabled ? [`${base}/card`] : []), ...visibleNotes(c).map((n) => `${base}/notes/${n.slug}`)]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${xml(u)}</loc></url>`).join('')}</urlset>\n`
}

/** Head overrides for a shareable page: a note, a project, or the profile. Returns null when the path is the home page. */
export function pageSeo(c, path) {
  const p = c?.portfolio ?? {}
  const base = baseUrl(p)
  let m
  if ((m = /^\/notes\/([^/]+)\/?$/.exec(path))) {
    const n = visibleNotes(c).find((x) => x.slug === decodeURIComponent(m[1]))
    if (!n) return { missing: true }
    return { title: clean(n.seoTitle) || `${n.title} | ${clean(p.profile?.fullName)}`, description: clean(n.seoDescription) || clean(n.summary), image: ogCardUrl(p, `note-${n.slug}`) || n.cover?.src || '', canonical: base ? `${base}/notes/${n.slug}` : '' }
  }
  if ((m = /^\/work\/([^/]+)\/?$/.exec(path))) {
    const x = (c.projects ?? []).find((q) => q.id === decodeURIComponent(m[1]) && q.hidden !== true)
    if (!x) return { missing: true }
    return { title: clean(x.seo?.title) || `${x.title} | ${clean(p.profile?.fullName)}`, description: clean(x.seo?.description) || clean(x.description).slice(0, 200), image: x.seo?.image || ogCardUrl(p, `work-${x.id}`) || x.thumbnail?.src || '', canonical: base ? `${base}/work/${x.id}` : '' }
  }
  if (/^\/card\/?$/.test(path)) return p.card?.enabled === true ? { title: `${clean(p.profile?.fullName)} | Business card`, description: clean(p.profile?.title), image: p.seo?.ogImage ?? '', canonical: base ? `${base}/card` : '' } : { missing: true }
  if (/^\/profile\/?$/.test(path)) return p.profilePage?.enabled === false ? { missing: true } : { title: clean(p.profilePage?.title) || `${clean(p.profile?.fullName)} | Profile`, description: clean(p.seo?.description), image: p.seo?.ogImage ?? '', canonical: base ? `${base}/profile` : '' }
  return null
}

/** Apply pageSeo output to a portfolio-shaped object for injectHead. */
export function withSeo(p, s) {
  return { ...p, seo: { ...p.seo, title: s.title, ogTitle: s.title, description: s.description, ogDescription: s.description, ogImage: s.image || p.seo?.ogImage || '', canonical: s.canonical || '' } }
}
