import { Globe } from 'lucide-react'
import { PLATFORM_LOGOS } from '../../content/platformLogos'

export const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  whatsapp: 'WhatsApp',
  website: 'Website',
  web: 'Web',
}

export function platformLabel(p: string): string {
  return PLATFORM_LABEL[p.toLowerCase()] ?? p
}

const LINKEDIN_PATH = 'M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zm4.3 1.1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM5.8 11.5v6.7h3v-6.7zm5.1 0v6.7h3v-3.7c0-1 .3-1.9 1.5-1.9s1.3 1.1 1.3 2v3.6h3v-4.2c0-2.4-.5-4.2-3.3-4.2-1.4 0-2.4.6-2.9 1.4v-1.7z'

/** Real brand logos, filled. `tone="brand"` uses the brand's colour; `"current"` takes the surrounding text colour. */
export function BrandIcon({ name, size = 22, tone = 'brand' }: { name: string; size?: number; tone?: 'brand' | 'current' }) {
  const key = name.toLowerCase()
  const mark = key === 'linkedin' ? (['#0A66C2', LINKEDIN_PATH] as [string, string]) : PLATFORM_LOGOS[key]
  if (!mark) return <Globe aria-hidden size={size} strokeWidth={1.8} />
  const dark = parseInt(mark[0].slice(1), 16) < 0x333333
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden focusable="false" data-darkbrand={tone === 'brand' && dark ? '' : undefined}>
      <path d={mark[1]} fill={tone === 'brand' ? mark[0] : 'currentColor'} />
    </svg>
  )
}
