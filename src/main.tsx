import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/italiana/latin-400.css'
import '@fontsource/pinyon-script/latin-400.css'
import '@fontsource-variable/figtree/wght.css'
import './styles/base.css'
import './styles/hero.css'
import './styles/sections.css'
import App from './App'
import { loadContent } from './content/bundle'
import { ContentProvider } from './hooks/useContent'
import { MotionProvider } from './hooks/useMotion'
import { applyTheme } from './utils/theme'

async function boot() {
  const content = await loadContent()
  applyTheme(content.portfolio.theme)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ContentProvider content={content}>
        <MotionProvider intensity={content.portfolio.theme.animationIntensity}>
          <App />
        </MotionProvider>
      </ContentProvider>
    </StrictMode>,
  )
}

void boot()
