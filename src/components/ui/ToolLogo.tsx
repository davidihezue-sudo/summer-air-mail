import { brandFor, type Brand } from '../../content/brands'
import type { Tool } from '../../content/types'

const SIZE = { sm: 28, md: 40, lg: 56 }

/** The tool's logo on a clean tile. Decorative: the tool's name is always written next to it. */
export function ToolLogo({ tool, size = 'md', mono = false }: { tool: Pick<Tool, 'name' | 'logo' | 'logoUrl' | 'logoSlug' | 'color'>; size?: 'sm' | 'md' | 'lg'; mono?: boolean }) {
  const b: Brand = brandFor(tool)
  const px = SIZE[size]
  return (
    <span className={`toollogo toollogo--${size}`} aria-hidden="true">
      {b.kind === 'image' ? <img src={b.src} alt="" width={px} height={px} loading="lazy" />
        : b.kind === 'svg' ? <svg viewBox="0 0 24 24" width={px} height={px} focusable="false"><path d={b.path} fill={mono ? 'currentColor' : b.color} /></svg>
        : <span className="toollogo__mono" style={{ background: b.color }}>{b.text}</span>}
    </span>
  )
}
