// DEV PREVIEW ONLY. Loaded with ?sample=1 and excluded from production builds.
// Everything here is labelled SAMPLE and contains no real brands or results.
import type { ContentBundle } from './bundle'
import type { ImageRef, Project } from './types'

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

export function sampleContent(base: ContentBundle): ContentBundle {
  return {
    ...base,
    portfolio: {
      ...base.portfolio,
      profile: { ...base.portfolio.profile, yearsExperience: 5, email: 'hello@example.com', whatsapp: '+441234567890', cvFile: '/documents/sample.pdf', social: { ...base.portfolio.profile.social, linkedin: 'https://www.linkedin.com/', instagram: 'https://www.instagram.com/' } },
      stats: base.portfolio.stats.map((s, i) => (i < 3 ? { ...s, value: (i + 1) * 12 } : s)),
      sections: { ...base.portfolio.sections, showMentoring: true },
      mentoring: { ...base.portfolio.mentoring, overview: 'Sample mentoring overview.', topics: ['Sample topic'], outcomes: ['Sample outcome'], format: 'Sample format' },
    },
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
  }
}
