import type { SectionConfig, SectionType } from './types'

/** Default homepage order. The admin can reorder, hide, rename, duplicate and configure these. */
export function defaultSections(): SectionConfig[] {
  const on = (id: string, type: SectionType, extra: Partial<SectionConfig> = {}): SectionConfig => ({ id, type, enabled: true, ...extra })
  return [
    on('top', 'hero'),
    on('overview', 'overview'),
    on('about', 'about', { navLabel: 'About' }),
    on('journey', 'journey'),
    on('services', 'services', { navLabel: 'Services' }),
    on('process', 'process'),
    on('skills', 'skills', { navLabel: 'Skills' }),
    on('platforms', 'platforms'),
    on('work', 'work', { navLabel: 'Work' }),
    on('case-studies', 'caseStudies', { navLabel: 'Case studies' }),
    on('results', 'results', { navLabel: 'Results' }),
    on('tools', 'tools'),
    on('ai', 'ai', { navLabel: 'AI' }),
    on('content', 'content'),
    on('screenshots', 'screenshots'),
    on('resources', 'resources'),
    on('strategy', 'strategy'),
    on('websites', 'websites'),
    on('notes', 'notes'),
    on('testimonials', 'testimonials'),
    on('mentoring', 'mentoring', { enabled: false }),
    on('newsletter', 'newsletter'),
    on('stats', 'siteStats', { enabled: false }),
    on('contact', 'contact', { navLabel: 'Contact' }),
  ]
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero',
  overview: 'At a glance (recruiter overview)',
  about: 'About',
  services: 'Services',
  skills: 'Skills',
  platforms: 'Platform expertise',
  process: 'Marketing process',
  work: 'Portfolio (featured work)',
  caseStudies: 'Case studies',
  results: 'Analytics and results',
  tools: 'Tools and platforms',
  ai: 'AI and marketing technology',
  content: 'Social media and video content',
  screenshots: 'Screenshots',
  strategy: 'Strategy framework',
  websites: 'Websites and digital projects',
  testimonials: 'Testimonials',
  mentoring: 'Mentoring and training',
  journey: 'Career journey (timeline)',
  resources: 'Resources and downloads',
  notes: 'Notes (blog)',
  newsletter: 'Newsletter signup',
  siteStats: "This site's own numbers (public visit counts)",
  richText: 'Text and call to action',
  contact: 'Contact',
}

/** Section types that may appear more than once. */
export const DUPLICABLE: SectionType[] = ['work', 'richText']
/** Section types with a "required" role: the page needs them to stay usable. */
export const NAV_DEFAULT: SectionType[] = ['work', 'caseStudies', 'results', 'services', 'about', 'contact']
