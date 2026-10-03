import { Suspense, lazy } from 'react'
import { useContent } from './hooks/useContent'
import { useMotion } from './hooks/useMotion'
import { Loader } from './components/layout/Loader'
import { Header } from './components/layout/Header'
import { ScrollProgress } from './components/layout/ScrollProgress'
import { BubbleCursor } from './components/layout/BubbleCursor'
import { Hero } from './components/hero/Hero'
import { RecruiterOverview } from './components/about/RecruiterOverview'
import { About } from './components/about/About'
import { Services } from './components/services/Services'
import { Strategy } from './components/strategy/Strategy'
import { Contact } from './components/contact/Contact'
import { Footer } from './components/footer/Footer'
import { ViewerProvider } from './components/projects/Viewer'

// Sections that only render when real content exists are code split.
const Work = lazy(() => import('./components/projects/Work').then((m) => ({ default: m.Work })))
const CaseStudies = lazy(() => import('./components/case-studies/CaseStudies').then((m) => ({ default: m.CaseStudies })))
const Tools = lazy(() => import('./components/tools/Tools').then((m) => ({ default: m.Tools })))
const ContentGallery = lazy(() => import('./components/content-gallery/ContentGallery').then((m) => ({ default: m.ContentGallery })))
const Websites = lazy(() => import('./components/websites/Websites').then((m) => ({ default: m.Websites })))
const Testimonials = lazy(() => import('./components/testimonials/Testimonials').then((m) => ({ default: m.Testimonials })))
const Mentoring = lazy(() => import('./components/mentoring/Mentoring').then((m) => ({ default: m.Mentoring })))

export default function App() {
  const { content, visible } = useContent()
  const { reduced, intensity, finePointer } = useMotion()
  const { profile, theme } = content.portfolio

  return (
    <ViewerProvider>
      <Loader name={profile.preferredName} skip={reduced} />
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        {visible.hero && <Hero />}
        {visible.recruiter && <RecruiterOverview />}
        {visible.about && <About />}
        {visible.services && <Services />}
        <Suspense fallback={null}>
          {visible.work && <Work />}
          {visible.caseStudies && <CaseStudies />}
          {visible.tools && <Tools />}
          {visible.content && <ContentGallery />}
        </Suspense>
        {visible.strategy && <Strategy />}
        <Suspense fallback={null}>
          {visible.websites && <Websites />}
          {visible.testimonials && <Testimonials />}
          {visible.mentoring && <Mentoring />}
        </Suspense>
        {visible.contact && <Contact />}
      </main>
      <Footer />
      <ScrollProgress />
      {theme.bubbleCursor && finePointer && !reduced && intensity === 'full' && <BubbleCursor />}
    </ViewerProvider>
  )
}
