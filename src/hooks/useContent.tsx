import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { ContentBundle } from '../content/bundle'
import { getVisibleSections, type VisibleSections } from '../content/selectors'

interface Ctx {
  content: ContentBundle
  visible: VisibleSections
}
const ContentContext = createContext<Ctx | null>(null)

export function ContentProvider({ content, children }: { content: ContentBundle; children: ReactNode }) {
  const value = useMemo(() => ({ content, visible: getVisibleSections(content) }), [content])
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}
