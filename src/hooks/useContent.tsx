import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { SiteContent, SectionType } from '../content/types'
import { buildNav, resolveSections, type NavEntry, type ResolvedSection } from '../content/selectors'

interface Ctx {
  content: SiteContent
  sections: ResolvedSection[]
  nav: NavEntry[]
  /** True when a section of this type is enabled and has content. */
  has: (type: SectionType) => boolean
  /** Id of the first visible section of a type, for links. */
  idOf: (type: SectionType) => string | undefined
}
const ContentContext = createContext<Ctx | null>(null)

export function ContentProvider({ content, children }: { content: SiteContent; children: ReactNode }) {
  const value = useMemo<Ctx>(() => {
    const sections = resolveSections(content)
    return {
      content,
      sections,
      nav: buildNav(content, sections),
      has: (t) => sections.some((s) => s.visible && s.config.type === t),
      idOf: (t) => sections.find((s) => s.visible && s.config.type === t)?.config.id,
    }
  }, [content])
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}
