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

/** Real brand logos, filled. `tone="brand"` uses the brand's colour; `"current"` takes the surrounding text colour. */
export function BrandIcon({ name, size = 22, tone = 'brand' }: { name: string; size?: number; tone?: 'brand' | 'current' }) {
  const key = name.toLowerCase()
  const mark = PLATFORM_LOGOS[key]
  if (!mark) return <Globe aria-hidden size={size} strokeWidth={1.8} />
  const dark = parseInt(mark[0].slice(1), 16) < 0x333333
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden focusable="false" data-darkbrand={tone === 'brand' && dark ? '' : undefined}>
      <path d={mark[1]} fill={tone === 'brand' ? mark[0] : 'currentColor'} />
    </svg>
  )
}
