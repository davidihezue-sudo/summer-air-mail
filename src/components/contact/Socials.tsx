import type { SocialLinks } from '../../content/types'
import { safeHref } from '../../utils/text'
import { BrandIcon, platformLabel } from '../ui/Icons'

const ORDER: (keyof SocialLinks)[] = ['linkedin', 'instagram', 'tiktok', 'facebook', 'youtube', 'pinterest', 'website']

export function socialEntries(social: SocialLinks) {
  return ORDER.map((key) => ({ key, label: platformLabel(key), href: safeHref(social[key]) })).filter((s) => s.href)
}

export function SocialRow({ social }: { social: SocialLinks }) {
  const entries = socialEntries(social)
  if (!entries.length) return null
  return (
    <ul className="social-row">
      {entries.map((s) => (
        <li key={s.key}>
          <a className="social-pill" href={s.href} target="_blank" rel="noopener noreferrer">
            <BrandIcon name={s.key} size={20} />
            <span>{s.label}</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
