import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { ImageRef } from '../../content/types'
import { ratioOf } from '../../utils/media'
import { useContent } from '../../hooks/useContent'

const LABELS = {
  'before-after': ['Before', 'After'],
  'problem-solution': ['Problem', 'Solution'],
  'old-new': ['Old', 'New'],
  'baseline-result': ['Baseline', 'Result'],
} as const

export function BeforeAfter({ before, after, caption, variant = 'before-after', size }: { before: ImageRef; after: ImageRef; caption?: string; variant?: keyof typeof LABELS; size?: '' | 'small' | 'medium' | 'large' }) {
  const siteSize = useContent().content.portfolio.media.screenshotSize
  const [pos, setPos] = useState(50)
  const [measured, setMeasured] = useState<number | null>(null)
  // The frame takes the shape of the pictures themselves, so a long phone screenshot is shown from top to bottom, never trimmed.
  const ratio = ratioOf(after) ?? ratioOf(before) ?? measured ?? 4 / 3
  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => { if (!ratioOf(after) && !ratioOf(before)) setMeasured(e.currentTarget.naturalWidth / (e.currentTarget.naturalHeight || 1)) }
  const [l, r] = LABELS[variant]
  return (
    <figure className={`ba ba--${size || siteSize}`} style={{ ['--r' as string]: ratio } as CSSProperties}>
      <div className="ba__frame" style={{ ['--pos' as string]: `${pos}%`, aspectRatio: String(ratio) } as CSSProperties}>
        <img src={after.src} alt={after.alt || r} loading="lazy" draggable={false} onLoad={onLoad} />
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
