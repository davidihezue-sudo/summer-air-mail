import { useState } from 'react'
import type { ImageRef } from '../../content/types'

const LABELS = {
  'before-after': ['Before', 'After'],
  'problem-solution': ['Problem', 'Solution'],
  'old-new': ['Old', 'New'],
  'baseline-result': ['Baseline', 'Result'],
} as const

export function BeforeAfter({ before, after, caption, variant = 'before-after' }: { before: ImageRef; after: ImageRef; caption?: string; variant?: keyof typeof LABELS }) {
  const [pos, setPos] = useState(50)
  const [l, r] = LABELS[variant]
  return (
    <figure className="ba">
      <div className="ba__frame" style={{ ['--pos' as string]: `${pos}%` }}>
        <img src={after.src} alt={after.alt || r} loading="lazy" draggable={false} />
        <img className="ba__before" src={before.src} alt={before.alt || l} loading="lazy" draggable={false} />
        <span className="ba__tag ba__tag--l">{l}</span>
        <span className="ba__tag ba__tag--r">{r}</span>
        <span className="ba__handle" aria-hidden />
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={`Reveal ${l.toLowerCase()} and ${r.toLowerCase()} comparison`} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
