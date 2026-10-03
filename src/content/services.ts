import type { Service } from './types'

/**
 * Starting catalogue. The first six are shown by default, the rest are switched off
 * (hidden: true) until you enable the ones that match your real experience.
 * Colours are palette names (sand, sky, aqua, pink, butter, peach, sage) so they follow the season.
 */
const hiddenService = (id: string, name: string, category: string, description: string): Service => ({
  id,
  name,
  category,
  description,
  detail: description,
  icon: 'Sparkles',
  color: 'sky',
  hidden: true,
})

export const services: Service[] = [
  {
    id: 'strategy', name: 'Social Media Strategy', category: 'Strategy', object: 'sunglasses', color: 'sky',
    description: 'Audience research, positioning and a plan tied to a business goal.',
    detail: 'Research the audience and category, define the role of each platform, set objectives with a baseline, and turn it into a plan a team can run.',
    platforms: ['Instagram', 'TikTok', 'LinkedIn', 'Facebook'],
  },
  {
    id: 'content', name: 'Content Creation', category: 'Content', object: 'camera', color: 'pink',
    description: 'Photo, video, carousel and copy built for the feed it will live in.',
    detail: 'Concepts, scripts, shooting, editing and captions, produced for each platform format rather than repurposed blindly.',
    platforms: ['Instagram', 'TikTok', 'YouTube', 'Pinterest'],
  },
  {
    id: 'management', name: 'Social Media Management', category: 'Management', object: 'phone', color: 'aqua',
    description: 'Calendars, publishing, community replies and steady brand voice.',
    detail: 'Content calendars, scheduling, daily community management, moderation and escalation, with a consistent tone of voice.',
    platforms: ['Meta Business Suite', 'LinkedIn', 'TikTok'],
  },
  {
    id: 'brand', name: 'Brand Development', category: 'Strategy', object: 'sunscreen', color: 'butter',
    description: 'Voice, visual direction and messaging that feel like one brand.',
    detail: 'Positioning, tone of voice, content pillars and visual guidelines so every post and campaign reinforces the same idea.',
  },
  {
    id: 'campaigns', name: 'Digital Campaigns', category: 'Growth', object: 'flipflops', color: 'peach',
    description: 'Big idea, phased rollout, creative routes and paid support.',
    detail: 'Campaign concepts, phasing, creative briefs, launch plans and, where relevant, paid social support and creator collaborations.',
  },
  {
    id: 'analytics', name: 'Marketing Analytics', category: 'Analytics', object: 'watermelon', color: 'sage',
    description: 'Reporting that compares against a baseline and recommends the next move.',
    detail: 'Dashboards and monthly reports covering reach, engagement, traffic and conversions, with plain-language insight and recommendations.',
  },
  hiddenService('digital-strategy', 'Digital Marketing Strategy', 'Strategy', 'Channel mix, objectives and a measurement plan across paid, owned and earned.'),
  hiddenService('content-strategy', 'Content Strategy', 'Strategy', 'Content pillars, formats and a calendar mapped to audience needs.'),
  hiddenService('brand-strategy', 'Brand Strategy', 'Strategy', 'Positioning, messaging and tone of voice.'),
  hiddenService('campaign-strategy', 'Campaign Strategy', 'Strategy', 'Campaign concept, phasing and success measures.'),
  hiddenService('copywriting', 'Copywriting', 'Content', 'Captions, scripts, ads and landing page copy in a defined brand voice.'),
  hiddenService('short-form', 'Reels and Short-Form Video', 'Content', 'Scripting, shooting and editing vertical video for Reels, TikTok and Shorts.'),
  hiddenService('photography', 'Photography', 'Content', 'Product, lifestyle and editorial photography for social channels.'),
  hiddenService('graphic-design', 'Graphic Design', 'Content', 'Social graphics, carousels and campaign creative.'),
  hiddenService('storytelling', 'Storytelling', 'Content', 'Narrative-led content that carries a brand idea across posts.'),
  hiddenService('community', 'Community Management', 'Management', 'Replies, moderation and relationship building with the audience.'),
  hiddenService('scheduling', 'Content Scheduling', 'Management', 'Planning and scheduling across platforms with an approval flow.'),
  hiddenService('listening', 'Social Listening', 'Management', 'Monitoring conversations, sentiment and emerging topics.'),
  hiddenService('audience-growth', 'Audience Growth', 'Growth', 'Organic growth plans built on consistent, useful content.'),
  hiddenService('engagement', 'Engagement Strategy', 'Growth', 'Formats and community prompts that earn comments, saves and shares.'),
  hiddenService('influencer', 'Influencer Marketing', 'Growth', 'Sourcing, briefing and managing influencer collaborations.'),
  hiddenService('creators', 'Creator Partnerships', 'Growth', 'Ongoing partnerships with creators aligned to the brand.'),
  hiddenService('meta-ads', 'Meta Ads', 'Advertising', 'Facebook and Instagram campaign setup, testing and optimisation.'),
  hiddenService('tiktok-ads', 'TikTok Ads', 'Advertising', 'Spark Ads and in-feed campaigns on TikTok.'),
  hiddenService('google-ads', 'Google Ads', 'Advertising', 'Search and display campaigns.'),
  hiddenService('paid-social', 'Paid Social', 'Advertising', 'Paid social planning, creative testing and reporting.'),
  hiddenService('social-analytics', 'Social Analytics', 'Analytics', 'Platform analytics, benchmarking and insight.'),
  hiddenService('reporting', 'Campaign Reporting', 'Analytics', 'Clear reports that compare results with objectives.'),
  hiddenService('dashboards', 'Performance Dashboards', 'Analytics', 'Live dashboards that stakeholders can read at a glance.'),
  hiddenService('insights', 'Marketing Insights', 'Analytics', 'Turning data into recommendations.'),
  hiddenService('ai-marketing', 'AI Marketing', 'Technology', 'Using AI tools to speed up research, ideation and production, with human review.'),
  hiddenService('automation', 'Marketing Automation', 'Technology', 'Workflows that remove repetitive marketing tasks.'),
  hiddenService('crm', 'CRM', 'Technology', 'Customer relationship tools and lifecycle messaging.'),
  hiddenService('email', 'Email Marketing', 'Technology', 'Newsletters, flows and segmentation.'),
]
