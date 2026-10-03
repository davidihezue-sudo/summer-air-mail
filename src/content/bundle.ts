import { portfolio } from './portfolio.config'
import { projects } from './projects'
import { services } from './services'
import { tools } from './tools'
import { testimonials } from './testimonials'
import { contentItems } from './contentItems'
import { websites } from './websites'

export const baseContent = { portfolio, projects, services, tools, testimonials, contentItems, websites }
export type ContentBundle = typeof baseContent

/**
 * In development only, add ?sample=1 to the URL to preview every section with
 * clearly labelled sample data. Sample data is never bundled into production.
 */
export async function loadContent(): Promise<ContentBundle> {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('sample')) {
    const { sampleContent } = await import('./sample')
    return sampleContent(baseContent)
  }
  return baseContent
}
