import { useState } from 'react'
import type { ImageRef, MediaSettings } from '../../content/types'
import { clampRatio, ratioOf } from '../../utils/media'
import { Visual } from './Visual'

interface Props {
  image: ImageRef | null | undefined
  /** Force a shape. Leave out to follow the picture, so nothing is trimmed. */
  ratio?: number | null
  /** Used before the picture's real size is known, to stop the page jumping. */
  fallbackRatio?: number
  fit?: MediaSettings['cardFit']
  fill?: MediaSettings['fill']
  sizes?: string
  className?: string
  eager?: boolean
}

/**
 * Shows the whole picture. Screenshots and posts from different platforms come in different shapes, so the frame follows
 * the picture, or (when a shape is forced) the picture sits inside it with a soft blurred copy filling the gaps.
 */
export function FitImage({ image, ratio, fallbackRatio = 4 / 5, fit = 'smart', fill = 'blur', sizes, className = '', eager }: Props) {
  const [measured, setMeasured] = useState<number | null>(null)
  if (!image?.src) return null
  const natural = ratioOf(image) ?? measured
  const frame = clampRatio(ratio ?? natural ?? fallbackRatio)
  const n = natural ?? frame
  // Smart: crop only when the picture is nearly the right shape already (under about 12% off); otherwise show all of it.
  const contain = fit === 'contain' || (fit === 'smart' && Math.abs(Math.log(n / frame)) > 0.12)
  return (
    <span className={`fit ${className}`} style={{ aspectRatio: String(frame) }} data-fill={fill}>
      {contain && fill === 'blur' && <Visual className="fit__bg" src={image.src} poster={image.poster} hidden />}
      <Visual
        className={`fit__img${contain ? " fit__img--contain" : ""}`} src={image.src} alt={image.alt} poster={image.poster} sizes={sizes} eager={eager}
        onRatio={(r) => { if (!natural) setMeasured(r) }}
      />
    </span>
  )
}
