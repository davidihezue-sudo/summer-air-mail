import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useContent } from '../../hooks/useContent'
import { getProjects } from '../../content/selectors'
import { ProjectDialog } from './ProjectDialog'
import { CaseStudyDialog } from '../case-studies/CaseStudyDialog'

interface ViewerApi {
  openProject: (id: string) => void
  openCase: (id: string) => void
}
const ViewerContext = createContext<ViewerApi>({ openProject: () => {}, openCase: () => {} })
export const useViewer = () => useContext(ViewerContext)

/** Owns the project lightbox and the case study dialog so any section can open them. */
export function ViewerProvider({ children }: { children: ReactNode }) {
  const { content } = useContent()
  const projects = getProjects(content)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [caseId, setCaseId] = useState<string | null>(null)

  const api = useMemo<ViewerApi>(
    () => ({
      openProject: (id) => { setCaseId(null); setProjectId(id) },
      openCase: (id) => { setProjectId(null); setCaseId(id) },
    }),
    [],
  )
  const project = projects.find((p) => p.id === projectId) ?? null
  const caseProject = projects.find((p) => p.id === caseId && p.caseStudy) ?? null

  return (
    <ViewerContext.Provider value={api}>
      {children}
      <ProjectDialog project={project} onClose={() => setProjectId(null)} onCase={api.openCase} />
      <CaseStudyDialog project={caseProject} locale={content.portfolio.site.locale} onClose={() => setCaseId(null)} />
    </ViewerContext.Provider>
  )
}
