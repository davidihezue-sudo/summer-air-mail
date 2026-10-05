import { useCallback, useEffect, useState, type ReactEventHandler } from 'react'
import { isVideoSrc } from '../../utils/media'

interface Props {
  src: string
  alt?: string
  poster?: string
  className?: string
  width?: number
  height?: number
  sizes?: string
  eager?: boolean
  hidden?: boolean
  draggable?: boolean
  /** Called with the picture's real width divided by its height once it is known. */
  onRatio?: (ratio: number) => void
}

/**
 * Browsers only autoplay a video they know is silent. React sets `muted` as a property, which Safari can miss at load time, so the
 * attribute is written by hand and play is requested again when the video is ready, when the page comes back to the front, and on
 * the first touch if the browser (Low Power Mode on an iPhone, for example) refused the first try.
 */
function keepPlaying(v: HTMLVideoElement | null) {
  if (!v) return
  v.muted = true; v.defaultMuted = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '')
  const go = () => { if (v.paused) void v.play().catch(() => { /* try again later */ }) }
  go()
  v.addEventListener('loadeddata', go); v.addEventListener('canplay', go)
  const wake = () => { go(); if (!v.paused) { document.removeEventListener('touchstart', wake); document.removeEventListener('click', wake) } }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go() })
  document.addEventListener('touchstart', wake, { passive: true }); document.addEventListener('click', wake)
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A picture, or a short video used in its place. A video plays silently on a loop, inline, with no controls, so it behaves
 * like a living photo. Visitors who ask their device for less motion see the still cover instead.
 */
export function Visual({ src, alt = '', poster, className, width, height, sizes, eager, hidden, draggable, onRatio }: Props) {
  const [still, setStill] = useState(false)
  useEffect(() => { setStill(reducedMotion()) }, [])
  const ref = useCallback((v: HTMLVideoElement | null) => { if (v && !reducedMotion()) keepPlaying(v) }, [])
  if (isVideoSrc(src)) {
    if (still && poster) return <img className={className} src={poster} alt={alt} width={width} height={height} aria-hidden={hidden || undefined} draggable={false} />
    const onMeta: ReactEventHandler<HTMLVideoElement> = (e) => { const v = e.currentTarget; if (onRatio && v.videoWidth) onRatio(v.videoWidth / (v.videoHeight || 1)) }
    return (
      <video
        ref={ref} className={className} src={src} poster={poster} width={width} height={height} muted loop playsInline autoPlay={!still} preload={eager ? 'auto' : 'metadata'}
        aria-label={alt || undefined} aria-hidden={hidden || undefined} disablePictureInPicture disableRemotePlayback onLoadedMetadata={onMeta}
      />
    )
  }
  return (
    <img
      className={className} src={src} alt={alt} width={width} height={height} sizes={sizes} loading={eager ? 'eager' : 'lazy'} decoding="async"
      aria-hidden={hidden || undefined} draggable={draggable ?? false}
      onLoad={onRatio ? (e) => onRatio(e.currentTarget.naturalWidth / (e.currentTarget.naturalHeight || 1)) : undefined}
    />
  )
}
