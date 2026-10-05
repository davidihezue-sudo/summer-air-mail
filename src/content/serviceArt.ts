import type { Service } from './types'

/** The drawings the Capabilities section can show. The value is what is stored in a service's "object". */
export const SERVICE_DRAWINGS: { value: string; label: string }[] = [
  { value: 'compass', label: 'Compass: strategy' },
  { value: 'camera', label: 'Camera: content and photography' },
  { value: 'phone', label: 'Phone: social media' },
  { value: 'palette', label: 'Paint palette: brand and design' },
  { value: 'megaphone', label: 'Megaphone: campaigns and ads' },
  { value: 'chart', label: 'Bar chart: analytics and reporting' },
  { value: 'calendar', label: 'Calendar: planning and scheduling' },
  { value: 'pen', label: 'Pencil: copywriting' },
  { value: 'book', label: 'Open book: storytelling' },
  { value: 'clapper', label: 'Clapperboard: video and Reels' },
  { value: 'bubbles', label: 'Speech bubbles: community and engagement' },
  { value: 'seedling', label: 'Seedling: audience growth' },
  { value: 'star', label: 'Star: influencers and creators' },
  { value: 'magnifier', label: 'Magnifier: listening and research' },
  { value: 'mail', label: 'Envelope: email and newsletters' },
  { value: 'chip', label: 'Chip: AI and automation' },
]

/** Earlier versions stored these six names, which were seasonal props. They now point at the drawing that says what the service is. */
export const LEGACY_DRAWINGS: Record<string, string> = { sunglasses: 'compass', sunscreen: 'palette', flipflops: 'megaphone', watermelon: 'chart', camera: 'camera', phone: 'phone' }

// First match wins, so the more specific words come first.
const RULES: [RegExp, string][] = [
  [/schedul|calendar|planning/, 'calendar'],
  [/reel|short.?form|video|film|youtube/, 'clapper'],
  [/campaign|\bads?\b|advertis|paid/, 'megaphone'],
  [/strateg/, 'compass'],
  [/analytic|report|dashboard|insight|metric|measure|data/, 'chart'],
  [/brand|design|graphic|visual|identity/, 'palette'],
  [/copy|writing|caption|editorial/, 'pen'],
  [/story|narrative/, 'book'],
  [/photo|content|camera|shoot/, 'camera'],
  [/communit|moderat|engag|reply|comment/, 'bubbles'],
  [/listen|research|monitor|search|seo/, 'magnifier'],
  [/growth|grow|follower|audience/, 'seedling'],
  [/influenc|creator|ambassador|collab|partner/, 'star'],
  [/email|newsletter|mail/, 'mail'],
  [/\bai\b|automat|workflow|crm|technolog/, 'chip'],
  [/manage|social|channel|platform/, 'phone'],
]

/** The drawing for a service: its own choice, else one that fits its name, else none (the icon is used). */
export function drawingFor(s: Pick<Service, 'id' | 'name' | 'object' | 'icon'>): string {
  if (s.object) return LEGACY_DRAWINGS[s.object] ?? s.object
  if (s.icon && s.icon !== 'Sparkles') return ''
  const text = `${s.name} ${s.id}`.toLowerCase()
  return RULES.find(([re]) => re.test(text))?.[1] ?? ''
}
