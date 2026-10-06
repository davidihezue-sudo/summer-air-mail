// DEV PREVIEW ONLY. Loaded with ?sample=1 and excluded from production builds.
// Everything here is labelled SAMPLE and contains no real brands or results.
import type { ContentBundle } from './bundle'
import type { ImageRef, Project, SiteContent } from './types'

function art(label: string, a: string, b: string, w = 800, h = 1000): ImageRef {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.7}" cy="${h * 0.3}" r="${w * 0.14}" fill="#fff" opacity=".55"/><text x="50%" y="55%" text-anchor="middle" font-family="Georgia,serif" font-size="${w / 12}" fill="#17323F">SAMPLE</text><text x="50%" y="62%" text-anchor="middle" font-family="Georgia,serif" font-size="${w / 20}" fill="#17323F">${label}</text></svg>`
  return { src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, alt: `Sample placeholder artwork: ${label}`, width: w, height: h }
}

const mkProject = (i: number, category: string, a: string, b: string): Project => ({
  id: `sample-${i}`,
  title: `Sample Project ${i}`,
  client: 'Sample Brand',
  industry: 'Sample industry',
  category,
  description: 'Sample description showing how a project card reads once real details are added.',
  year: '2025',
  period: 'Jan to Jun 2025',
  platforms: ['instagram', 'tiktok'],
  role: 'Sample role',
  featured: i === 1,
  order: i,
  thumbnail: art(`Project ${i}`, a, b, 800, 800),
  media: [
    { type: 'image', src: art(`Project ${i} frame 1`, a, b, 1200, 800).src, alt: 'Sample frame one' },
    { type: 'image', src: art(`Project ${i} frame 2`, b, a, 1200, 800).src, alt: 'Sample frame two' },
  ],
  externalLink: 'https://example.com',
  blocks: i === 1 ? [
    { id: 'b1', type: 'heading', text: 'Sample content blocks', level: 2 },
    { id: 'b2', type: 'paragraph', text: 'Sample paragraph with **bold** text and a [link](https://example.com).' },
    { id: 'b3', type: 'gallery', images: [art('G1', '#A9DCEB', '#F39CAB', 800, 600), art('G2', '#F6DC8C', '#93C383', 800, 600)], caption: 'Sample gallery' },
    { id: 'b4', type: 'metric', label: 'Sample metric', value: 42, unit: '%', period: 'Sample period', classification: 'illustrative' },
    { id: 'b5', type: 'chart', chart: 'bar', title: 'Sample chart', points: [{ label: 'Q1', value: 10 }, { label: 'Q2', value: 18 }, { label: 'Q3', value: 27 }] },
    { id: 'b6', type: 'quote', text: 'Sample quote.', attribution: 'Sample attribution' },
    { id: 'b7', type: 'link', url: 'https://example.com', label: 'Sample link card', description: 'Sample description' },
  ] : [],
  serviceIds: i === 1 ? ['strategy', 'content'] : [],
  resultIds: i === 1 ? ['r1'] : [],
  caseStudy:
    i <= 2
      ? {
          objective: 'Sample objective: grow engaged audience.',
          challenge: 'Sample challenge text describing the business situation.',
          objectives: ['Sample objective one', 'Sample objective two'],
          strategy: 'Sample strategy text explaining the thinking behind the approach.',
          execution: ['Sample execution step one', 'Sample execution step two'],
          deliverables: ['Content calendar', 'Reel series'],
          metrics: [
            { label: 'Sample engagement rate', baseline: 2.1, result: 4.6, unit: '%', period: 'Sample period' },
            { label: 'Sample reach', baseline: 12000, result: 31000, period: 'Sample period' },
          ],
          contribution: { personal: ['Sample personal contribution'], team: ['Sample team contribution'] },
          lessons: ['Sample lesson one'],
          beforeAfter: { before: art('Before', '#ccc', '#999', 800, 600), after: art('After', '#8FD3CF', '#F6DC8C', 800, 600), caption: 'Sample before and after.' },
        }
      : undefined,
})

export function sampleContent(base: ContentBundle): SiteContent {
  return {
    ...base,
    portfolio: {
      ...base.portfolio,
      profile: { ...base.portfolio.profile, yearsExperience: 5, email: 'hello@example.com', whatsapp: '+441234567890', cvFile: '/documents/sample.pdf', social: { ...base.portfolio.profile.social, linkedin: 'https://www.linkedin.com/', instagram: 'https://www.instagram.com/' } },
      stats: base.portfolio.stats.map((s, i) => (i < 3 ? { ...s, value: (i + 1) * 12 } : s)),
      sections: base.portfolio.sections.map((x) => (x.type === 'mentoring' ? { ...x, enabled: true } : x)),
      mentoring: { ...base.portfolio.mentoring, overview: 'Sample mentoring overview.', topics: ['Sample topic'], outcomes: ['Sample outcome'], format: 'Sample format' },
      announcement: { ...base.portfolio.announcement, enabled: true, text: 'Sample announcement banner.', linkLabel: 'Sample link', link: 'https://example.com', tone: 'ink', dismissible: true },
      booking: { enabled: true, label: 'Sample booking', url: 'https://example.com/book', showIn: ['hero', 'contact', 'header'] },
      newsletter: { ...base.portfolio.newsletter, enabled: true, mode: 'link', link: 'https://example.com/news' },
      design: { ...base.portfolio.design, colorToggle: true },
      i18n: { enabled: true, defaultLabel: 'English', switcher: true, languages: [{ code: 'fr', label: 'Sample FR', rtl: false, ui: { 'cv.nav': 'CV (fr)' }, text: { 'portfolio.profile.tagline': 'Sample tagline in French' } }], translateEmail: '' },
      contact: { ...base.portfolio.contact, delivery: 'both' },
    },
    journey: [{ id: 'j1', period: 'Sample 2022 to 2024', title: 'Sample role', org: 'Sample employer', description: 'Sample description of a role.', kind: 'role', link: '', image: null, hidden: false }, { id: 'j2', period: 'Sample 2024', title: 'Sample award', org: 'Sample body', description: 'Sample award.', kind: 'award', link: '', image: null, hidden: false }],
    resources: [{ id: 'rs1', title: 'Sample media kit', description: 'Sample downloadable.', file: '/documents/sample.pdf', image: null, format: 'PDF', hidden: false }],
    notes: [{ id: 'n1', slug: 'sample-note', title: 'Sample note', date: '2026-01-15', summary: 'Sample summary of a note.', body: 'Sample body paragraph.\n\n- Sample point one\n- Sample point two', cover: null, tags: ['sample'], seoTitle: '', seoDescription: '', hidden: false }],
    projects: [
      mkProject(1, 'Social Media', '#A9DCEB', '#F39CAB'),
      mkProject(2, 'Campaigns', '#F6DC8C', '#F4A77E'),
      mkProject(3, 'Branding', '#93C383', '#8FD3CF'),
      mkProject(4, 'Content Creation', '#F39CAB', '#EED9B4'),
    ],
    tools: base.tools.map((t, i) => (i < 6 ? { ...t, confirmed: true, usage: 'Sample usage description.' } : t)),
    testimonials: [{ id: 't1', name: 'Sample Person', title: 'Sample Title', company: 'Sample Company', quote: 'Sample testimonial text. Real testimonials only appear once approved.', relationship: 'Sample relationship', approved: true }],
    contentItems: [1, 2, 3, 4].map((i) => ({ id: `c${i}`, title: `Sample ${i % 2 ? 'Reel' : 'Carousel'} ${i}`, format: i % 2 ? ('Reel' as const) : ('Carousel' as const), platform: 'instagram', explanation: 'Sample explanation of the content idea.', thumbnail: art(`Content ${i}`, '#F6DC8C', '#F39CAB', 540, 960), result: i === 1 ? 'Sample result note' : undefined })),
    websites: [{ id: 'w1', name: 'Sample Site', url: 'www.example.com', description: 'Sample website description.', responsibilities: ['Sample responsibility'], platform: 'Sample CMS', screenshots: [art('Screen 1', '#A9DCEB', '#EED9B4', 1200, 2400), art('Screen 2', '#93C383', '#F6DC8C', 1200, 2400)], externalLink: 'https://example.com' }, { id: 'w2', name: 'Second Sample', url: 'www.example.org', description: 'Another sample.', responsibilities: ['Sample'], platform: 'Sample', screenshots: [art('Screen A', '#F39CAB', '#EED9B4', 1200, 2400)] }],
    skills: base.skills.map((g, gi) => ({ ...g, skills: g.skills.map((k, ki) => ({ ...k, visible: ki < 3, level: ki === 0 && gi === 0 ? ('Advanced' as const) : ('' as const) })) })),
    platforms: base.platforms.map((p, i) => (i < 3 ? { ...p, hidden: false, level: 'Proficient' as const, services: ['Sample service'], contentTypes: ['Reels', 'Carousels'], campaigns: ['Sample campaign'], analytics: 'Sample analytics experience.', advertising: i === 0 ? 'Sample advertising experience.' : '', projectIds: ['sample-1'] } : p)),
    aiSkills: [
      { id: 'ai1', name: 'Sample AI skill', category: 'AI Content Creation', description: 'Sample description of how an AI tool was used.', tool: 'Sample tool', level: 'Proficient', outcome: 'Sample outcome', projectId: 'sample-1', hidden: false },
      { id: 'ai2', name: 'Sample prompt workflow', category: 'Prompt Engineering', description: 'Sample description.', tool: 'Sample tool', hidden: false },
    ],
    results: [
      { id: 'r1', metric: 'Sample engagement rate', start: 2.1, end: 4.6, unit: '%', pctChange: null, period: 'Sample period', platform: 'instagram', campaign: 'Sample campaign', projectId: 'sample-1', context: 'Sample context.', notes: '', screenshot: null, chart: 'bar', series: [], classification: 'illustrative', contribution: 'shared', anonymised: '', showValues: true, hidden: false },
      { id: 'r2', metric: 'Sample follower growth', start: 1200, end: 3400, unit: '', pctChange: null, period: 'Sample period', platform: 'tiktok', campaign: '', projectId: '', context: '', notes: '', screenshot: null, chart: 'line', series: [{ label: 'Jan', value: 1200 }, { label: 'Feb', value: 1900 }, { label: 'Mar', value: 2600 }, { label: 'Apr', value: 3400 }], classification: 'illustrative', contribution: 'individual', anonymised: '', showValues: true, hidden: false },
      { id: 'r3', metric: 'Sample confidential result', start: null, end: null, unit: '', pctChange: null, period: 'Sample period', platform: '', campaign: '', projectId: '', context: '', notes: '', screenshot: null, chart: 'stat', series: [], classification: 'confidential', contribution: 'team', anonymised: 'Sample approved wording: a double digit improvement.', showValues: false, hidden: false },
    ],
    screenshots: [
      { id: 's1', image: art('Profile', '#A9DCEB', '#F6DC8C', 900, 1200), caption: 'Sample profile screenshot', category: 'Profiles', hidden: false },
      { id: 's2', image: art('Dashboard', '#F39CAB', '#EED9B4', 1200, 800), caption: 'Sample dashboard', category: 'Analytics', hidden: false },
      { id: 's3', image: art('Before', '#ccc', '#999', 1000, 700), compareWith: art('After', '#8FD3CF', '#F6DC8C', 1000, 700), caption: 'Sample feed redesign', category: 'Profiles', hidden: false },
    ],
  }
}
