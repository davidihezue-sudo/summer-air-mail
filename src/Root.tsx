import { useEffect, useState } from 'react'
import App from './App'
import { normalizeContent, type LoadedContent } from './content/bundle'
import { ContentProvider } from './hooks/useContent'
import { ThemeProvider, type ThemePreview } from './hooks/useTheme'
import { ConsentBanner } from './components/layout/ConsentBanner'
import { useAnalytics } from './utils/analytics'
import type { SeasonName } from './content/types'

const SEASONS: SeasonName[] = ['spring', 'summer', 'autumn', 'winter']

function previewFromUrl(): ThemePreview | undefined {
  const q = new URLSearchParams(location.search)
  if (!q.has('preview')) return undefined
  const season = q.get('season') as SeasonName | null
  return { season: season && SEASONS.includes(season) ? season : undefined }
}

/** Holds live content. In preview mode the admin can push unsaved edits in through postMessage. */
export default function Root({ initial }: { initial: LoadedContent }) {
  const [content, setContent] = useState(initial.content)
  const [preview, setPreview] = useState<ThemePreview | undefined>(previewFromUrl)
  const isPreview = new URLSearchParams(location.search).has('preview')

  useEffect(() => {
    if (!isPreview) return
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent) return
      const d = e.data as { type?: string; content?: unknown; preview?: ThemePreview }
      if (d?.type !== 'sam-preview') return
      if (d.content) setContent(normalizeContent(d.content))
      if (d.preview) setPreview(d.preview)
    }
    window.addEventListener('message', onMessage)
    window.parent?.postMessage({ type: 'sam-preview-ready' }, location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [isPreview])

  return (
    <ContentProvider content={content}>
      <ThemeProvider preview={preview}>
        <Shell source={initial.source} preview={isPreview} />
      </ThemeProvider>
    </ContentProvider>
  )
}

function Shell({ source, preview }: { source: LoadedContent['source']; preview: boolean }) {
  const consent = useAnalytics(preview)
  return (
    <>
      <App />
      {source === 'draft' && <p className="draft-ribbon">Draft preview. Not public until published.</p>}
      <ConsentBanner state={consent} />
    </>
  )
}
