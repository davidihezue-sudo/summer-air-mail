import { BRAND_LOGOS } from './brandLogos'
import type { Tool } from './types'

/** Names people write, mapped to a built-in brand mark. Matching ignores case, spaces and punctuation. */
const ALIASES: Record<string, string> = {
  metabusinesssuite: 'meta', metaadsmanager: 'meta', meta: 'meta', facebook: 'facebook', facebookads: 'facebook', instagram: 'instagram', tiktok: 'tiktok', tiktokads: 'tiktok',
  youtube: 'youtube', youtubestudio: 'youtube', pinterest: 'pinterest', x: 'x', twitter: 'x', threads: 'threads', snapchat: 'snapchat',
  hootsuite: 'hootsuite', buffer: 'buffer', googleanalytics: 'googleanalytics', ga4: 'googleanalytics', googleads: 'googleads', googletagmanager: 'googletagmanager',
  googlesearchconsole: 'googlesearchconsole', mailchimp: 'mailchimp', hubspot: 'hubspot', claude: 'claude', anthropic: 'anthropic', gemini: 'googlegemini', googlegemini: 'googlegemini',
  perplexity: 'perplexity', notion: 'notion', figma: 'figma', trello: 'trello', asana: 'asana', zapier: 'zapier', shopify: 'shopify', wordpress: 'wordpress', wix: 'wix',
  squarespace: 'squarespace', linktree: 'linktree', semrush: 'semrush', hotjar: 'hotjar', webflow: 'webflow', davinciresolve: 'davinciresolve', airtable: 'airtable',
  googledocs: 'googledocs', googlesheets: 'googlesheets', googledrive: 'googledrive', zoom: 'zoom', loom: 'loom', miro: 'miro', clickup: 'clickup', substack: 'substack',
  medium: 'medium', spotify: 'spotify', twitch: 'twitch', reddit: 'reddit', whatsapp: 'whatsapp', telegram: 'telegram', discord: 'discord', github: 'github', looker: 'looker',
  lookerstudio: 'looker', elevenlabs: 'elevenlabs', unsplash: 'unsplash', pexels: 'pexels', giphy: 'giphy', obs: 'obsstudio', obsstudio: 'obsstudio',
  grok: 'grok', grokai: 'grok', xaigrok: 'grok', chatgpt: 'chatgpt', chatgpt4: 'chatgpt', chatgpt5: 'chatgpt', openai: 'openai', canva: 'canva', canvapro: 'canva', linkedin: 'linkedin', slack: 'slack',
  adobe: 'adobe', adobecreativecloud: 'adobecreativecloud', creativecloud: 'adobecreativecloud', adobecc: 'adobecreativecloud', photoshop: 'adobephotoshop', adobephotoshop: 'adobephotoshop',
  premiere: 'adobepremierepro', premierepro: 'adobepremierepro', adobepremierepro: 'adobepremierepro', adobepremiere: 'adobepremierepro', aftereffects: 'adobeaftereffects', adobeaftereffects: 'adobeaftereffects',
  illustrator: 'adobeillustrator', adobeillustrator: 'adobeillustrator', lightroom: 'adobelightroom', adobelightroom: 'adobelightroom',
  capcut: 'capcut', midjourney: 'midjourney', runway: 'runway', runwayml: 'runway', pika: 'pika', tableau: 'tableau', powerbi: 'powerbi', microsoftpowerbi: 'powerbi',
  word: 'microsoftword', microsoftword: 'microsoftword', excel: 'microsoftexcel', microsoftexcel: 'microsoftexcel', powerpoint: 'microsoftpowerpoint', microsoftpowerpoint: 'microsoftpowerpoint', teams: 'microsoftteams', microsoftteams: 'microsoftteams',
}

/** Brand colours for tools that have no built-in mark yet (Sprout Social, Later, Klaviyo and similar). They get a plain monogram tile in the brand's colour until the owner uploads the official logo in the admin. */
const KNOWN_COLORS: Record<string, string> = {
  canva: '#00C4CC', adobecreativecloud: '#DA1F26', adobe: '#DA1F26', adobephotoshop: '#31A8FF', adobepremierepro: '#9999FF', adobeaftereffects: '#9999FF', lightroom: '#31A8FF',
  capcut: '#111111', linkedin: '#0A66C2', sproutsocial: '#59CB59', later: '#FF6D4D', chatgpt: '#10A37F', openai: '#10A37F', midjourney: '#1F1F1F', slack: '#4A154B',
  klaviyo: '#1E1E1E', convertkit: '#FB6970', ahrefs: '#FF7A00', moz: '#4A90E2', agorapulse: '#FF6F59', metricool: '#1A73E8', planoly: '#FF5C8A', socialbee: '#F5B800',
  descript: '#1F1F1F', heygen: '#6C4DFF', synthesia: '#4B3FFF', runway: '#1F1F1F', finalcutpro: '#1F1F1F', tableau: '#E97627', powerbi: '#F2C811',
}

export const brandKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

export type Brand =
  | { kind: 'image'; src: string }
  | { kind: 'svg'; slug: string; title: string; color: string; path: string; evenodd: boolean }
  | { kind: 'mono'; text: string; color: string }

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
const HEX = /^#[0-9a-f]{6}$/i
const SAFE_URL = /^(\/[\w\-./%]+|https:\/\/[\w\-./%?=&:+~@]+)$/

/** Which mark to show for a tool: an uploaded or linked image, a built-in brand mark, or a monogram. */
export function brandFor(t: Pick<Tool, 'name' | 'logo' | 'logoUrl' | 'logoSlug' | 'color'>): Brand {
  if (t.logo && SAFE_URL.test(t.logo)) return { kind: 'image', src: t.logo }
  if (t.logoUrl && SAFE_URL.test(t.logoUrl)) return { kind: 'image', src: t.logoUrl }
  const key = brandKey(t.name)
  const slug = t.logoSlug && BRAND_LOGOS[t.logoSlug] ? t.logoSlug : ALIASES[key] && BRAND_LOGOS[ALIASES[key]] ? ALIASES[key] : ''
  const color = t.color && HEX.test(t.color) ? t.color : ''
  if (slug) {
    const [title, hex, path, rule] = BRAND_LOGOS[slug] as [string, string, string, string?]
    return { kind: 'svg', slug, title, color: color || hex, path, evenodd: rule === 'evenodd' }
  }
  return { kind: 'mono', text: initials(t.name), color: color || KNOWN_COLORS[key] || '#2A8DB0' }
}

export const BRAND_CHOICES = Object.entries(BRAND_LOGOS).map(([slug, v]) => ({ value: slug, label: v[0] })).sort((a, b) => a.label.localeCompare(b.label))

/** A self-contained picture of the mark, for lists in the admin. */
export function brandDataUri(b: Brand, mono = false): string {
  if (b.kind === 'image') return b.src
  const fg = mono ? '#17323f' : b.color
  const svg = b.kind === 'svg'
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${fg}"${b.evenodd ? ' fill-rule="evenodd"' : ''} d="${b.path}"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="${b.color}"/><text x="24" y="31" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="20" fill="#fff">${b.text.replace(/[<&]/g, '')}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const PLATFORM_NAMES: Record<string, string> = { x: 'X', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', whatsapp: 'WhatsApp' }

/** A platform treated like a tool for logo purposes, so both share one mark and one tile style. */
export function platformAsTool(p: { platform: string; logo?: string; color?: string }): Pick<Tool, 'name' | 'logo' | 'logoSlug' | 'color'> {
  const name = PLATFORM_NAMES[p.platform.toLowerCase()] ?? p.platform.charAt(0).toUpperCase() + p.platform.slice(1)
  return { name, logo: p.logo, color: p.color, logoSlug: BRAND_LOGOS[p.platform.toLowerCase()] ? p.platform.toLowerCase() : undefined }
}

/** The colour to accent a tool with: its logo colour, or the site's sea blue. */
export function brandColor(t: Pick<Tool, 'name' | 'logo' | 'logoUrl' | 'logoSlug' | 'color'>): string {
  const b = brandFor(t)
  if (b.kind === 'image') return t.color && HEX.test(t.color) ? t.color : '#2A8DB0'
  // Near black brands would vanish on the dark section, so they get the site colour.
  return parseInt(b.color.slice(1), 16) < 0x404040 ? '#2A8DB0' : b.color
}
