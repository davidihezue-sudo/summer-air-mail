import type { Portfolio } from './types'
import { DEFAULT_RANGES, emptyOverride } from '../themes/seasonManager'
import { defaultSections } from './sections'

/**
 * STARTER CONTENT.
 *
 * These are the defaults the site uses until you publish from the admin (/admin). Once you publish,
 * the admin's content takes over and this file is only the fallback and the starting point for a
 * brand new install. You can edit it directly if you prefer working in code.
 *
 * Anything wrapped in square brackets, such as "[Add your biography]", is a visible placeholder.
 * Empty strings and null values are hidden automatically, so links, images and statistics only
 * appear once you supply real information. Never add results, clients or qualifications that are
 * not genuinely yours.
 */
export const portfolio: Portfolio = {
  profile: {
    fullName: 'Your Name',
    preferredName: 'Your Name',
    title: 'Social Media Manager and Digital Marketer',
    roles: ['Social Media Strategist', 'Content Creator', 'Brand Storyteller', 'Digital Marketer'],
    tagline: 'Marketing with a point of view, measured by what it moves.',
    intro:
      'I plan, produce and measure social-first marketing that gives brands a clear voice and gives audiences a reason to act.',
    bio: [
      '[Add paragraph one: the kind of marketing you do, who you do it for and the problems you solve.]',
      '[Add paragraph two: how you work. Research first, then positioning, content, community and reporting.]',
      '[Add paragraph three: what you want to do next and the kind of team you want to join.]',
    ],
    yearsExperience: null,
    location: '',
    email: '',
    phone: '',
    whatsapp: '',
    social: {
      linkedin: '',
      instagram: '',
      tiktok: '',
      facebook: '',
      youtube: '',
      pinterest: '',
      website: '',
    },
    profilePhoto: null,
    heroPortrait: null,
    heroCutout: null,
    heroFlowers: null,
    signature: '',
    cvFile: '',
    availability: 'Open to new opportunities',
    employmentType: 'Full-time, hybrid or remote',
    targetJobs: [
      'Social Media Manager',
      'Digital Marketing Manager',
      'Content Strategist',
      'Brand and Communications Manager',
    ],
    highlights: [],
  },
  cv: { enabled: true, title: 'Curriculum vitae', version: '', filename: '' },
  site: {
    url: '',
    locale: 'en-GB',
    currency: 'GBP',
  },
  hero: {
    label: '',
    headline: '',
    supporting: '',
    intro: '',
    layout: 'stamp-right',
    alignment: 'left',
    breakout: true,
    animation: 'inherit',
    ctas: [
      { label: 'View selected work', target: 'work' },
      { label: 'See results', target: 'results' },
      { label: 'Get in touch', target: 'contact' },
    ],
    decorativeElements: true,
    background: 'season',
    tideSize: 190,
    tideEnabled: true,
    orb: { style: 'bubble', size: 84, x: 79, y: 47, color: '', opacity: 0.95, rim: 0.7, shine: true, blur: 6, wobble: 'gentle', float: 14, parallax: 30, satellites: 3 },
  },
  theme: {
    fonts: {
      display: "'Italiana', 'Didot', 'Bodoni 72', Georgia, serif",
      script: "'Pinyon Script', 'Snell Roundhand', cursive",
      body: "'Figtree Variable', 'Figtree', system-ui, sans-serif",
    },
    borderStyle: 'perforated',
    animationIntensity: 'full',
    bubbleCursor: true,
    stampNumeral: '25',
    // creative: all decoration and motion. balanced: restrained. professional: editorial and calm.
    professional: 'balanced',
  },
  seasons: {
    mode: 'auto',
    ranges: DEFAULT_RANGES,
    transition: 'fade',
    overrides: {
      spring: emptyOverride(),
      summer: { ...emptyOverride(), intensity: 'expressive' },
      autumn: emptyOverride(),
      winter: emptyOverride(),
    },
  },
  design: {
    radius: 'soft', buttons: 'pill', density: 'comfortable', fontScale: 1, shadow: 'soft', borderWeight: 'normal',
    headingCase: 'normal', colorMode: 'light', colorToggle: false, dialogAnimation: true, readingProgress: true, cards: 'soft',
  },
  extras: { backToTop: true, availabilityBadge: true, projectNav: true, copyEmail: true, clientStrip: false, readingTime: true },
  media: { cardFit: 'smart', fill: 'blur', cardShape: 'auto', screenshots: 'masonry' },
  toolsUi: { layout: 'cards', showLogos: true, showNames: true, showUsage: true, showCategory: true, logoSize: 'md', logoStyle: 'color', tile: 'white', tabs: true, group: true, glow: true },
  cursor: {
    enabled: true, style: 'bubbles', size: 28, color: '', opacity: 0.85, smoothing: 0.35, trail: 20,
    blend: 'normal', scope: 'page', hideNativeCursor: false, growOnLinks: true, emoji: '', image: null,
    touchRipple: false, showIn: 'creative',
  },
  announcement: { enabled: false, text: '', linkLabel: '', link: '', tone: 'ink', dismissible: true, from: '', to: '' },
  schedule: [],
  booking: { enabled: false, label: 'Book a call', url: '', showIn: ['contact'] },
  newsletter: {
    enabled: false, mode: 'link', heading: 'Stay in the loop', text: 'Occasional notes on social media and marketing. No spam.',
    buttonLabel: 'Subscribe', consentText: 'I agree to receive occasional emails and understand I can unsubscribe at any time.',
    successMessage: 'Thank you. You are on the list.', link: '',
  },
  profilePage: {
    enabled: true, title: '', subtitle: '', showPhoto: true, accent: '',
    include: { summary: true, competencies: true, platforms: true, industries: true, achievements: true, results: true, projects: true, tools: true, education: true, certifications: true, employment: true, contact: true },
    resultIds: [], projectIds: [], maxProjects: 4, footerNote: '',
  },
  maintenance: { enabled: false, title: 'Back soon', message: 'The portfolio is being updated. Please check back shortly.', status503: false, showContact: true, showSocial: true },
  notFound: { title: 'This page has moved on', message: 'The page you were looking for is not here. The portfolio home page is a good place to start.', buttonLabel: 'Back to the portfolio' },
  i18n: { enabled: false, defaultLabel: 'English', switcher: true, languages: [] },
  insights: { enabled: false, respectDoNotTrack: true, requireConsent: false, retentionDays: 365 },
  quality: { minDescription: 60, requireCover: true, requireAlt: true, requirePeriod: false, requireLink: false },
  sections: defaultSections(),
  navigation: { mode: 'auto', items: [] },
  seo: {
    title: 'Your Name | Social Media and Digital Marketing Portfolio',
    description:
      'Portfolio of a social media manager and digital marketer: strategy, content, campaigns and measured results.',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonical: '',
    robots: 'index',
    structuredData: true,
  },
  analytics: { enabled: false, ga4: '', gtm: '', metaPixel: '', requireConsent: true, respectDoNotTrack: true },
  footer: { tagline: '', copyright: '', showSocial: true, showNav: true, showFootprints: true },
  stats: [
    // Every statistic is optional. Leave value as null (or 0) to hide it.
    { key: 'projects', label: 'Projects delivered', value: null },
    { key: 'brands', label: 'Brands managed', value: null },
    { key: 'campaigns', label: 'Campaigns executed', value: null },
    { key: 'content', label: 'Content pieces produced', value: null },
    { key: 'audience', label: 'Audience grown', value: null, suffix: '+' },
    { key: 'engagement', label: 'Engagement uplift', value: null, suffix: '%', note: 'State the period and platform in the note.' },
  ],
  recruiter: {
    competencies: [
      'Social media strategy',
      'Content strategy and creation',
      'Community management',
      'Campaign planning',
      'Performance reporting',
      'Brand voice and copywriting',
    ],
    platforms: [],
    industries: [],
    achievements: [],
    education: [],
    certifications: [],
    employment: [],
  },
  contact: {
    budgetRanges: [
      { min: 500, max: 1000 },
      { min: 1000, max: 2500 },
      { min: 2500, max: 5000 },
      { min: 5000, max: null },
    ],
    enquiryTypes: [
      "I'm contacting you about a job opportunity",
      'Freelance project',
      'Social media management',
      'Content creation',
      'Campaign or brand strategy',
      'Something else',
    ],
    recruiterType: "I'm contacting you about a job opportunity",
    whatsappGreeting: 'Hello, I found your portfolio and would like to talk.',
    showBudget: true,
    availableFor: ['Full-time roles'],
    workModes: ['Hybrid', 'Remote'],
    delivery: 'client',
    successMessage: 'Thank you. Your message has been sent and I will reply soon.',
  },
  mentoring: {
    heading: 'Learn social media marketing with me',
    overview: '[Describe your course or mentoring offer.]',
    topics: [],
    outcomes: [],
    format: '',
    instructorPhoto: null,
    showLiveBadge: false,
  },
  strategy: {
    label: 'Sample framework',
    hint: 'Tap any note to open it and see the questions behind each step.',
    showToggleAll: true,
    heading: 'How a marketing plan comes together',
    intro:
      'This is an illustrative framework showing how I structure planning. It is not a client project and contains no results.',
    steps: [
      { title: 'Audience research', color: 'sky', summary: 'Who they are, where they spend time and what they already trust.', questions: ['Who is the core audience?', 'Which platforms do they use daily?', 'What do they ask or complain about?'] },
      { title: 'Competitor research', color: 'butter', summary: 'What the category sounds like and where the open space is.', questions: ['Who competes for attention?', 'Which formats earn engagement?', 'What is nobody saying?'] },
      { title: 'Brand positioning', color: 'pink', summary: 'One clear idea the audience can repeat.', questions: ['What do we stand for?', 'What proof do we have?', 'What tone fits?'] },
      { title: 'Content pillars', color: 'sage', summary: 'Three to five themes that keep output focused.', questions: ['Which themes serve the objective?', 'Which are educational, which are emotional?', 'What is the content mix?'] },
      { title: 'Marketing objectives', color: 'peach', summary: 'Goals tied to the business with a baseline and a date.', questions: ['What does success change commercially?', 'What is the baseline?', 'By when?'] },
      { title: 'Campaign planning', color: 'aqua', summary: 'Big idea, phases, creative routes and owners.', questions: ['What is the one idea?', 'What are the phases?', 'Who approves what?'] },
      { title: 'Customer journey', color: 'sand', summary: 'From first glance to enquiry, purchase or advocacy.', questions: ['Where do people discover us?', 'What nudges them forward?', 'Where do they drop out?'] },
      { title: 'Channel selection', color: 'sky', summary: 'Fewer channels done well beat every channel done thinly.', questions: ['Where is the audience?', 'What can we sustain?', 'What role does each channel play?'] },
      { title: 'Content calendar', color: 'butter', summary: 'A rhythm the team can actually keep.', questions: ['What is the weekly cadence?', 'What is planned versus reactive?', 'What is the approval flow?'] },
      { title: 'Performance measurement', color: 'pink', summary: 'Report against the baseline, learn, adjust.', questions: ['Which metrics match the objective?', 'What changed and why might that be?', 'What do we do next?'] },
    ],
  },
}
