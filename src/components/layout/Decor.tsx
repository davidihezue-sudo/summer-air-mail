import { useMemo } from 'react'
import { useTheme } from '../../hooks/useTheme'

const rnd = (i: number, salt: number) => Math.abs(Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453) % 1

interface Particle { kind: string; style: React.CSSProperties }

/**
 * Seasonal decorative particles. A fixed, non-interactive layer using only transform and opacity.
 * The count comes from the motion plan, the kinds from the season's enabled decorations.
 */
export function Decor() {
  const { resolved, plan, professional } = useTheme()
  const kinds = resolved.decorations.filter((d) => d !== 'bubbles' && d !== 'glow' && d !== 'frost' && d !== 'lights' && d !== 'fireworks')
  const total = plan.particles
  const particles = useMemo<Particle[]>(() => {
    if (!total || !kinds.length) return []
    return Array.from({ length: total }, (_, i) => {
      const kind = kinds[i % kinds.length]
      const size = kind === 'stars' || kind === 'glints' ? 8 + rnd(i, 1) * 10 : kind === 'snow' ? 4 + rnd(i, 1) * 6 : kind === 'confetti' ? 6 + rnd(i, 1) * 5 : kind === 'hearts' ? 12 + rnd(i, 1) * 12 : 12 + rnd(i, 1) * 14
      return {
        kind,
        style: {
          left: `${rnd(i, 2) * 100}%`,
          width: size,
          height: kind === 'petals' || kind === 'leaves' ? size * 1.35 : kind === 'confetti' ? size * 1.7 : size,
          animationDuration: `${(kind === 'glints' || kind === 'stars' ? 5 + rnd(i, 3) * 5 : 14 + rnd(i, 3) * 14) / plan.speed}s`,
          animationDelay: `${-rnd(i, 4) * 24}s`,
          ['--sway' as string]: `${(rnd(i, 5) - 0.5) * 160}px`,
          ['--spin' as string]: `${(rnd(i, 6) - 0.5) * 720}deg`,
          ['--hue' as string]: `${Math.floor(rnd(i, 7) * 3)}`,
          top: kind === 'glints' || kind === 'stars' ? `${rnd(i, 8) * 90}%` : undefined,
        } as React.CSSProperties,
      }
    })
  }, [total, kinds.join('|'), plan.speed]) // eslint-disable-line react-hooks/exhaustive-deps

  const calm = professional === 'professional' || plan.level === 'none'
  const showGlow = resolved.decorations.includes('glow') && !calm
  const showFrost = resolved.decorations.includes('frost') && !calm
  if (!particles.length && !showGlow && !showFrost) return null
  return (
    <div className="decor" aria-hidden>
      {showGlow && <div className="decor__glow" />}
      {showFrost && <div className="decor__frost" />}
      {particles.map((p, i) => <i key={i} className={`decor__p decor__p--${p.kind}`} style={p.style} data-h={(p.style as Record<string, string>)['--hue']} />)}
    </div>
  )
}
