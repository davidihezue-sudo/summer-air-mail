import type { SkillGroup } from './types'

const s = (name: string) => ({ name, level: '' as const, visible: false })

/** Catalogue only. Skills stay hidden until you switch them on in the admin. */
export const skills: SkillGroup[] = [
  { id: 'strategy', name: 'Strategy', skills: ['Marketing Strategy', 'Content Strategy', 'Brand Strategy', 'Campaign Planning'].map(s) },
  { id: 'creative', name: 'Creative', skills: ['Copywriting', 'Photography', 'Graphic Design', 'Video Editing'].map(s) },
  { id: 'digital', name: 'Digital', skills: ['Social Media', 'SEO', 'Email Marketing', 'Paid Media'].map(s) },
  { id: 'analytics', name: 'Analytics', skills: ['Reporting', 'Performance Analysis', 'Audience Insights'].map(s) },
  { id: 'technology', name: 'Technology', skills: ['AI', 'Automation', 'CRM', 'Marketing Tools'].map(s) },
]
