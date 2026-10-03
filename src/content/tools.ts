import type { Tool } from './types'

/**
 * A catalogue of common tools. NOTHING is shown until you set confirmed: true
 * AND write a truthful usage line. Delete the tools you do not use.
 */
export const tools: Tool[] = [
  { id: 'meta-suite', name: 'Meta Business Suite', category: 'Social Media Management', confirmed: false, usage: '[How you use it]' },
  { id: 'hootsuite', name: 'Hootsuite', category: 'Social Media Management', confirmed: false, usage: '[How you use it]' },
  { id: 'buffer', name: 'Buffer', category: 'Social Media Management', confirmed: false, usage: '[How you use it]' },
  { id: 'later', name: 'Later', category: 'Social Media Management', confirmed: false, usage: '[How you use it]' },
  { id: 'canva', name: 'Canva', category: 'Design', confirmed: false, usage: '[How you use it]' },
  { id: 'adobe', name: 'Adobe Creative Cloud', category: 'Design', confirmed: false, usage: '[How you use it]' },
  { id: 'capcut', name: 'CapCut', category: 'Content Creation', confirmed: false, usage: '[How you use it]' },
  { id: 'ga', name: 'Google Analytics', category: 'Analytics', confirmed: false, usage: '[How you use it]' },
  { id: 'sprout', name: 'Sprout Social', category: 'Analytics', confirmed: false, usage: '[How you use it]' },
  { id: 'meta-ads', name: 'Meta Ads Manager', category: 'Advertising', confirmed: false, usage: '[How you use it]' },
  { id: 'google-ads', name: 'Google Ads', category: 'Advertising', confirmed: false, usage: '[How you use it]' },
  { id: 'mailchimp', name: 'Mailchimp', category: 'AI and Automation', confirmed: false, usage: '[How you use it]' },
  { id: 'hubspot', name: 'HubSpot', category: 'AI and Automation', confirmed: false, usage: '[How you use it]' },
  { id: 'chatgpt', name: 'ChatGPT', category: 'AI and Automation', confirmed: false, usage: '[How you use it]' },
]
