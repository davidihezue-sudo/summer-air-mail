import type { Service } from './types'

/**
 * Edit, reorder, hide (hidden: true) or delete services freely.
 * Remove any service that does not match your real experience.
 */
export const services: Service[] = [
  {
    id: 'strategy',
    name: 'Social Media Strategy',
    object: 'sunglasses',
    color: '#A9DCEB',
    description: 'Audience research, positioning and a plan tied to a business goal.',
    detail:
      'Research the audience and category, define the role of each platform, set objectives with a baseline, and turn it into a plan a team can run.',
    platforms: ['Instagram', 'TikTok', 'LinkedIn', 'Facebook'],
  },
  {
    id: 'content',
    name: 'Content Creation',
    object: 'camera',
    color: '#F39CAB',
    description: 'Photo, video, carousel and copy built for the feed it will live in.',
    detail:
      'Concepts, scripts, shooting, editing and captions, produced for each platform format rather than repurposed blindly.',
    platforms: ['Instagram', 'TikTok', 'YouTube', 'Pinterest'],
  },
  {
    id: 'management',
    name: 'Social Media Management',
    object: 'phone',
    color: '#8FD3CF',
    description: 'Calendars, publishing, community replies and steady brand voice.',
    detail:
      'Content calendars, scheduling, daily community management, moderation and escalation, with a consistent tone of voice.',
    platforms: ['Meta Business Suite', 'LinkedIn', 'TikTok'],
  },
  {
    id: 'brand',
    name: 'Brand Development',
    object: 'sunscreen',
    color: '#F6DC8C',
    description: 'Voice, visual direction and messaging that feel like one brand.',
    detail:
      'Positioning, tone of voice, content pillars and visual guidelines so every post and campaign reinforces the same idea.',
  },
  {
    id: 'campaigns',
    name: 'Digital Campaigns',
    object: 'flipflops',
    color: '#F4A77E',
    description: 'Big idea, phased rollout, creative routes and paid support.',
    detail:
      'Campaign concepts, phasing, creative briefs, launch plans and, where relevant, paid social support and creator collaborations.',
  },
  {
    id: 'analytics',
    name: 'Marketing Analytics',
    object: 'watermelon',
    color: '#93C383',
    description: 'Reporting that compares against a baseline and recommends the next move.',
    detail:
      'Dashboards and monthly reports covering reach, engagement, traffic and conversions, with plain-language insight and recommendations.',
  },
]
