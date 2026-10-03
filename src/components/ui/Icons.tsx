import { Globe } from 'lucide-react'
import type { SVGProps } from 'react'

const common: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
}

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

export function BrandIcon({ name, size = 22 }: { name: string; size?: number }) {
  const props = { ...common, width: size, height: size }
  switch (name.toLowerCase()) {
    case 'instagram':
      return (<svg {...props}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" fill="currentColor" /></svg>)
    case 'facebook':
      return (<svg {...props}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" /></svg>)
    case 'linkedin':
      return (<svg {...props}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10.5V17M8 7.5v.01M12 17v-3.5a2.5 2.5 0 0 1 5 0V17M12 10.5V17" /></svg>)
    case 'tiktok':
      return (<svg {...props}><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.4 2 4 5 4.2" /></svg>)
    case 'youtube':
      return (<svg {...props}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.5v5l4.5-2.5z" /></svg>)
    case 'pinterest':
      return (<svg {...props}><circle cx="12" cy="12" r="9" /><path d="M11 9.5 9.2 18M10 13c1.5 1.3 4.4.8 4.4-2 0-1.6-1.3-2.6-2.7-2.6-1.8 0-3 1.3-3 2.7" /></svg>)
    case 'whatsapp':
      return (<svg {...props}><path d="M3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 8 19.3z" /><path d="M9 8.5c0 3 3 6 6 6l1-1.2-2-1-.9.7c-.9-.4-1.9-1.3-2.3-2.3l.7-.9-1-2z" /></svg>)
    default:
      return <Globe aria-hidden size={size} strokeWidth={1.8} />
  }
}
