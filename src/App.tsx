import { Suspense, lazy, type ComponentType } from 'react'
import { useContent } from './hooks/useContent'
import { useTheme } from './hooks/useTheme'
import type { SectionConfig, SectionType } from './content/types'
import { Loader } from './components/layout/Loader'
import { Header } from './components/layout/Header'
import { ScrollProgress } from './components/layout/ScrollProgress'
import { BubbleCursor } from './components/layout/BubbleCursor'
import { Decor } from './components/layout/Decor'
import { Hero } from './components/hero/Hero'
import { RecruiterOverview } from './components/about/RecruiterOverview'
import { About } from './components/about/About'
import { Services } from './components/services/Services'
import { Contact } from './components/contact/Contact'
import { Footer } from './components/footer/Footer'
import { ViewerProvider } from './components/projects/Viewer'

type SectionComponent = ComponentType<{ config: SectionConfig }>
const lazySection = <K extends string>(load: () => Promise<Record<K, SectionComponent>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

// Everything below the first screen is code split.
const REGISTRY: Record<SectionType, SectionComponent> = {
  hero: Hero,
  overview: RecruiterOverview,
  about: About,
  services: Services,
  contact: Contact,
  skills: lazySection(() => import('./components/skills/Skills'), 'Skills'),
  platforms: lazySection(() => import('./components/skills/Platforms'), 'Platforms'),
  process: lazySection(() => import('./components/strategy/Process'), 'Process'),
  work: lazySection(() => import('./components/projects/Work'), 'Work'),
  caseStudies: lazySection(() => import('./components/case-studies/CaseStudies'), 'CaseStudies'),
  results: lazySection(() => import('./components/results/Results'), 'Results'),
  tools: lazySection(() => import('./components/tools/Tools'), 'Tools'),
  ai: lazySection(() => import('./components/skills/AiSkills'), 'AiSkills'),
  content: lazySection(() => import('./components/content-gallery/ContentGallery'), 'ContentGallery'),
  screenshots: lazySection(() => import('./components/screenshots/Screenshots'), 'Screenshots'),
  strategy: lazySection(() => import('./components/strategy/Strategy'), 'Strategy'),
  websites: lazySection(() => import('./components/websites/Websites'), 'Websites'),
  testimonials: lazySection(() => import('./components/testimonials/Testimonials'), 'Testimonials'),
  mentoring: lazySection(() => import('./components/mentoring/Mentoring'), 'Mentoring'),
  richText: lazySection(() => import('./components/about/RichTextSection'), 'RichTextSection'),
}

export default function App() {
  const { content, sections } = useContent()
  const { plan, resolved } = useTheme()
  const { profile, theme } = content.portfolio
  const trail = theme.bubbleCursor && plan.cursorTrail && resolved.decorations.includes('bubbles')

  return (
    <ViewerProvider>
      <Loader name={profile.preferredName} label={resolved.theme.postLabel} skip={plan.reduced} />
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <Decor />
      <main id="main">
        {sections.map(({ config, visible }) => {
          if (!visible) return null
          const Component = REGISTRY[config.type]
          return (
            <Suspense key={config.id} fallback={null}>
              <Component config={config} />
            </Suspense>
          )
        })}
      </main>
      <Footer />
      <ScrollProgress />
      {trail && <BubbleCursor stroke={resolved.theme.cursor.stroke} fill={resolved.theme.cursor.fill} />}
    </ViewerProvider>
  )
}
