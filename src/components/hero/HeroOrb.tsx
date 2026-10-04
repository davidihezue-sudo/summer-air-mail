import type { CSSProperties } from 'react'
import type { HeroOrb as Orb } from '../../content/types'
import { toneValue } from '../../utils/theme'

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, Number.isFinite(n) ? n : a))

/** Satellite positions: a fixed spiral, so the arrangement is stable between renders and visits. */
export function satellites(count: number) {
  return Array.from({ length: Math.round(clamp(count, 0, 8)) }, (_, i) => {
    const a = (i * 137.5 + 20) * (Math.PI / 180)
    const r = 58 + (i % 3) * 14
    return { x: 50 + Math.cos(a) * r, y: 50 + Math.sin(a) * r, s: 7 + ((i * 5) % 9), d: (i * 1.3) % 6 }
  })
}

/** The big circle behind the stamp. A glassy water bubble by default, with every part adjustable in the admin. */
export function HeroOrb({ orb }: { orb: Orb }) {
  if (orb.style === 'none') return null
  const fallback = orb.style === 'bubble' ? 'var(--c-aqua)' : orb.style === 'ring' ? 'var(--c-sea)' : 'var(--sun)'
  const style = {
    '--ox': clamp(orb.x, -20, 120), '--oy': clamp(orb.y, -20, 120), '--os': clamp(orb.size, 15, 120),
    '--oo': clamp(orb.opacity, 0.1, 1), '--oc': toneValue(orb.color) || fallback, '--orim': clamp(orb.rim, 0, 1),
    '--ob': `${clamp(orb.blur, 0, 24)}px`, '--of': clamp(orb.float, 0, 80), '--par': clamp(orb.parallax, 0, 100) / 100,
  } as CSSProperties
  return (
    <div className="orb" data-style={orb.style} data-wobble={orb.wobble} data-shine={orb.shine} style={style} aria-hidden>
      <span className="orbfx orbfx--main" />
      {orb.style === 'bubble' && satellites(orb.satellites).map((s, i) => (
        <span key={i} className="orbfx orbfx--sat" style={{ '--sx': `${s.x}%`, '--sy': `${s.y}%`, '--ss': `${s.s}%`, '--sd': `${s.d}s` } as CSSProperties} />
      ))}
    </div>
  )
}
