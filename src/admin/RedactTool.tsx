import { useEffect, useRef, useState } from 'react'
import { Modal } from '../components/ui/Modal'

interface Box { x: number; y: number; w: number; h: number; mode: 'pixel' | 'cover' }

/**
 * Hide sensitive parts of an image before it is uploaded. Pixelation and solid covers are applied to the
 * pixels themselves, so the hidden detail is destroyed in the file that gets saved, not just masked on screen.
 */
export function RedactTool({ src, name, onDone }: { src: string; name: string; onDone: (blob: Blob | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const original = useRef<HTMLImageElement | null>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [mode, setMode] = useState<'pixel' | 'cover'>('pixel')
  const [draft, setDraft] = useState<Box | null>(null)
  const [ready, setReady] = useState(false)
  const drag = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      original.current = img
      const c = canvas.current!
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      setReady(true)
    }
    img.src = src
  }, [src])

  const draw = (list: Box[], extra: Box | null, preview: boolean) => {
    const c = canvas.current
    const img = original.current
    if (!c || !img) return
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    for (const b of [...list, ...(extra ? [extra] : [])]) {
      const x = Math.max(0, Math.round(b.x)), y = Math.max(0, Math.round(b.y))
      const w = Math.min(c.width - x, Math.round(b.w)), h = Math.min(c.height - y, Math.round(b.h))
      if (w < 2 || h < 2) continue
      if (b.mode === 'cover') {
        ctx.fillStyle = '#111'
        ctx.fillRect(x, y, w, h)
      } else {
        const block = Math.max(10, Math.round(Math.max(w, h) / 6))
        const tmp = document.createElement('canvas')
        tmp.width = Math.max(1, Math.round(w / block)); tmp.height = Math.max(1, Math.round(h / block))
        const t = tmp.getContext('2d')!
        t.drawImage(c, x, y, w, h, 0, 0, tmp.width, tmp.height)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, x, y, w, h)
        ctx.imageSmoothingEnabled = true
      }
      if (preview) { ctx.strokeStyle = '#ff2d55'; ctx.lineWidth = Math.max(2, c.width / 400); ctx.strokeRect(x, y, w, h) }
    }
  }
  useEffect(() => { if (ready) draw(boxes, draft, true) }, [ready, boxes, draft])

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * canvas.current!.width, y: ((e.clientY - r.top) / r.height) * canvas.current!.height }
  }

  const finish = () => {
    draw(boxes, null, false)
    canvas.current!.toBlob((b) => onDone(b), 'image/png')
  }

  return (
    <Modal open onClose={() => onDone(null)} label="Hide sensitive information" className="dialog dialog--wide adialog">
      <div className="aredact">
        <h2 className="adialog__title">Hide sensitive information</h2>
        <p className="ahelp">Drag over anything private, such as client names, email addresses, account numbers or faces. The hidden areas are permanently destroyed in the saved image. If there is nothing to hide, press Use image.</p>
        <div className="arow">
          <button type="button" className={`abtn ${mode === 'pixel' ? 'abtn--primary' : ''}`} aria-pressed={mode === 'pixel'} onClick={() => setMode('pixel')}>Pixelate</button>
          <button type="button" className={`abtn ${mode === 'cover' ? 'abtn--primary' : ''}`} aria-pressed={mode === 'cover'} onClick={() => setMode('cover')}>Black box</button>
          <button type="button" className="abtn" disabled={!boxes.length} onClick={() => setBoxes((b) => b.slice(0, -1))}>Undo last</button>
        </div>
        <div className="aredact__stage">
          <canvas
            ref={canvas}
            aria-label={`Image ${name}. Drag to select an area to hide.`}
            style={{ touchAction: 'none', cursor: 'crosshair' }}
            onPointerDown={(e) => { drag.current = pos(e); (e.target as HTMLElement).setPointerCapture(e.pointerId) }}
            onPointerMove={(e) => { if (!drag.current) return; const p = pos(e); setDraft({ x: Math.min(drag.current.x, p.x), y: Math.min(drag.current.y, p.y), w: Math.abs(p.x - drag.current.x), h: Math.abs(p.y - drag.current.y), mode }) }}
            onPointerUp={() => { if (draft && draft.w > 4 && draft.h > 4) setBoxes((b) => [...b, draft]); drag.current = null; setDraft(null) }}
          />
        </div>
        <div className="adialog__actions">
          <button type="button" className="abtn" onClick={() => onDone(null)}>Cancel</button>
          <button type="button" className="abtn abtn--primary" disabled={!ready} onClick={finish}>{boxes.length ? `Use image (${boxes.length} hidden)` : 'Use image'}</button>
        </div>
      </div>
    </Modal>
  )
}
