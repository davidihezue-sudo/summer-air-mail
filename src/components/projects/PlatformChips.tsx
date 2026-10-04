import { BrandIcon, platformLabel } from '../ui/Icons'

export function PlatformIcons({ platforms }: { platforms: string[] }) {
  if (!platforms.length) return null
  return (
    <ul className="platform-icons" aria-label={`Platforms: ${platforms.map(platformLabel).join(', ')}`}>
      {platforms.map((p) => (
        <li key={p} title={platformLabel(p)}><BrandIcon name={p} size={18} /></li>
      ))}
    </ul>
  )
}
