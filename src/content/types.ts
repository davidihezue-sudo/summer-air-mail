/* Content model for the whole site. Every optional block is optional on purpose:
   the public site must never look broken because something has not been supplied. */

export type Intensity = 'off' | 'subtle' | 'full'
export type Level = 'none' | 'subtle' | 'standard' | 'expressive'
export type ProfessionalIntensity = 'creative' | 'balanced' | 'professional'
export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter'
export type SeasonMode = SeasonName | 'auto'

export interface ImageRef {
  src: string
  alt: string
  width?: number
  height?: number
}

export interface MediaItem {
  type: 'image' | 'video'
  src: string
  alt: string
  poster?: string
}

export type Platform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'pinterest'
  | 'x'
  | 'threads'
  | 'snapchat'
  | 'web'
  | (string & {})

/* ---------- Results and analytics ---------- */

export type ResultClass = 'verified' | 'team' | 'confidential' | 'illustrative' | 'individual'
export type ChartType = 'bar' | 'line' | 'stat'

export interface ChartPoint {
  label: string
  value: number
}

export interface Metric {
  label: string
  baseline?: number
  result: number
  prefix?: string
  unit?: string
  /** Measurement period, for example "Jan to Jun 2025". Required for honesty. */
  period: string
  note?: string
}

export interface ResultEntry {
  id: string
  metric: string
  start?: number | null
  end?: number | null
  prefix?: string
  unit?: string
  /** Only shown when supplied. A percentage is calculated from start and end only when both exist and pctChange is empty. */
  pctChange?: number | null
  period: string
  platform?: string
  campaign?: string
  projectId?: string
  context?: string
  notes?: string
  screenshot?: ImageRef | null
  chart: ChartType
  series?: ChartPoint[]
  classification: ResultClass
  /** Who produced the result. Keeps personal work distinct from team work. */
  contribution?: 'individual' | 'team' | 'shared'
  /** For confidential results: approved wording shown instead of numbers. */
  anonymised?: string
  showValues?: boolean
  hidden?: boolean
}

/* ---------- Project content blocks ---------- */

export type BlockType =
  | 'heading' | 'paragraph' | 'image' | 'gallery' | 'video' | 'reel' | 'screenshot' | 'link' | 'button'
  | 'quote' | 'metric' | 'chart' | 'beforeAfter' | 'embed' | 'pdf' | 'download' | 'timeline' | 'process'
  | 'framework' | 'skills' | 'platforms'

export interface Block {
  id: string
  type: BlockType
  // Shared and type specific fields. Only the ones relevant to `type` are used.
  text?: string
  level?: 2 | 3
  image?: ImageRef | null
  images?: ImageRef[]
  caption?: string
  src?: string
  poster?: string
  title?: string
  url?: string
  label?: string
  description?: string
  attribution?: string
  value?: number | null
  prefix?: string
  unit?: string
  period?: string
  note?: string
  classification?: ResultClass
  chart?: 'bar' | 'line'
  points?: ChartPoint[]
  before?: ImageRef | null
  after?: ImageRef | null
  variant?: 'before-after' | 'problem-solution' | 'old-new' | 'baseline-result'
  items?: string[]
  entries?: { label: string; text: string }[]
  columns?: { title: string; items: string[] }[]
  filename?: string
}

export interface CaseStudy {
  objective: string
  challenge: string
  objectives?: string[]
  audience?: string
  strategy: string
  /** Optional visual framework under the strategy. */
  framework?: { title: string; items: string[] }[]
  execution: string[]
  creative?: MediaItem[]
  distribution?: string[]
  paidMedia?: string
  deliverables?: string[]
  metrics?: Metric[]
  /** Approved anonymised wording when numbers are confidential. */
  confidentialResults?: string
  contribution: { personal: string[]; team?: string[] }
  lessons: string[]
  beforeAfter?: { before: ImageRef; after: ImageRef; caption?: string }
}

export interface Project {
  id: string
  title: string
  client: string
  industry: string
  /** Project type, for example "Social Media Campaign". Drives the type filter. */
  category: string
  description: string
  year: string
  period?: string
  platforms: Platform[]
  role: string
  thumbnail: ImageRef
  media?: MediaItem[]
  externalLink?: string
  featured?: boolean
  order?: number
  /** Hidden projects are drafts and never appear publicly. */
  hidden?: boolean
  contentTypes?: string[]
  serviceIds?: string[]
  toolIds?: string[]
  aiSkillIds?: string[]
  resultIds?: string[]
  contentIds?: string[]
  screenshotIds?: string[]
  relatedIds?: string[]
  blocks?: Block[]
  caseStudy?: CaseStudy
}

/* ---------- Services, skills, tools ---------- */

export type ServiceObject =
  | 'sunglasses' | 'sunscreen' | 'camera' | 'flipflops' | 'phone' | 'watermelon'

export type ServiceCategory =
  | 'Strategy' | 'Content' | 'Management' | 'Growth' | 'Advertising' | 'Analytics' | 'Technology' | (string & {})

export interface Service {
  id: string
  name: string
  category?: ServiceCategory
  description: string
  detail: string
  /** Built-in towel illustration. It is re-skinned automatically for each season. */
  object?: ServiceObject
  icon?: string
  color: string
  image?: ImageRef
  platforms?: string[]
  projectIds?: string[]
  hidden?: boolean
}

export type SkillLevel = '' | 'Working knowledge' | 'Proficient' | 'Advanced' | 'Specialist'

export interface Skill {
  name: string
  level?: SkillLevel
  note?: string
  /** Skills only appear publicly once you switch them on. */
  visible: boolean
}

export interface SkillGroup {
  id: string
  name: string
  skills: Skill[]
  hidden?: boolean
}

export interface PlatformExpertise {
  id: string
  platform: Platform
  level: SkillLevel
  services: string[]
  contentTypes: string[]
  campaigns: string[]
  analytics?: string
  advertising?: string
  profileUrl?: string
  projectIds?: string[]
  hidden?: boolean
}

export type ToolCategory =
  | 'Social Media Management'
  | 'Content Creation'
  | 'Analytics'
  | 'Advertising'
  | 'Design'
  | 'AI and Automation'

export interface Tool {
  id: string
  name: string
  category: ToolCategory
  /** Set true only for tools you genuinely use. Unconfirmed tools never render. */
  confirmed: boolean
  usage: string
  logo?: string
  color?: string
}

export type AiCategory =
  | 'AI Content Creation' | 'AI Copywriting' | 'AI Image Generation' | 'AI Video Generation' | 'AI Research'
  | 'AI Content Ideation' | 'AI Analytics' | 'AI Automation' | 'Prompt Engineering'
  | 'Marketing Workflow Automation' | 'AI-Assisted Strategy'

export interface AiSkill {
  id: string
  name: string
  category: AiCategory | (string & {})
  description: string
  tool?: string
  level?: SkillLevel
  projectId?: string
  screenshot?: ImageRef | null
  video?: string
  link?: string
  outcome?: string
  hidden?: boolean
}

export interface ProcessStep {
  id: string
  title: string
  description: string
  icon?: string
  color?: string
  image?: ImageRef | null
  hidden?: boolean
}

/* ---------- Social content, video, screenshots, websites ---------- */

export interface ContentItem {
  id: string
  title: string
  /** "video" items show a play button and use the video fields. */
  kind?: 'post' | 'video'
  format: string
  platform: Platform
  explanation: string
  thumbnail: ImageRef
  /** MP4 or WebM file, a YouTube or Vimeo URL. Never autoplays. */
  video?: string
  duration?: string
  date?: string
  campaign?: string
  role?: string
  result?: string
  link?: string
  hidden?: boolean
}

export interface ScreenshotItem {
  id: string
  image: ImageRef
  caption?: string
  category?: string
  projectId?: string
  /** Optional second image for before and after comparisons. */
  compareWith?: ImageRef | null
  hidden?: boolean
}

export interface WebsiteProject {
  id: string
  name: string
  url: string
  description: string
  responsibilities: string[]
  platform: string
  screenshots: ImageRef[]
  externalLink?: string
  hidden?: boolean
}

export interface Testimonial {
  id: string
  name: string
  title: string
  company: string
  quote: string
  relationship: string
  photo?: ImageRef
  approved: boolean
  order?: number
}

export interface StrategyStep {
  title: string
  summary: string
  questions: string[]
  color: string
}

export interface Stat {
  key: string
  label: string
  value?: number | null
  prefix?: string
  suffix?: string
  note?: string
}

export interface SocialLinks {
  linkedin: string
  instagram: string
  tiktok: string
  facebook: string
  youtube: string
  pinterest: string
  website: string
}

/* ---------- Theme, seasons, sections ---------- */

export interface ThemeColors {
  stone: string
  green: string
  red: string
  sand: string
  ink: string
  sea: string
  aqua: string
  pink: string
  sage: string
  butter: string
  peach: string
  sky: string
  paper: string
}

export interface SeasonOverride {
  colors: Partial<ThemeColors>
  /** Decoration id to on/off. Missing ids use the theme default. */
  decorations: Record<string, boolean>
  intensity: Level
  fonts: { display?: string; script?: string; body?: string }
  texture: boolean
  heroCutout: ImageRef | null
  heroFlowers: ImageRef | null
  /** Optional hero background image URL for this season. */
  heroBackground: string
  /** Optional decorative image URL for this season. */
  decorImage: string
}

export interface SeasonSettings {
  mode: SeasonMode
  /** Each season starts on its date and lasts until the next season starts. */
  ranges: Record<SeasonName, { month: number; day: number }>
  transition: 'none' | 'immediate' | 'fade' | 'crossfade'
  overrides: Record<SeasonName, SeasonOverride>
}

export type SectionType =
  | 'hero' | 'overview' | 'about' | 'services' | 'skills' | 'platforms' | 'process' | 'work'
  | 'caseStudies' | 'results' | 'tools' | 'ai' | 'content' | 'screenshots' | 'strategy'
  | 'websites' | 'testimonials' | 'mentoring' | 'richText' | 'contact'

export interface SectionConfig {
  id: string
  type: SectionType
  enabled: boolean
  navLabel?: string
  eyebrow?: string
  heading?: string
  intro?: string
  /** A palette token name (sand, sky...) or a hex colour. Empty uses the season default. */
  tone?: string
  image?: ImageRef | null
  cta?: { label: string; href: string } | null
  /** For work sections: show only one project type. */
  filterCategory?: string
  /** For richText sections. */
  body?: string
}

export interface NavItem {
  id: string
  label: string
  kind: 'section' | 'external'
  /** Section id, or a full URL for external links. */
  target: string
  visible: boolean
}

export interface HeroConfig {
  label: string
  headline: string
  supporting: string
  intro: string
  layout: 'stamp-right' | 'stamp-left' | 'centered'
  alignment: 'left' | 'center'
  /** false disables the 200vh scroll breakout and shows a compact hero. */
  breakout: boolean
  animation: Level | 'inherit'
  ctas: { label: string; target: string }[]
  decorativeElements: boolean
  background: 'season' | 'plain'
}

export interface Portfolio {
  profile: {
    fullName: string
    preferredName: string
    title: string
    roles: string[]
    tagline: string
    intro: string
    bio: string[]
    yearsExperience: number | null
    location: string
    email: string
    phone: string
    whatsapp: string
    social: SocialLinks
    profilePhoto: ImageRef | null
    heroPortrait: ImageRef | null
    /** Transparent PNG or WebP cut-out used inside the stamp. */
    heroCutout: ImageRef | null
    heroFlowers: ImageRef | null
    signature: string
    cvFile: string
    availability: string
    employmentType: string
    targetJobs: string[]
    highlights: string[]
  }
  cv: { enabled: boolean; title: string; version: string; filename: string }
  site: {
    url: string
    /** Spelling locale for built-in interface copy, for example en-GB or en-CA. */
    locale: string
    currency: string
  }
  hero: HeroConfig
  theme: {
    fonts: { display: string; script: string; body: string }
    borderStyle: 'perforated' | 'soft' | 'sharp'
    /** Global ceiling on motion. "off" removes all decorative motion. */
    animationIntensity: Intensity
    bubbleCursor: boolean
    stampNumeral: string
    professional: ProfessionalIntensity
  }
  seasons: SeasonSettings
  sections: SectionConfig[]
  navigation: { mode: 'auto' | 'custom'; items: NavItem[] }
  seo: {
    title: string
    description: string
    keywords: string
    ogTitle: string
    ogDescription: string
    ogImage: string
    canonical: string
    robots: 'index' | 'noindex'
    structuredData: boolean
  }
  analytics: {
    enabled: boolean
    ga4: string
    gtm: string
    metaPixel: string
    requireConsent: boolean
    respectDoNotTrack: boolean
  }
  footer: { tagline: string; copyright: string; showSocial: boolean; showNav: boolean; showFootprints: boolean }
  stats: Stat[]
  recruiter: {
    competencies: string[]
    platforms: string[]
    industries: string[]
    achievements: string[]
    education: { title: string; place: string; year: string }[]
    certifications: { title: string; issuer: string; year: string }[]
    employment: { role: string; employer: string; period: string; summary: string }[]
  }
  contact: {
    budgetRanges: { min: number; max: number | null }[]
    enquiryTypes: string[]
    /** The enquiry type that reveals the recruiter fields. */
    recruiterType: string
    whatsappGreeting: string
    showBudget: boolean
    availableFor: string[]
    workModes: string[]
  }
  mentoring: {
    heading: string
    overview: string
    topics: string[]
    outcomes: string[]
    format: string
    instructorPhoto: ImageRef | null
    showLiveBadge: boolean
  }
  strategy: { heading: string; intro: string; label: string; steps: StrategyStep[] }
}

export interface SiteContent {
  portfolio: Portfolio
  projects: Project[]
  services: Service[]
  tools: Tool[]
  testimonials: Testimonial[]
  contentItems: ContentItem[]
  websites: WebsiteProject[]
  skills: SkillGroup[]
  platforms: PlatformExpertise[]
  aiSkills: AiSkill[]
  results: ResultEntry[]
  screenshots: ScreenshotItem[]
  process: ProcessStep[]
  /** Custom project types added in the admin, on top of the built-in list. */
  categories: string[]
}

export interface MediaAsset {
  id: string
  url: string
  filename: string
  type: 'image' | 'video' | 'pdf' | 'other'
  mime: string
  size: number
  width?: number
  height?: number
  alt: string
  caption: string
  tags: string[]
  projectIds: string[]
  uploadedAt: string
}
