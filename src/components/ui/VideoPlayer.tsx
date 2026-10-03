import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import { parseVideo } from '../../utils/text'

interface Props {
  src?: string
  poster?: string
  title: string
  vertical?: boolean
}

/**
 * Click to load video. Nothing is downloaded until the visitor presses play, and the
 * page never autoplays on load. YouTube uses the privacy-enhanced domain.
 */
export function VideoPlayer({ src, poster, title, vertical }: Props) {
  const [on, setOn] = useState(false)
  const v = parseVideo(src)
  if (v.kind === 'none') return null

  if (v.kind === 'external') {
    let host = 'the platform'
    try { host = new URL(v.src).hostname.replace(/^www\./, '') } catch { /* keep default */ }
    return (
      <a className={`vplay vplay--link ${vertical ? 'vplay--vertical' : ''}`} href={v.src} target="_blank" rel="noopener noreferrer">
        {poster && <img src={poster} alt="" loading="lazy" />}
        <span className="vplay__label"><ExternalLink size={18} aria-hidden /> Watch on {host}<span className="sr-only"> (opens in a new tab)</span></span>
      </a>
    )
  }

  const thumb = poster || (v.kind === 'youtube' ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : '')
  if (on) {
    return (
      <div className={`vplay vplay--on ${vertical ? 'vplay--vertical' : ''}`}>
        {v.kind === 'file' && <video src={v.src} poster={poster} controls autoPlay playsInline preload="metadata" aria-label={title} />}
        {v.kind === 'youtube' && <iframe title={title} src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
        {v.kind === 'vimeo' && <iframe title={title} src={`https://player.vimeo.com/video/${v.id}?autoplay=1&dnt=1`} allow="autoplay; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
      </div>
    )
  }
  return (
    <button type="button" className={`vplay ${vertical ? 'vplay--vertical' : ''}`} onClick={() => setOn(true)} aria-label={`Play video: ${title}`}>
      {thumb ? <img src={thumb} alt="" loading="lazy" decoding="async" /> : <span className="vplay__blank" />}
      <span className="vplay__btn"><Play aria-hidden fill="currentColor" /></span>
    </button>
  )
}
