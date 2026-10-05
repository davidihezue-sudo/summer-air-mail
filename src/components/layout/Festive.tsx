import { useTheme } from '../../hooks/useTheme'

const rnd = (i: number, salt: number) => Math.abs(Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453) % 1

/** String lights and fireworks for a celebration. Decorative only; falling decorations are drawn by Decor. */
export function Festive() {
  const { resolved, plan, professional } = useTheme()
  const c = resolved.celebration
  if (!c || professional === 'professional') return null
  const has = (id: string) => resolved.decorations.includes(id)
  const still = plan.reduced
  const bursts = has('fireworks') && !still ? [0, 1, 2, 3] : []
  if (!has('lights') && !bursts.length) return null
  return (
    <div className={`festive${still ? ' festive--still' : ''}`} aria-hidden>
      {has('lights') && (
        <ul className="festive__lights">
          {Array.from({ length: 30 }, (_, i) => <li key={i} style={{ ['--i' as string]: i }} />)}
        </ul>
      )}
      {bursts.map((i) => (
        <i
          key={i}
          className="festive__burst"
          style={{
            left: `${12 + rnd(i, 1) * 76}%`, top: `${10 + rnd(i, 2) * 38}%`,
            animationDelay: `${-rnd(i, 3) * 6}s`, animationDuration: `${(3.2 + rnd(i, 4) * 2) / plan.speed}s`,
            ['--b1' as string]: i % 2 ? 'var(--c-butter)' : 'var(--c-pink)', ['--b2' as string]: i % 2 ? 'var(--c-aqua)' : 'var(--c-butter)',
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
