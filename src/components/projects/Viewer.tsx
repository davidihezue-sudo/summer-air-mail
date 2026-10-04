import { Suspense, createContext, lazy, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useContent } from '../../hooks/useContent'
import { navigate, parseRoute, isPreviewMode, workUrl } from '../../utils/route'
import { track } from '../../utils/track'
import { getProjects } from '../../content/selectors'
import type { ViewerImage } from '../ui/ImageViewer'

// Loaded on first use so the first screen stays small.
const ProjectView = lazy(() => import('./ProjectView').then((m) => ({ default: m.ProjectView })))
const ImageViewer = lazy(() => import('../ui/ImageViewer').then((m) => ({ default: m.ImageViewer })))

interface ViewerApi {
  openProject: (id: string) => void
  /** Opens the project and scrolls to its case study. */
  openCase: (id: string) => void
  openImages: (images: ViewerImage[], index?: number) => void
}
const noop = () => {}
const ViewerContext = createContext<ViewerApi>({ openProject: noop, openCase: noop, openImages: noop })
export const useViewer = () => useContext(ViewerContext)

/** Owns the project view and the zoomable image viewer so any section can open them. */
export function ViewerProvider({ children }: { children: ReactNode }) {
  const { content } = useContent()
  const projects = getProjects(content)
  const [state, setState] = useState<{ id: string; focusCase: boolean } | null>(null)
  const [images, setImages] = useState<{ list: ViewerImage[]; index: number }>({ list: [], index: -1 })

  // Opening a project gives it its own address (/work/<id>) so it can be shared and the back button works.
  useEffect(() => {
    const sync = () => {
      const r = parseRoute(location.pathname)
      if (r.kind === 'work' && getProjects(content).some((p) => p.id === r.id)) setState((s) => (s?.id === r.id ? s : { id: r.id, focusCase: false }))
      else if (r.kind === 'home') setState(null)
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const api = useMemo<ViewerApi>(
    () => ({
      openProject: (id) => { track('project', projects.find((p) => p.id === id)?.title ?? id); setState({ id, focusCase: false }); if (!isPreviewMode()) history.pushState(null, '', workUrl(id)) },
      openCase: (id) => { track('project', projects.find((p) => p.id === id)?.title ?? id); setState({ id, focusCase: true }); if (!isPreviewMode()) history.pushState(null, '', workUrl(id)) },
      openImages: (list, index = 0) => setImages({ list, index }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content],
  )
  const project = state ? projects.find((p) => p.id === state.id) ?? null : null

  return (
    <ViewerContext.Provider value={api}>
      {children}
      <Suspense fallback={null}>
        {project && <ProjectView project={project} focusCase={!!state?.focusCase} onClose={() => { setState(null); if (!isPreviewMode() && parseRoute(location.pathname).kind === 'work') navigate('/') }} onOpen={api.openProject} />}
        {images.list.length > 0 && <ImageViewer images={images.list} index={images.index} onIndex={(i) => setImages((s) => ({ ...s, index: i }))} onClose={() => setImages({ list: [], index: -1 })} />}
      </Suspense>
    </ViewerContext.Provider>
  )
}
