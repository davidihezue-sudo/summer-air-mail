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
  accent?: string
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
  /** The one-glance headline at the top of the case study. metricIndex picks one of the measured results. */
  highlight?: { metricIndex: number | null; headline: string }
}

export interface Project {
  id: string
  /** A short label on the card, for example "New" or "Award winner". Replaces "Featured" when set. */
  badge?: string
  /** A palette name or hex colour used for this card's accent. */
  accent?: string
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
  /** Optional overrides for search results and social sharing of this project's own link. */
  seo?: { title: string; description: string; image: string }
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
  /** An uploaded logo. Takes priority over the automatic brand mark. */
  logo?: string
  /** Or a link to a logo image (https). */
  logoUrl?: string
  /** Pick a built-in brand mark by name, or leave empty to match the tool's name automatically. */
  logoSlug?: string
  /** Brand colour for the logo tile. Blank uses the brand's own colour. */
  color?: string
  /** Where the tool's own site is. Makes the card a link. */
  link?: string
}

export interface ToolsUi {
  layout: 'cards' | 'rings' | 'compact'
  showLogos: boolean
  showUsage: boolean
  showCategory: boolean
  logoSize: 'sm' | 'md' | 'lg'
  logoStyle: 'color' | 'mono'
  group: boolean
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
  accent?: string
  name: string
  title: string
  company: string
  quote: string
  relationship: string
  photo?: ImageRef
  /** A recorded recommendation. Plays only when the visitor presses play. */
  video?: string
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
  | 'journey' | 'resources' | 'notes' | 'newsletter'

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
  /** Vertical breathing room. Empty uses the global density. */
  spacing?: '' | 'compact' | 'spacious'
  /** Shape between this section and the one above. Empty follows the season. */
  divider?: '' | 'none' | 'waves' | 'hills' | 'deckle' | 'ridge'
  pattern?: '' | 'dots' | 'grid' | 'paper'
  width?: '' | 'narrow' | 'wide'
  /** For sections with more than one arrangement (testimonials, notes, journey, results). */
  layout?: '' | 'grid' | 'list' | 'carousel'
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
  /** Night Tide reveal circle: radius in px on desktop (touch uses 65% of it) and whether it is allowed at all. */
  tideSize: number
  tideEnabled: boolean
  /** The large circle behind the stamp. */
  orb: HeroOrb
}

export interface HeroOrb {
  /** bubble: a glassy water bubble. sun, glow and ring are simpler. */
  style: 'bubble' | 'sun' | 'glow' | 'ring' | 'none'
  /** Diameter in vmin (a percentage of the screen's shorter side). */
  size: number
  /** Where the centre sits, as a percentage of the hero width and height. */
  x: number
  y: number
  /** Blank uses a colour that suits the style and the season. Otherwise a palette name or a hex colour. */
  color: string
  opacity: number
  /** How strong the rainbow sheen on the rim is, 0 to 1. */
  rim: number
  /** The bright reflection in the top left. */
  shine: boolean
  /** Frosted glass blur behind the bubble in px. */
  blur: number
  wobble: 'off' | 'gentle' | 'lively'
  /** Distance in px it drifts up and down. 0 holds it still. */
  float: number
  /** How far it moves as the visitor scrolls, 0 to 100. */
  parallax: number
  /** Small bubbles that float around it, 0 to 8. */
  satellites: number
}

export type CursorStyle =
  | 'bubbles' | 'water' | 'ring' | 'dot' | 'spotlight' | 'glow' | 'ripple' | 'sparkles'
  | 'comet' | 'blob' | 'crosshair' | 'seasonal' | 'emoji' | 'image'

/** The thing that follows the pointer. Everything here is editable in Admin > Cursor. */
export interface CursorSettings {
  enabled: boolean
  style: CursorStyle
  /** Diameter in px of the main shape (or particle scale for trails). */
  size: number
  /** "auto" follows the season; otherwise a palette tone name or a hex colour. */
  color: string
  opacity: number
  /** 0 snaps to the pointer, 1 trails far behind. */
  smoothing: number
  /** Length of the trail for trail styles (0 to 40). */
  trail: number
  blend: 'normal' | 'multiply' | 'screen' | 'difference'
  scope: 'page' | 'hero'
  hideNativeCursor: boolean
  growOnLinks: boolean
  emoji: string
  image: ImageRef | null
  /** Play a small ripple where touch screens are tapped. */
  touchRipple: boolean
  /** The calmest professional intensity at which the effect still appears. creative: Creative only. balanced: Creative and Balanced. professional: always. */
  showIn: ProfessionalIntensity
}

/* ---------- Design, banner, schedule, looks ---------- */

export interface DesignSettings {
  radius: 'sharp' | 'soft' | 'round'
  buttons: 'pill' | 'rounded' | 'square'
  density: 'compact' | 'comfortable' | 'spacious'
  /** Scales all text. 1 is normal. */
  fontScale: number
  shadow: 'none' | 'soft' | 'strong'
  borderWeight: 'thin' | 'normal' | 'bold'
  headingCase: 'normal' | 'upper'
  colorMode: 'light' | 'dark' | 'system'
  /** Show a light and dark switch to visitors. */
  colorToggle: boolean
  dialogAnimation: boolean
  readingProgress: boolean
  /** Look of cards across the site. */
  cards: 'soft' | 'flat' | 'outlined' | 'glass'
}

export interface Announcement {
  enabled: boolean
  text: string
  linkLabel: string
  link: string
  tone: 'ink' | 'red' | 'butter' | 'sky' | 'green'
  dismissible: boolean
  /** ISO dates. Empty means no limit. */
  from: string
  to: string
}

export interface ScheduleRule {
  id: string
  label: string
  enabled: boolean
  from: string
  to: string
  seasonMode: SeasonMode | ''
  professional: ProfessionalIntensity | ''
  availability: string
  heroLabel: string
  heroHeadline: string
  heroIntro: string
  showSectionIds: string[]
  hideSectionIds: string[]
  announcementText: string
  announcementLink: string
}

export interface LookSettings {
  professional: ProfessionalIntensity
  animationIntensity: Intensity
  seasonMode: SeasonMode
  design: DesignSettings
  hero: Pick<HeroConfig, 'layout' | 'alignment' | 'breakout' | 'animation' | 'decorativeElements' | 'background'>
}

export interface Look {
  id: string
  name: string
  description: string
  settings: LookSettings
}

/* ---------- Applications, journey, resources, notes, links ---------- */

export interface Application {
  id: string
  /** Part of the link: yoursite.com/for/<slug>. Use something unguessable for private applications. */
  slug: string
  /** Private note to yourself. Never sent to visitors. */
  label: string
  company: string
  role: string
  enabled: boolean
  /** ISO date. Empty means the link never expires. */
  expiresAt: string
  hero: { label: string; headline: string; supporting: string; intro: string }
  greeting: { enabled: boolean; text: string }
  featuredProjectIds: string[]
  onlyFeatured: boolean
  highlightSkills: string[]
  hideSectionIds: string[]
  lookId: string
  professional: ProfessionalIntensity | ''
  season: SeasonName | ''
  cvFile: string
  cvFilename: string
}

export interface JourneyItem {
  id: string
  period: string
  title: string
  org: string
  description: string
  kind: 'role' | 'project' | 'learning' | 'award' | 'milestone'
  link: string
  image: ImageRef | null
  hidden?: boolean
}

export interface Resource {
  id: string
  title: string
  description: string
  file: string
  image: ImageRef | null
  format: string
  hidden?: boolean
}

export interface Note {
  id: string
  slug: string
  title: string
  date: string
  summary: string
  body: string
  cover: ImageRef | null
  tags: string[]
  seoTitle: string
  seoDescription: string
  hidden?: boolean
}

export interface ShortLink {
  id: string
  slug: string
  label: string
  target: { type: 'section' | 'project' | 'application' | 'note' | 'profile' | 'url'; value: string }
  enabled: boolean
}

export interface LanguagePack {
  code: string
  label: string
  rtl: boolean
  /** Interface strings by key (see src/i18n/ui.ts). */
  ui: Record<string, string>
  /** Content strings by path, for example "portfolio.profile.intro" or "projects.<id>.title". */
  text: Record<string, string>
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
  design: DesignSettings
  toolsUi: ToolsUi
  cursor: CursorSettings
  announcement: Announcement
  schedule: ScheduleRule[]
  booking: { enabled: boolean; label: string; url: string; showIn: ('hero' | 'header' | 'contact' | 'profile')[] }
  newsletter: {
    enabled: boolean
    mode: 'collect' | 'link'
    heading: string
    text: string
    buttonLabel: string
    consentText: string
    successMessage: string
    link: string
  }
  profilePage: {
    enabled: boolean
    title: string
    subtitle: string
    showPhoto: boolean
    accent: string
    include: Record<'summary' | 'competencies' | 'platforms' | 'industries' | 'achievements' | 'results' | 'projects' | 'tools' | 'education' | 'certifications' | 'employment' | 'contact', boolean>
    resultIds: string[]
    projectIds: string[]
    maxProjects: number
    footerNote: string
  }
  maintenance: { enabled: boolean; title: string; message: string; status503: boolean; showContact: boolean; showSocial: boolean }
  notFound: { title: string; message: string; buttonLabel: string }
  i18n: { enabled: boolean; defaultLabel: string; switcher: boolean; languages: LanguagePack[] }
  insights: { enabled: boolean; respectDoNotTrack: boolean; requireConsent: boolean; retentionDays: number }
  quality: { minDescription: number; requireCover: boolean; requireAlt: boolean; requirePeriod: boolean; requireLink: boolean }
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
    /** client: opens email or WhatsApp. both: also lets visitors send here. server: send here, falling back to email. */
    delivery: 'client' | 'both' | 'server'
    successMessage: string
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
  strategy: { heading: string; intro: string; label: string; hint: string; showToggleAll: boolean; steps: StrategyStep[] }
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
  journey: JourneyItem[]
  resources: Resource[]
  notes: Note[]
  /** Private. Never sent to visitors; one is delivered only to someone who knows its link. */
  applications: Application[]
  /** Private. Resolved by the server. */
  shortLinks: ShortLink[]
  /** Private saved combinations of look and feel. */
  looks: Look[]
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
