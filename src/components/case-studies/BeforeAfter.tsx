import { useState } from 'react'
import type { ImageRef } from '../../content/types'

export function BeforeAfter({ before, after, caption }: { before: ImageRef; after: ImageRef; caption?: string }) {
  const [pos, setPos] = useState(50)
  return (
    <figure className="ba">
      <div className="ba__frame" style={{ ['--pos' as string]: `${pos}%` }}>
        <img src={after.src} alt={after.alt} loading="lazy" draggable={false} />
        <img className="ba__before" src={before.src} alt={before.alt} loading="lazy" draggable={false} />
        <span className="ba__tag ba__tag--l">Before</span>
        <span className="ba__tag ba__tag--r">After</span>
        <span className="ba__handle" aria-hidden />
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Reveal before and after comparison" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
