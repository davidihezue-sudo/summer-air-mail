import type {
  AiSkill, Block, BlockType, CaseStudy, ContentItem, PlatformExpertise, ProcessStep, Project, ResultEntry,
  ScreenshotItem, Service, SkillGroup, Testimonial, Tool, WebsiteProject, JourneyItem, Faq, Audience, Resource, Note, Application, ShortLink, Look, LanguagePack,
} from './types'

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
const img = () => ({ src: '', alt: '' })

export const PROJECT_TYPES = [
  'Social Media Campaign', 'Social Media Management', 'Brand Development', 'Content Creation',
  'Reels / Short-Form Video', 'Digital Marketing Campaign', 'Paid Advertising', 'Influencer Campaign',
  'Community Management', 'Email Marketing', 'Marketing Strategy', 'Analytics and Reporting',
  'Website / Digital Project', 'AI Marketing', 'Content Strategy', 'Personal Branding', 'Other',
]

export const newCaseStudy = (): CaseStudy => ({
  objective: '', challenge: '', objectives: [], audience: '', strategy: '', framework: [], execution: [],
  creative: [], distribution: [], paidMedia: '', deliverables: [], metrics: [], confidentialResults: '',
  contribution: { personal: [], team: [] }, lessons: [],
})

export const newProject = (): Project => ({
  id: uid('project'), title: '', client: '', industry: '', category: 'Social Media Campaign', description: '',
  year: String(new Date().getFullYear()), period: '', platforms: [], role: '', thumbnail: img(), media: [],
  externalLink: '', featured: false, hidden: true, contentTypes: [], serviceIds: [], toolIds: [], aiSkillIds: [],
  resultIds: [], contentIds: [], screenshotIds: [], relatedIds: [], blocks: [],
})

export const newService = (): Service => ({
  id: uid('service'), name: '', category: 'Strategy', description: '', detail: '', object: undefined, icon: 'Sparkles',
  color: 'sky', platforms: [], projectIds: [], hidden: true,
})
export const newTool = (): Tool => ({ id: uid('tool'), name: '', category: 'Social Media Management', confirmed: false, usage: '' })
export const newTestimonial = (): Testimonial => ({
  id: uid('testimonial'), name: '', title: '', company: '', quote: '', relationship: '', approved: false,
})
export const newContentItem = (kind: 'post' | 'video' = 'video'): ContentItem => ({
  id: uid(kind), title: '', kind, format: kind === 'video' ? 'Reel' : 'Carousel', platform: 'instagram', explanation: '',
  thumbnail: img(), video: '', duration: '', date: '', campaign: '', role: '', result: '', link: '', hidden: true,
})
export const newWebsite = (): WebsiteProject => ({
  id: uid('site'), name: '', url: '', description: '', responsibilities: [], platform: '', screenshots: [], externalLink: '', hidden: true,
})
export const newSkillGroup = (): SkillGroup => ({ id: uid('skills'), name: '', skills: [] })
export const newPlatform = (): PlatformExpertise => ({
  id: uid('platform'), platform: 'instagram', level: '', services: [], contentTypes: [], campaigns: [], analytics: '',
  advertising: '', profileUrl: '', projectIds: [], hidden: true,
})
export const newAiSkill = (): AiSkill => ({
  id: uid('ai'), name: '', category: 'AI Content Creation', description: '', tool: '', level: '', projectId: '',
  screenshot: null, video: '', link: '', outcome: '', hidden: true,
})
export const newResult = (): ResultEntry => ({
  id: uid('result'), metric: '', start: null, end: null, prefix: '', unit: '', pctChange: null, period: '', platform: '',
  campaign: '', projectId: '', context: '', notes: '', screenshot: null, chart: 'bar', series: [],
  classification: 'verified', contribution: 'individual', anonymised: '', showValues: true, hidden: true,
})
export const newScreenshot = (): ScreenshotItem => ({
  id: uid('shot'), image: img(), caption: '', category: '', projectId: '', compareWith: null, hidden: true,
})
export const newProcessStep = (): ProcessStep => ({ id: uid('step'), title: '', description: '', icon: 'Sparkles', color: 'sky', image: null })

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Heading', paragraph: 'Paragraph', image: 'Image', gallery: 'Image gallery', video: 'Video', reel: 'Reel (vertical video)',
  screenshot: 'Screenshot', link: 'Link', button: 'Button', quote: 'Quote', metric: 'Metric', chart: 'Chart',
  beforeAfter: 'Before and after', embed: 'Embedded post or video', pdf: 'PDF document', download: 'Download',
  timeline: 'Timeline', process: 'Process', framework: 'Strategy framework', skills: 'Skills used', platforms: 'Platforms used',
  flow: 'Flow diagram (journey, automation, data flow)', query: 'Query or code', dashboard: 'Live dashboard or report', metricTree: 'Metric tree (goal, measures, levers)',
}

export function newBlock(type: BlockType): Block {
  const base: Block = { id: uid('block'), type }
  switch (type) {
    case 'heading': return { ...base, text: '', level: 2 }
    case 'paragraph': return { ...base, text: '' }
    case 'image': case 'screenshot': return { ...base, image: img(), caption: '' }
    case 'gallery': return { ...base, images: [], caption: '' }
    case 'video': case 'reel': return { ...base, src: '', poster: '', title: '', caption: '' }
    case 'link': return { ...base, url: '', label: '', description: '' }
    case 'button': return { ...base, url: '', label: '' }
    case 'quote': return { ...base, text: '', attribution: '' }
    case 'metric': return { ...base, label: '', value: null, prefix: '', unit: '', period: '', note: '', classification: 'verified' }
    case 'chart': return { ...base, chart: 'bar', title: '', unit: '', points: [], period: '', note: '' }
    case 'beforeAfter': return { ...base, before: img(), after: img(), variant: 'before-after', caption: '' }
    case 'embed': return { ...base, url: '', title: '', caption: '' }
    case 'pdf': return { ...base, url: '', title: '', description: '' }
    case 'download': return { ...base, url: '', title: '', filename: '', description: '' }
    case 'timeline': return { ...base, entries: [] }
    case 'process': return { ...base, entries: [] }
    case 'framework': return { ...base, title: '', columns: [] }
    case 'skills': case 'platforms': return { ...base, title: '', items: [] }
    case 'flow': return { ...base, title: '', caption: '', nodes: [] }
    case 'query': return { ...base, title: '', language: 'sql', code: '', text: '' }
    case 'dashboard': return { ...base, url: '', title: '', caption: '', height: 520 }
    case 'metricTree': return { ...base, title: '', note: '', tree: [] }
  }
}

export const newFaq = (): Faq => ({ id: uid('faq'), question: '', answer: '', topic: '', buttonLabel: '', buttonLink: '', hidden: true })
export const newJourney = (): JourneyItem => ({ id: uid('journey'), period: '', title: '', org: '', description: '', kind: 'role', link: '', image: null, hidden: true })
export const newResource = (): Resource => ({ id: uid('resource'), title: '', description: '', file: '', image: null, format: 'PDF', hidden: true })
export const newNote = (): Note => ({
  id: uid('note'), slug: '', title: '', date: new Date().toISOString().slice(0, 10), summary: '', body: '', cover: null, tags: [],
  seoTitle: '', seoDescription: '', hidden: true,
})
export const newApplication = (): Application => ({
  id: uid('application'), slug: Math.random().toString(36).slice(2, 10), label: '', company: '', role: '', enabled: true, expiresAt: '',
  hero: { label: '', headline: '', supporting: '', intro: '' }, greeting: { enabled: false, text: '' }, featuredProjectIds: [],
  onlyFeatured: false, highlightSkills: [], hideSectionIds: [], lookId: '', professional: '', season: '', cvFile: '', cvFilename: '', audienceId: '',
})
export const newAudience = (): Audience => ({
  id: uid('audience'), slug: '', name: '', enabled: true,
  hero: { label: '', headline: '', supporting: '', intro: '' }, ctas: [], bio: '', sectionWording: [], firstSectionIds: [], hideSectionIds: [],
  hide: { projects: [], services: [], tools: [], results: [], testimonials: [], faqs: [], websites: [], notes: [] },
  featuredProjectIds: [], onlyFeatured: false, highlightSkills: [], professional: '', season: '', cvFile: '', cvFilename: '',
})
export const newShortLink = (): ShortLink => ({ id: uid('link'), slug: '', label: '', target: { type: 'section', value: 'work' }, enabled: true })
export const newLook = (): Look => ({
  id: uid('look'), name: '', description: '',
  settings: {
    professional: 'balanced', animationIntensity: 'full', seasonMode: 'auto',
    design: { radius: 'soft', buttons: 'pill', density: 'comfortable', fontScale: 1, shadow: 'soft', borderWeight: 'normal', headingCase: 'normal', colorMode: 'light', colorToggle: false, dialogTransition: 'scale', dialogSpeed: 'normal', readingProgress: true, cards: 'soft' },
    hero: { layout: 'stamp-right', alignment: 'left', breakout: true, animation: 'inherit', decorativeElements: true, background: 'season' },
  },
})
export const newLanguage = (): LanguagePack => ({ code: '', label: '', rtl: false, ui: {}, text: {}, auto: [] })
