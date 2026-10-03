export type Intensity = 'off' | 'subtle' | 'full'

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
  | 'web'
  | (string & {})

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

export interface CaseStudy {
  objective: string
  challenge: string
  objectives?: string[]
  strategy: string
  execution: string[]
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
  hidden?: boolean
  caseStudy?: CaseStudy
}

export interface Service {
  id: string
  name: string
  description: string
  detail: string
  /** One of the built-in towel objects, or leave empty to use the icon. */
  object?: 'sunglasses' | 'sunscreen' | 'camera' | 'flipflops' | 'phone' | 'watermelon'
  icon?: string
  color: string
  image?: ImageRef
  platforms?: string[]
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

export interface ContentItem {
  id: string
  title: string
  format: 'Reel' | 'TikTok' | 'Story' | 'Carousel' | 'Post' | 'Campaign creative' | 'Short-form video' | 'Brand content'
  platform: Platform
  explanation: string
  thumbnail: ImageRef
  video?: string
  result?: string
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

export interface SectionFlags {
  showHero: boolean
  showRecruiterOverview: boolean
  showAbout: boolean
  showServices: boolean
  showWork: boolean
  showCaseStudies: boolean
  showTools: boolean
  showContentGallery: boolean
  showStrategy: boolean
  showWebsiteProjects: boolean
  showTestimonials: boolean
  showMentoring: boolean
  showContact: boolean
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
  site: {
    url: string
    title: string
    description: string
    ogImage: string
    /** Spelling locale for built-in interface copy, for example en-GB or en-CA. */
    locale: string
    currency: string
  }
  theme: {
    colors: ThemeColors
    fonts: { display: string; script: string; body: string }
    borderStyle: 'perforated' | 'soft' | 'sharp'
    animationIntensity: Intensity
    bubbleCursor: boolean
    stampNumeral: string
  }
  sections: SectionFlags
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
    whatsappGreeting: string
    showBudget: boolean
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
