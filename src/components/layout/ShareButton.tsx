import { useState } from 'react'
import { Link2, Share2 } from 'lucide-react'
import { useT } from '../../i18n/useT'
import { track } from '../../utils/track'

/** Copies a shareable link, or opens the phone's share sheet when there is one. */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const { t } = useT()
  const [done, setDone] = useState(false)
  const url = `${location.origin}${path}`
  const share = async () => {
    track('share', title)
    try {
      if (navigator.share) { await navigator.share({ title, url }); return }
      await navigator.clipboard.writeText(url)
      setDone(true)
      window.setTimeout(() => setDone(false), 2200)
    } catch { /* cancelled or blocked */ }
  }
  return (
    <button type="button" className="btn btn--ghost sharebtn" onClick={() => void share()} title={t('share.title')}>
      {typeof navigator !== 'undefined' && 'share' in navigator ? <Share2 size={16} aria-hidden /> : <Link2 size={16} aria-hidden />} <span>{done ? t('share.copied') : t('share.copy')}</span>
      <span className="sr-only" role="status">{done ? t('share.copied') : ''}</span>
    </button>
  )
}
