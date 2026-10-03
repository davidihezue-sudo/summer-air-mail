import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react'
import type { ImageRef } from '../../content/types'
import { Modal } from './Modal'

export interface ViewerImage extends ImageRef {
  caption?: string
}

interface Props {
  images: ViewerImage[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}

/** Full screen image viewer with zoom (buttons, wheel, double click, +/- keys) and drag to pan. */
export function ImageViewer({ images, index, onIndex, onClose }: Props) {
  const open = images.length > 0 && index >= 0
  return (
    <Modal open={open} onClose={onClose} label="Image viewer" className="dialog dialog--viewer">
      {open && <Body images={images} index={Math.min(index, images.length - 1)} onIndex={onIndex} />}
    </Modal>
  )
}

function Body({ images, index, onIndex }: Omit<Props, 'onClose'>) {
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const img = images[index]
  const go = (d: number) => { setScale(1); setPos({ x: 0, y: 0 }); onIndex((index + d + images.length) % images.length) }
  const zoom = (f: number) => setScale((s) => { const n = Math.min(4, Math.max(1, s * f)); if (n === 1) setPos({ x: 0, y: 0 }); return n })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && images.length > 1) go(1)
      else if (e.key === 'ArrowLeft' && images.length > 1) go(-1)
      else if (e.key === '+' || e.key === '=') zoom(1.4)
      else if (e.key === '-') zoom(1 / 1.4)
      else if (e.key === '0') { setScale(1); setPos({ x: 0, y: 0 }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images.length])

  return (
    <figure className="viewer">
      <div
        className="viewer__stage"
        style={{ cursor: scale > 1 ? 'grab' : 'zoom-in', touchAction: scale > 1 ? 'none' : 'pan-y' }}
        onWheel={(e) => { if (e.ctrlKey || e.deltaY) zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15) }}
        onDoubleClick={() => (scale > 1 ? (setScale(1), setPos({ x: 0, y: 0 })) : setScale(2))}
        onPointerDown={(e) => { if (scale > 1) { drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId) } }}
        onPointerMove={(e) => { if (drag.current) setPos({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y }) }}
        onPointerUp={() => { drag.current = null }}
      >
        <img src={img.src} alt={img.alt} draggable={false} style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }} />
      </div>
      <div className="viewer__bar">
        {images.length > 1 && <button type="button" onClick={() => go(-1)} aria-label="Previous image"><ChevronLeft aria-hidden /></button>}
        <button type="button" onClick={() => zoom(1 / 1.4)} aria-label="Zoom out" disabled={scale <= 1}><Minus aria-hidden /></button>
        <button type="button" onClick={() => { setScale(1); setPos({ x: 0, y: 0 }) }} aria-label="Reset zoom"><RotateCcw aria-hidden /></button>
        <button type="button" onClick={() => zoom(1.4)} aria-label="Zoom in" disabled={scale >= 4}><Plus aria-hidden /></button>
        {images.length > 1 && <button type="button" onClick={() => go(1)} aria-label="Next image"><ChevronRight aria-hidden /></button>}
      </div>
      {(img.caption || images.length > 1) && (
        <figcaption className="viewer__caption" aria-live="polite">
          {img.caption}{images.length > 1 && <span className="muted"> {index + 1} / {images.length}</span>}
        </figcaption>
      )}
    </figure>
  )
}
