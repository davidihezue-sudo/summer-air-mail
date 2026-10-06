import { CURSOR_STYLES } from '../motion/cursor'
import type { Field, Opt } from './fields'
import type { SiteContent } from '../content/types'
import {
  PROJECT_TYPES, newAiSkill, newContentItem, newPlatform, newProcessStep, newProject, newResult, newScreenshot,
  newService, newSkillGroup, newTestimonial, newTool, newWebsite, newCaseStudy,
} from '../content/factories'
import { BODY_FONTS, HEADING_FONTS, SCRIPT_FONTS, fontOptions } from '../themes/seasonManager'
import { BRAND_CHOICES, brandDataUri, brandFor, platformAsTool } from '../content/brands'
import { SERVICE_DRAWINGS } from '../content/serviceArt'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const PLATFORMS: Opt[] = ['instagram', 'tiktok', 'facebook', 'linkedin', 'youtube', 'pinterest', 'x', 'threads', 'snapchat', 'web']
const LEVELS: Opt[] = [{ value: '', label: 'Not stated' }, 'Working knowledge', 'Proficient', 'Advanced', 'Specialist']
const SERVICE_CATEGORIES = ['Strategy', 'Content', 'Management', 'Growth', 'Advertising', 'Analytics', 'Technology']
const TOOL_CATEGORIES = ['Social Media Management', 'Content Creation', 'Filming', 'Analytics', 'Advertising', 'Design', 'AI and Automation', 'Workflow and Automation']
const AI_CATEGORIES = ['AI Content Creation', 'AI Copywriting', 'AI Image Generation', 'AI Video Generation', 'AI Research', 'AI Content Ideation', 'AI Analytics', 'AI Automation', 'Prompt Engineering', 'Marketing Workflow Automation', 'AI-Assisted Strategy']
const FORMATS = ['Reel', 'TikTok', 'YouTube Short', 'Story', 'Carousel', 'Post', 'Campaign creative', 'Short-form video', 'Brand video', 'Product video', 'Promotional video', 'Video ad', 'Brand content']
const RESULT_CLASSES: Opt[] = [
  { value: 'verified', label: 'Verified result' }, { value: 'team', label: 'Team result' }, { value: 'individual', label: 'Individual result' },
  { value: 'confidential', label: 'Confidential result' }, { value: 'illustrative', label: 'Illustrative example' },
]
const SERVICE_OBJECTS: Opt[] = [{ value: '', label: 'Automatic: a drawing that fits the name (or the icon below)' }, ...SERVICE_DRAWINGS]

const mediaItem = (): Field[] => [
  { kind: 'select', key: 'type', label: 'Type', options: [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }] },
  { kind: 'file', key: 'src', label: 'File', accept: 'any' },
  { kind: 'textarea', key: 'caption', label: 'Text shown under it (optional)', help: 'Appears on the page directly under this picture or video.' },
  { kind: 'text', key: 'alt', label: 'Description for screen readers (not shown on the page)' },
  { kind: 'file', key: 'poster', label: 'Cover image (videos)', accept: 'image', showIf: (m: any) => m.type === 'video' },
]

export interface EntityDef {
  id: string
  title: string
  singular: string
  intro: string
  collection: keyof SiteContent & string
  make: () => any
  titleOf: (x: any) => string
  subtitleOf?: (x: any) => string
  thumbOf?: (x: any) => string | undefined
  shown: (x: any) => boolean
  setShown: (x: any, v: boolean) => void
  shownLabels: [string, string]
  featured?: boolean
  filter?: (x: any) => boolean
  fields: Field[]
  /** Offer the case study switch (projects only). */
  caseStudy?: boolean
  /** A "Show" filter over the same records, for example all projects, case studies only, campaigns only. The first is the default. */
  views?: { value: string; label: string; test: (x: any) => boolean }[]
  /** Extra "Add" buttons for other kinds of the same record. */
  makers?: { label: string; make: () => any }[]
}

const hiddenToggle = { shown: (x: any) => !x.hidden, setShown: (x: any, v: boolean) => { x.hidden = !v }, shownLabels: ['Published', 'Draft'] as [string, string] }

export const PROJECT_FIELDS: Field[] = [
  {
    kind: 'group', label: 'Basics', fields: [
      { kind: 'text', key: 'title', label: 'Project title' }, { kind: 'text', key: 'client', label: 'Client or brand' },
      { kind: 'select', key: 'cardFormat', label: 'Card picture shape (this project)', options: [{ value: '', label: 'Use the site setting' }, { value: 'square', label: 'Square (1:1)' }, { value: 'portrait', label: 'Instagram portrait (4:5)' }, { value: 'story', label: 'Story, Reel and TikTok (9:16)' }, { value: 'tall', label: 'Pinterest (2:3)' }, { value: 'landscape', label: 'YouTube (16:9)' }, { value: 'wide', label: 'Facebook and LinkedIn link (1.91:1)' }] },
      { kind: 'text', key: 'badge', label: 'Card label (for example New, Award winner)', help: 'Replaces the Featured label on the card when filled in.', maxLength: 24 }, { kind: 'tone', key: 'accent', label: 'Card accent colour', help: 'Colours the label and the bottom edge of this card.' },
      { kind: 'text', key: 'industry', label: 'Industry' },
      { kind: 'select', key: 'category', label: 'Project type', options: (c: SiteContent) => [...new Set([...PROJECT_TYPES, ...c.categories, ...c.projects.map((p) => p.category).filter(Boolean)])], custom: true, help: 'Visitors can filter by this. Add your own type if none fit.' },
      { kind: 'textarea', key: 'description', label: 'Short description', help: 'One or two honest sentences. Shown on the project card.' },
      { kind: 'text', key: 'year', label: 'Year' }, { kind: 'text', key: 'period', label: 'Campaign duration (for example Mar to Jun 2025)' },
      { kind: 'text', key: 'role', label: 'My role' }, { kind: 'url', key: 'externalLink', label: 'External link (live project, campaign page)' },
      { kind: 'number', key: 'order', label: 'Display order (lower shows first)', nullable: true },
    ],
  },
  {
    kind: 'group', label: 'Cover image and gallery', fields: [
      { kind: 'image', video: true, key: 'thumbnail', label: 'Cover image', help: 'Shown on the Polaroid card.' },
      { kind: 'list', key: 'media', label: 'Lead gallery (images or videos shown at the top)', item: (m: any) => m.caption || m.alt || m.src, make: () => ({ type: 'image', src: '', alt: '', caption: '' }), addLabel: 'Add item', fields: mediaItem() },
    ],
  },
  {
    kind: 'group', label: 'Platforms, services and tools', open: false, fields: [
      { kind: 'multi', key: 'platforms', label: 'Platforms', options: PLATFORMS, custom: true },
      { kind: 'strings', key: 'contentTypes', label: 'Content types (for example Reels, Carousels, Stories)' },
      { kind: 'refs', key: 'serviceIds', label: 'Services delivered', from: 'services' },
      { kind: 'refs', key: 'toolIds', label: 'Tools used', from: 'tools', help: 'Only tools you have confirmed are shown publicly.' },
      { kind: 'refs', key: 'aiSkillIds', label: 'AI skills used', from: 'aiSkills' },
    ],
  },
  {
    kind: 'group', label: 'Evidence from elsewhere in the portfolio', open: false, fields: [
      { kind: 'refs', key: 'resultIds', label: 'Results', from: 'results' },
      { kind: 'refs', key: 'contentIds', label: 'Reels and content', from: 'contentItems' },
      { kind: 'refs', key: 'screenshotIds', label: 'Screenshots', from: 'screenshots' },
      { kind: 'refs', key: 'relatedIds', label: 'Related projects', from: 'projects', help: 'Related work is also suggested automatically.' },
    ],
  },
  {
    kind: 'group', label: 'Search and sharing (optional)', open: false,
    help: 'What appears when this project is shared as /work/<id>. Blank uses the title, description and cover image.',
    fields: [{ kind: 'group', key: 'seo', label: 'Share preview', open: true, fields: [{ kind: 'text', key: 'title', label: 'Title' }, { kind: 'textarea', key: 'description', label: 'Description' }, { kind: 'text', key: 'image', label: 'Image address (blank uses the cover)' }] }],
  },
  {
    kind: 'group', label: 'Content blocks (build the story in any order)', open: false,
    help: 'Add headings, text, images, galleries, videos, reels, screenshots, links, quotes, metrics, charts, before and after, documents and more. Every block is optional.',
    fields: [{ kind: 'blocks', key: 'blocks', label: 'Blocks' }],
  },
  {
    kind: 'group', label: 'Case study', open: true, showIf: (p: any) => !!p.caseStudy,
    help: 'The structured story. Sections you leave empty are not shown. Never enter results you cannot verify.',
    fields: [
      { kind: 'group', label: 'Overview and challenge', key: 'caseStudy', fields: [
        { kind: 'textarea', key: 'objective', label: 'Project objective' }, { kind: 'rich', key: 'challenge', label: 'The challenge' },
        { kind: 'strings', key: 'objectives', label: 'Marketing objectives' }, { kind: 'rich', key: 'audience', label: 'Target audience' },
      ] },
      { kind: 'group', label: 'Strategy', key: 'caseStudy', open: false, fields: [
        { kind: 'rich', key: 'strategy', label: 'Strategy' },
        { kind: 'list', key: 'framework', label: 'Strategy framework (optional columns)', item: (c: any) => c.title, make: () => ({ title: '', items: [] }), addLabel: 'Add column', fields: [{ kind: 'text', key: 'title', label: 'Column title' }, { kind: 'strings', key: 'items', label: 'Points' }] },
      ] },
      { kind: 'group', label: 'Execution, creative and distribution', key: 'caseStudy', open: false, fields: [
        { kind: 'strings', key: 'execution', label: 'What was done (steps)' }, { kind: 'strings', key: 'deliverables', label: 'Deliverables' },
        { kind: 'list', key: 'creative', label: 'Creative (images and videos)', item: (m: any) => m.caption || m.alt || m.src, make: () => ({ type: 'image', src: '', alt: '', caption: '' }), addLabel: 'Add creative', fields: mediaItem() },
        { kind: 'multi', key: 'distribution', label: 'Distribution channels', options: PLATFORMS, custom: true },
        { kind: 'rich', key: 'paidMedia', label: 'Paid media (optional)' },
      ] },
      { kind: 'group', label: 'Results', key: 'caseStudy', open: false, fields: [
        { kind: 'list', key: 'metrics', label: 'Measured results', item: (m: any) => m.label, make: () => ({ label: '', baseline: undefined, result: 0, unit: '', prefix: '', period: '', note: '' }), addLabel: 'Add result', fields: [
          { kind: 'text', key: 'label', label: 'What was measured' }, { kind: 'number', key: 'baseline', label: 'Starting value (baseline)' }, { kind: 'number', key: 'result', label: 'Final value', nullable: false },
          { kind: 'text', key: 'prefix', label: 'Prefix (for example £)' }, { kind: 'text', key: 'unit', label: 'Unit (for example %)' },
          { kind: 'text', key: 'period', label: 'Measurement period (required)' }, { kind: 'text', key: 'note', label: 'Note' },
        ] },
        { kind: 'textarea', key: 'confidentialResults', label: 'Approved wording if numbers are confidential' },
        { kind: 'group', label: 'Before and after (optional)', key: 'beforeAfter', open: false, fields: [{ kind: 'image', key: 'before', label: 'Before' }, { kind: 'image', key: 'after', label: 'After' }, { kind: 'text', key: 'caption', label: 'Caption' }] },
      ] },
      { kind: 'group', label: 'Highlight strip', key: 'caseStudy', open: false, fields: [
        { kind: 'group', key: 'highlight', label: 'Headline result shown on the case study card', open: true, fields: [
          { kind: 'select', key: 'metricIndex', label: 'Which measured result to feature', options: [{ value: '', label: 'None' }, ...[0, 1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Result number ${n + 1} in the list above` }))], help: 'Only a result you have entered above can be featured.' },
          { kind: 'text', key: 'headline', label: 'Headline (blank uses the result name)' },
        ] },
      ] },
      { kind: 'group', label: 'My contribution and lessons', key: 'caseStudy', open: false, fields: [
        { kind: 'strings', key: 'contribution.personal', label: 'What I delivered personally' }, { kind: 'strings', key: 'contribution.team', label: 'What the wider team delivered' },
        { kind: 'strings', key: 'lessons', label: 'Lessons and insights' },
      ] },
    ],
  },
]

export const ENTITIES: Record<string, EntityDef> = {
  projects: {
    id: 'projects', title: 'Portfolio', singular: 'project', collection: 'projects', make: newProject, caseStudy: true, featured: true,
    intro: 'Every project, from a single image with a link to a full case study. Use Show to look at case studies or campaigns only: they are the same records. Drafts stay private until you publish them.',
    titleOf: (p) => p.title || 'Untitled project', subtitleOf: (p) => [p.client, p.category, p.year].filter(Boolean).join(' · '), thumbOf: (p) => p.thumbnail?.src,
    views: [
      { value: 'all', label: 'All projects', test: () => true },
      { value: 'caseStudies', label: 'Case studies', test: (p: any) => !!p.caseStudy },
      { value: 'campaigns', label: 'Campaigns', test: (p: any) => /campaign|advertis/i.test(p.category) },
    ],
    makers: [
      { label: 'case study', make: () => ({ ...newProject(), caseStudy: newCaseStudy() }) },
      { label: 'campaign', make: () => ({ ...newProject(), category: 'Digital Marketing Campaign' }) },
    ],
    ...hiddenToggle, fields: PROJECT_FIELDS,
  },
  services: {
    id: 'services', title: 'Services', singular: 'service', collection: 'services', make: newService,
    intro: 'The marketing services you offer. Switch on only the ones that match your real experience. Show/hide controls what visitors see.',
    titleOf: (s) => s.name || 'Untitled service', subtitleOf: (s) => s.category ?? '', ...hiddenToggle, shownLabels: ['Shown', 'Hidden'],
    fields: [
      { kind: 'text', key: 'name', label: 'Service name' },
      { kind: 'select', key: 'category', label: 'Category', options: SERVICE_CATEGORIES, custom: true },
      { kind: 'textarea', key: 'description', label: 'Short description' }, { kind: 'rich', key: 'detail', label: 'Detailed explanation' },
      { kind: 'select', key: 'object', label: 'Illustration', options: SERVICE_OBJECTS, help: 'A drawing of what the service is. Its colours follow the season. To use an icon instead, pick one below and leave this on Automatic.' },
      { kind: 'icon', key: 'icon', label: 'Icon (used when there is no illustration)', showIf: (s: any) => !s.object },
      { kind: 'tone', key: 'color', label: 'Colour' }, { kind: 'image', key: 'image', label: 'Supporting image' },
      { kind: 'multi', key: 'platforms', label: 'Relevant platforms', options: PLATFORMS, custom: true },
      { kind: 'refs', key: 'projectIds', label: 'Associated projects', from: 'projects' },
    ],
  },
  tools: {
    id: 'tools', title: 'Tools & Platforms', singular: 'tool', collection: 'tools', make: newTool,
    intro: 'Software you genuinely use. A tool only appears publicly when you tick "I use this tool" and describe how.',
    titleOf: (t) => t.name || 'Untitled tool', subtitleOf: (t) => [[t.category, ...(t.categories ?? [])].filter((c, i, a) => c && a.indexOf(c) === i).join(', '), t.usage && !/^\[/.test(t.usage) ? t.usage : ''].filter(Boolean).join(' · '),
    thumbOf: (t) => brandDataUri(brandFor(t)), shown: (t) => !!t.confirmed, setShown: (t, v) => { t.confirmed = v }, shownLabels: ['In use', 'Not shown'],
    fields: [
      { kind: 'text', key: 'name', label: 'Tool name' }, { kind: 'select', key: 'category', label: 'Main category', options: TOOL_CATEGORIES }, { kind: 'multi', key: 'categories', label: 'Also shown under (optional)', options: TOOL_CATEGORIES, help: 'A tool can belong to more than one category. It shows under its main category and under each one you tick here.' },
      { kind: 'bool', key: 'confirmed', label: 'I use this tool', help: 'Switch this on to show the tool on your site.' }, { kind: 'textarea', key: 'usage', label: 'How I use it (optional)', help: 'Be specific. It is shown on the tool card for everyone to read. Leave it empty to show just the logo and name.' },
      { kind: 'url', key: 'link', label: 'Link to the tool (optional)' },
      { kind: 'group', label: 'Logo', open: true, help: 'Most well known tools get their logo automatically from the name. Pick one below, upload the official logo, or paste a link to one.', fields: [
        { kind: 'select', key: 'logoSlug', label: 'Built-in logo', options: [{ value: '', label: 'Automatic (match the name)' }, ...BRAND_CHOICES] },
        { kind: 'file', key: 'logo', label: 'Upload your own logo', accept: 'image' },
        { kind: 'url', key: 'logoUrl', label: 'Or a link to a logo image (https)' },
        { kind: 'tone', key: 'color', label: 'Logo colour', help: 'Choose "Custom colour" to set a brand colour. Empty uses the brand colour.' },
      ] },
    ],
  },
  testimonials: {
    id: 'testimonials', title: 'Testimonials', singular: 'testimonial', collection: 'testimonials', make: newTestimonial,
    intro: 'Real recommendations only. A testimonial is never shown until you tick "I have permission to publish this".',
    titleOf: (t) => t.name || 'Untitled testimonial', subtitleOf: (t) => [t.title, t.company].filter(Boolean).join(', '), thumbOf: (t) => t.photo?.src,
    shown: (t) => !!t.approved, setShown: (t, v) => { t.approved = v }, shownLabels: ['Approved', 'Not approved'],
    fields: [
      { kind: 'text', key: 'name', label: 'Name' }, { kind: 'text', key: 'title', label: 'Job title' }, { kind: 'text', key: 'company', label: 'Company' },
      { kind: 'textarea', key: 'quote', label: 'Testimonial', rows: 5 }, { kind: 'text', key: 'relationship', label: 'How you worked together' },
      { kind: 'image', key: 'photo', label: 'Photo (optional)' }, { kind: 'file', key: 'video', label: 'Video recommendation (optional)', accept: 'video', help: 'Plays only when the visitor presses play. You can also paste a YouTube or Vimeo link in the page by using a link instead of a file.' }, { kind: 'number', key: 'order', label: 'Display order', nullable: true },
      { kind: 'tone', key: 'accent', label: 'Accent colour' },
      { kind: 'bool', key: 'approved', label: 'I have permission to publish this' },
    ],
  },
  posts: {
    id: 'posts', title: 'Social Media Content', singular: 'post', collection: 'contentItems', make: () => newContentItem('post'),
    intro: 'Posts, carousels, stories, reels and videos in one list. Choose each item\'s type inside it. For a video, upload a file or paste a YouTube or Vimeo link; nothing autoplays and nothing loads until a visitor presses play.',
    titleOf: (c) => c.title || 'Untitled', subtitleOf: (c) => [c.kind === 'video' ? 'Video' : 'Post', c.format, c.platform, c.duration].filter(Boolean).join(' · '), thumbOf: (c) => c.thumbnail?.src,
    views: [
      { value: 'all', label: 'Everything', test: () => true },
      { value: 'posts', label: 'Posts and carousels', test: (c: any) => c.kind !== 'video' },
      { value: 'videos', label: 'Videos and reels', test: (c: any) => c.kind === 'video' },
    ],
    makers: [{ label: 'video or reel', make: () => newContentItem('video') }],
    ...hiddenToggle, fields: [], // filled below
  },
  websites: {
    id: 'websites', title: 'Websites & Digital Projects', singular: 'website', collection: 'websites', make: newWebsite,
    intro: 'Websites you built or managed, shown on a laptop. Screenshots are used because many sites cannot be embedded.',
    titleOf: (w) => w.name || 'Untitled website', subtitleOf: (w) => w.url, thumbOf: (w) => w.screenshots?.[0]?.src, ...hiddenToggle,
    fields: [
      { kind: 'text', key: 'name', label: 'Project name' }, { kind: 'text', key: 'url', label: 'Website address (as shown in the browser bar)' },
      { kind: 'textarea', key: 'description', label: 'Description' }, { kind: 'strings', key: 'responsibilities', label: 'My responsibilities' },
      { kind: 'text', key: 'platform', label: 'Built on (platform or CMS)' }, { kind: 'images', key: 'screenshots', label: 'Screenshots (tall full page captures scroll nicely)' },
      { kind: 'url', key: 'externalLink', label: 'Live link' },
    ],
  },
  skills: {
    id: 'skills', title: 'Skills', singular: 'skill group', collection: 'skills', make: newSkillGroup,
    intro: 'Skills grouped by area. Each skill stays hidden until you switch it on. Levels are words, never percentage bars.',
    titleOf: (g) => g.name || 'Untitled group', subtitleOf: (g) => `${g.skills.filter((s: any) => s.visible).length} of ${g.skills.length} shown`, ...hiddenToggle, shownLabels: ['Shown', 'Hidden'],
    fields: [
      { kind: 'text', key: 'name', label: 'Group name' },
      { kind: 'list', key: 'skills', label: 'Skills', item: (s: any) => `${s.name || 'Skill'}${s.visible ? '' : ' (hidden)'}`, make: () => ({ name: '', level: '', note: '', visible: true }), addLabel: 'Add skill', fields: [
        { kind: 'text', key: 'name', label: 'Skill' }, { kind: 'select', key: 'level', label: 'Level', options: LEVELS }, { kind: 'text', key: 'note', label: 'Evidence or note (optional)' }, { kind: 'bool', key: 'visible', label: 'Show this skill on the site' },
      ] },
    ],
  },
  platforms: {
    id: 'platforms', title: 'Platform Expertise', singular: 'platform', collection: 'platforms', make: newPlatform,
    intro: 'Describe real experience on each platform in words. No percentage bars.',
    titleOf: (p) => platformAsTool(p).name, subtitleOf: (p) => p.level || 'No level set', thumbOf: (p) => brandDataUri(brandFor(platformAsTool(p))), ...hiddenToggle, shownLabels: ['Shown', 'Hidden'],
    fields: [
      { kind: 'select', key: 'platform', label: 'Platform', options: PLATFORMS, custom: true }, { kind: 'select', key: 'level', label: 'Experience level', options: LEVELS },
      { kind: 'strings', key: 'services', label: 'Services performed' }, { kind: 'strings', key: 'contentTypes', label: 'Content types' }, { kind: 'strings', key: 'campaigns', label: 'Campaigns' },
      { kind: 'textarea', key: 'analytics', label: 'Analytics experience' }, { kind: 'textarea', key: 'advertising', label: 'Advertising experience' },
      { kind: 'url', key: 'profileUrl', label: 'Profile link' }, { kind: 'refs', key: 'projectIds', label: 'Portfolio projects', from: 'projects' },
      { kind: 'group', label: 'Logo', open: false, help: 'The platform logo shows automatically. Upload your own or change its colour here.', fields: [{ kind: 'file', key: 'logo', label: 'Your own logo', accept: 'image' }, { kind: 'tone', key: 'color', label: 'Logo colour', help: 'Choose "Custom colour" to set a hex colour.' }] },
    ],
  },
  ai: {
    id: 'ai', title: 'AI & Automation', singular: 'AI skill', collection: 'aiSkills', make: newAiSkill,
    intro: 'Only AI tools and workflows you have really used. Nothing is claimed for you.',
    titleOf: (a) => a.name || 'Untitled AI skill', subtitleOf: (a) => [a.category, a.tool].filter(Boolean).join(' · '), ...hiddenToggle, shownLabels: ['Shown', 'Hidden'],
    fields: [
      { kind: 'text', key: 'name', label: 'Skill name' }, { kind: 'select', key: 'category', label: 'Category', options: AI_CATEGORIES, custom: true },
      { kind: 'textarea', key: 'description', label: 'What it is and how you used it' }, { kind: 'text', key: 'tool', label: 'Tool used (for example ChatGPT, Claude, Midjourney, Runway)' },
      { kind: 'select', key: 'level', label: 'Experience level', options: LEVELS }, { kind: 'textarea', key: 'outcome', label: 'Outcome' },
      { kind: 'ref', key: 'projectId', label: 'Example project', from: 'projects' }, { kind: 'image', key: 'screenshot', label: 'Screenshot' },
      { kind: 'file', key: 'video', label: 'Video (upload or link)', accept: 'video' }, { kind: 'url', key: 'link', label: 'External link' },
    ],
  },
  results: {
    id: 'results', title: 'Analytics & Results', singular: 'result', collection: 'results', make: newResult,
    intro: 'Real numbers with a start, an end and a period. Percentages are only shown if you enter them or if both values exist. Label who produced each result.',
    titleOf: (r) => r.metric || 'Untitled result', subtitleOf: (r) => [r.platform, r.period, r.classification].filter(Boolean).join(' · '), thumbOf: (r) => r.screenshot?.src, ...hiddenToggle,
    fields: [
      { kind: 'text', key: 'metric', label: 'Metric (for example Engagement rate, Follower growth, ROAS)' }, { kind: 'tone', key: 'accent', label: 'Card accent colour' },
      { kind: 'select', key: 'classification', label: 'Result type', options: RESULT_CLASSES, help: 'This label is shown on the card so visitors know how much weight to give it.' },
      { kind: 'select', key: 'contribution', label: 'Who produced it', options: [{ value: 'individual', label: 'Me (individual contribution)' }, { value: 'shared', label: 'Shared with the team' }, { value: 'team', label: 'The team' }] },
      { kind: 'number', key: 'start', label: 'Starting value' }, { kind: 'number', key: 'end', label: 'Ending value' },
      { kind: 'text', key: 'prefix', label: 'Prefix (£, $)' }, { kind: 'text', key: 'unit', label: 'Unit (%, k, views)' },
      { kind: 'number', key: 'pctChange', label: 'Percentage change (optional)', help: 'Leave blank to calculate it from the starting and ending values. Nothing is shown if neither exists.' },
      { kind: 'text', key: 'period', label: 'Measurement period (required)' },
      { kind: 'select', key: 'platform', label: 'Platform', options: ['', ...PLATFORMS.map((p) => (typeof p === 'string' ? p : p.value))], custom: true },
      { kind: 'text', key: 'campaign', label: 'Campaign' }, { kind: 'ref', key: 'projectId', label: 'Project', from: 'projects' },
      { kind: 'select', key: 'chart', label: 'Chart', options: [{ value: 'bar', label: 'Baseline against result' }, { value: 'line', label: 'Line over time' }, { value: 'stat', label: 'Big number' }] },
      { kind: 'list', key: 'series', label: 'Data points over time', showIf: (r: any) => r.chart === 'line', item: (p: any) => `${p.label} ${p.value ?? ''}`, make: () => ({ label: '', value: 0 }), addLabel: 'Add point', fields: [{ kind: 'text', key: 'label', label: 'Label (for example Jan)' }, { kind: 'number', key: 'value', label: 'Value', nullable: false }] },
      { kind: 'textarea', key: 'context', label: 'Context' }, { kind: 'textarea', key: 'notes', label: 'Notes' }, { kind: 'image', key: 'screenshot', label: 'Screenshot of the analytics' },
      { kind: 'textarea', key: 'anonymised', label: 'Approved wording if the numbers are confidential', showIf: (r: any) => r.classification === 'confidential' },
      { kind: 'bool', key: 'showValues', label: 'Show the numbers', showIf: (r: any) => r.classification === 'confidential' },
    ],
  },
  screenshots: {
    id: 'screenshots', title: 'Screenshots', singular: 'screenshot', collection: 'screenshots', make: newScreenshot,
    intro: 'Profiles, ad dashboards, analytics, calendars and designs. Use Hide parts in the Media library to cover client names or numbers before you add them.',
    titleOf: (s) => s.caption || s.image?.alt || 'Screenshot', subtitleOf: (s) => s.category ?? '', thumbOf: (s) => s.image?.src, ...hiddenToggle,
    fields: [
      { kind: 'image', key: 'image', label: 'Screenshot' }, { kind: 'text', key: 'caption', label: 'Caption' },
      { kind: 'select', key: 'category', label: 'Category', options: ['', 'Instagram profile', 'Facebook page', 'TikTok account', 'LinkedIn campaign', 'Meta Ads Manager', 'Google Analytics', 'Social analytics', 'Canva design', 'Content calendar', 'Dashboard', 'Campaign results', 'Website'], custom: true },
      { kind: 'ref', key: 'projectId', label: 'Project', from: 'projects' }, { kind: 'image', key: 'compareWith', label: 'Second image (turns this into a before and after slider)' },
    ],
  },
  process: {
    id: 'process', title: 'Marketing Process', singular: 'step', collection: 'process', make: newProcessStep,
    intro: 'Your workflow from research to optimisation. Reinforces that you think strategically, not just post.',
    titleOf: (s) => s.title || 'Untitled step', subtitleOf: (s) => s.description, ...hiddenToggle, shownLabels: ['Shown', 'Hidden'],
    fields: [{ kind: 'text', key: 'title', label: 'Step' }, { kind: 'textarea', key: 'description', label: 'Description' }, { kind: 'icon', key: 'icon', label: 'Icon' }, { kind: 'tone', key: 'color', label: 'Colour' }, { kind: 'image', key: 'image', label: 'Image (optional)' }],
  },
}

const contentFields = (): Field[] => [
  { kind: 'select', key: 'kind', label: 'Type', options: [{ value: 'post', label: 'Post, carousel or story' }, { value: 'video', label: 'Video or reel' }], help: 'A video shows a play button and uses the video fields below.' },
  { kind: 'text', key: 'title', label: 'Title' }, { kind: 'select', key: 'format', label: 'Content type', options: FORMATS, custom: true },
  { kind: 'select', key: 'platform', label: 'Platform', options: PLATFORMS, custom: true }, { kind: 'textarea', key: 'explanation', label: 'Short explanation' },
  { kind: 'image', key: 'thumbnail', label: 'Thumbnail or poster image' },
  { kind: 'file', key: 'video', label: 'Video', accept: 'video', help: 'Upload an MP4 or WebM, or paste a YouTube, Vimeo or other link.', showIf: (c: any) => c.kind === 'video' },
  { kind: 'text', key: 'duration', label: 'Duration (for example 0:24)', showIf: (c: any) => c.kind === 'video' },
  { kind: 'text', key: 'date', label: 'Date' }, { kind: 'text', key: 'campaign', label: 'Campaign' }, { kind: 'text', key: 'role', label: 'My role' },
  { kind: 'text', key: 'result', label: 'Result (only if verified)' }, { kind: 'url', key: 'link', label: 'Original post or video link' },
]
ENTITIES.posts.fields = contentFields()

/* ---------- single page forms ---------- */

export interface PageForm { title: string; intro?: string; blocks: { title?: string; base: string; fields: Field[] }[] }
const SECTION_TARGETS = (c: SiteContent): Opt[] => c.portfolio.sections.map((s) => ({ value: s.id, label: s.heading || s.navLabel || s.id }))
const LOCALES: Opt[] = [{ value: 'en-GB', label: 'English (UK)' }, { value: 'en-CA', label: 'English (Canada)' }, { value: 'en-US', label: 'English (US)' }, { value: 'en-AU', label: 'English (Australia)' }]
const CURRENCIES: Opt[] = [{ value: 'GBP', label: 'GBP (£)' }, { value: 'CAD', label: 'CAD ($)' }, { value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'AUD', label: 'AUD ($)' }]

export const PAGES: Record<string, PageForm> = {
  profile: {
    title: 'Personal Profile', intro: 'Your identity. Everything here updates the public site everywhere it appears. Your email, phone and WhatsApp number are on the Contact page, and your social links are on Social Links.',
    blocks: [
      { base: 'portfolio.profile', fields: [
        { kind: 'text', key: 'fullName', label: 'Full name' }, { kind: 'text', key: 'preferredName', label: 'Professional name' },
        { kind: 'text', key: 'title', label: 'Professional title' }, { kind: 'strings', key: 'roles', label: 'Roles (three to five, shown in the hero)' },
        { kind: 'text', key: 'tagline', label: 'Tagline' }, { kind: 'textarea', key: 'intro', label: 'Professional summary (one or two sentences)' },
        { kind: 'text', key: 'location', label: 'Location' },
        { kind: 'text', key: 'signature', label: 'Handwritten signature text (defaults to your professional name)' },
        { kind: 'image', video: true, key: 'profilePhoto', label: 'Profile photo' },
        { kind: 'number', key: 'yearsExperience', label: 'Years of experience', min: 0 },
        { kind: 'text', key: 'availability', label: 'Availability message' }, { kind: 'text', key: 'employmentType', label: 'Employment preference' },
        { kind: 'strings', key: 'targetJobs', label: 'Roles you are looking for' },
      ] },
      { title: 'Language and currency', base: 'portfolio.site', fields: [{ kind: 'select', key: 'locale', label: 'Spelling and number format', options: LOCALES }, { kind: 'select', key: 'currency', label: 'Currency for budget ranges', options: CURRENCIES }] },
    ],
  },
  about: {
    title: 'About & Recruiter Overview', intro: 'Your biography, highlights, statistics and the quick-scan overview for recruiters. Leave anything blank to hide it.',
    blocks: [
      { title: 'Biography', base: 'portfolio.profile', fields: [{ kind: 'strings', key: 'bio', label: 'Biography paragraphs', multiline: true }, { kind: 'strings', key: 'highlights', label: 'Experience highlights' }] },
      { title: 'Statistics (leave empty to hide)', base: 'portfolio', fields: [{ kind: 'list', key: 'stats', label: 'Statistics', item: (s: any) => `${s.label}${s.value ? `: ${s.value}` : ' (hidden)'}`, make: () => ({ key: `stat-${Date.now().toString(36)}`, label: '', value: null }), addLabel: 'Add statistic', fields: [{ kind: 'text', key: 'label', label: 'Label' }, { kind: 'number', key: 'value', label: 'Value (empty or 0 hides it)' }, { kind: 'text', key: 'prefix', label: 'Prefix' }, { kind: 'text', key: 'suffix', label: 'Suffix (+, %)' }, { kind: 'text', key: 'note', label: 'Note (period and platform)' }] }] },
      { title: 'Recruiter overview', base: 'portfolio.recruiter', fields: [
        { kind: 'strings', key: 'competencies', label: 'Core competencies' }, { kind: 'strings', key: 'platforms', label: 'Marketing platforms' }, { kind: 'strings', key: 'industries', label: 'Industry experience' },
        { kind: 'strings', key: 'achievements', label: 'Selected achievements (verified only)' },
        { kind: 'list', key: 'education', label: 'Education', item: (e: any) => e.title, make: () => ({ title: '', place: '', year: '' }), fields: [{ kind: 'text', key: 'title', label: 'Qualification' }, { kind: 'text', key: 'place', label: 'Institution' }, { kind: 'text', key: 'year', label: 'Year' }] },
        { kind: 'list', key: 'certifications', label: 'Certifications', item: (e: any) => e.title, make: () => ({ title: '', issuer: '', year: '' }), fields: [{ kind: 'text', key: 'title', label: 'Certification' }, { kind: 'text', key: 'issuer', label: 'Issuer' }, { kind: 'text', key: 'year', label: 'Year' }] },
        { kind: 'list', key: 'employment', label: 'Employment history', item: (e: any) => `${e.role} ${e.employer}`, make: () => ({ role: '', employer: '', period: '', summary: '' }), fields: [{ kind: 'text', key: 'role', label: 'Role' }, { kind: 'text', key: 'employer', label: 'Employer' }, { kind: 'text', key: 'period', label: 'Period' }, { kind: 'textarea', key: 'summary', label: 'Summary' }] },
      ] },
    ],
  },
  hero: {
    title: 'Hero', intro: 'The first screen. Leave text blank to use your profile details. Different hero images per season are set on the Seasons page.',
    blocks: [
      { title: 'Text and layout', base: 'portfolio.hero', fields: [
        { kind: 'text', key: 'label', label: 'Small label above the headline' },
        { kind: 'textarea', key: 'headline', label: 'Headline (one line per heading; blank uses your roles)' }, { kind: 'text', key: 'supporting', label: 'Supporting headline' },
        { kind: 'textarea', key: 'intro', label: 'Introduction line (blank uses your summary)' },
        { kind: 'select', key: 'layout', label: 'Layout', options: [{ value: 'stamp-right', label: 'Stamp on the right' }, { value: 'stamp-left', label: 'Stamp on the left' }, { value: 'centered', label: 'Centred' }] },
        { kind: 'select', key: 'alignment', label: 'Text alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }] },
        { kind: 'bool', key: 'breakout', label: 'Scroll breakout effect', help: 'Turn off for a compact, static hero.' },
        { kind: 'select', key: 'animation', label: 'Hero animation intensity', options: [{ value: 'inherit', label: 'Follow the season' }, { value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' }, { value: 'standard', label: 'Standard' }, { value: 'expressive', label: 'Expressive' }] },
        { kind: 'bool', key: 'decorativeElements', label: 'Show decorative flowers and glow' },
        { kind: 'select', key: 'background', label: 'Background', options: [{ value: 'season', label: 'Seasonal artwork' }, { value: 'plain', label: 'Plain' }] },
        { kind: 'list', key: 'ctas', label: 'Buttons (up to three; links to hidden sections are skipped)', item: (c: any) => c.label, make: () => ({ label: '', target: 'contact' }), addLabel: 'Add button', fields: [{ kind: 'text', key: 'label', label: 'Button text' }, { kind: 'select', key: 'target', label: 'Goes to', options: SECTION_TARGETS }] },
      ] },
      { title: 'Hero images', base: 'portfolio.profile', fields: [
        { kind: 'image', video: true, key: 'heroCutout', label: 'Portrait cut-out (transparent PNG or WebP of you)', help: 'Your real photograph is used as supplied.' },
        { kind: 'image', video: true, key: 'heroFlowers', label: 'Decorative image (optional, transparent)', help: 'Leave empty to use the built-in artwork for each season.' },
      ] },
      { title: 'Stamp', base: 'portfolio.theme', fields: [{ kind: 'text', key: 'stampNumeral', label: 'Stamp number (shown in red)', maxLength: 4 }] },
    ],
  },
  cursor: {
    title: 'Cursor effect', intro: 'The shape or trail that follows the mouse on desktop. Move your pointer anywhere on this page to try your changes live. Phones and tablets never show it, and visitors who ask for reduced motion never see it.',
    blocks: [
      { title: 'Style', base: 'portfolio.cursor', fields: [
        { kind: 'bool', key: 'enabled', label: 'Show a cursor effect' },
        { kind: 'select', key: 'style', label: 'Style', options: CURSOR_STYLES.map((o) => ({ value: o.value, label: `${o.label}: ${o.help}` })) },
        { kind: 'text', key: 'emoji', label: 'Emoji or symbol', help: 'Used by the Emoji style. One to four characters.', maxLength: 4, showIf: (c) => c.style === 'emoji' },
        { kind: 'image', key: 'image', label: 'Image', help: 'Used by the Image style. A small transparent PNG or WebP works best.', showIf: (c) => c.style === 'image' },
      ] },
      { title: 'Size, colour and feel', base: 'portfolio.cursor', fields: [
        { kind: 'range', key: 'size', label: 'Size', min: 8, max: 220, step: 2, unit: 'px', help: 'Diameter of the main shape. For trails it scales the particles.' },
        { kind: 'tone', key: 'color', label: 'Colour', help: 'Season default follows the active season.' },
        { kind: 'range', key: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05 },
        { kind: 'range', key: 'smoothing', label: 'Smoothing', min: 0, max: 0.95, step: 0.05, help: '0 sticks to the pointer. Higher values glide behind it.' },
        { kind: 'range', key: 'trail', label: 'Trail length and density', min: 0, max: 40, step: 1 },
        { kind: 'select', key: 'blend', label: 'Blend with the page', options: [{ value: 'normal', label: 'Normal' }, { value: 'multiply', label: 'Multiply (darkens)' }, { value: 'screen', label: 'Screen (lightens)' }, { value: 'difference', label: 'Difference (inverts)' }] },
      ] },
      { title: 'Where and when', base: 'portfolio.cursor', fields: [
        { kind: 'select', key: 'scope', label: 'Where it appears', options: [{ value: 'page', label: 'The whole page' }, { value: 'hero', label: 'The hero only' }] },
        { kind: 'select', key: 'showIn', label: 'Professional intensity', options: [{ value: 'creative', label: 'Creative mode only' }, { value: 'balanced', label: 'Creative and Balanced' }, { value: 'professional', label: 'Every mode' }], help: 'Professional mode is calm by default, so the effect stays off there unless you choose otherwise.' },
        { kind: 'bool', key: 'growOnLinks', label: 'Grow over links and buttons' },
        { kind: 'bool', key: 'hideNativeCursor', label: 'Hide the normal arrow (shape styles only)', help: 'The arrow stays visible over text fields. Leave this off if unsure.' },
        { kind: 'bool', key: 'touchRipple', label: 'Show a small ripple when touch screens are tapped' },
      ] },
      { title: 'Hero reveal circle (Night Tide)', base: 'portfolio.hero', fields: [
        { kind: 'bool', key: 'tideEnabled', label: 'Allow the reveal circle in the hero', help: 'The circle that follows the pointer or finger over the hero and reveals the night scene.' },
        { kind: 'range', key: 'tideSize', label: 'Reveal circle radius', min: 60, max: 420, step: 10, unit: 'px', help: 'Touch screens use about two thirds of this.' },
      ] },
    ],
  },
  appearance: {
    title: 'Appearance', intro: 'Global look and feel. Seasonal colours, decorations and images are on the Seasons page.',
    blocks: [{ base: 'portfolio.theme', fields: [
      { kind: 'select', key: 'professional', label: 'Professional intensity', options: [{ value: 'creative', label: 'Creative: full decoration and motion' }, { value: 'balanced', label: 'Balanced: personality with restraint (recommended)' }, { value: 'professional', label: 'Professional: calm, editorial, minimal motion' }], help: 'Use Professional for corporate applications. It switches off playful extras and uses plain section titles.' },
      { kind: 'select', key: 'animationIntensity', label: 'Maximum animation', options: [{ value: 'full', label: 'Full' }, { value: 'subtle', label: 'Subtle' }, { value: 'off', label: 'Off' }], help: 'A ceiling over everything else. Visitors who ask their device for reduced motion always get a calm site.' },
      { kind: 'group', label: 'Fonts', open: false, fields: [
        { kind: 'select', key: 'fonts.display', label: 'Headings', options: fontOptions(HEADING_FONTS) }, { kind: 'select', key: 'fonts.script', label: 'Signature script (your name at the top left, the footer and the menu)', options: fontOptions(SCRIPT_FONTS) }, { kind: 'select', key: 'fonts.body', label: 'Body text', options: fontOptions(BODY_FONTS) },
      ] },
    ] }],
  },
  cv: {
    title: 'Resume / CV', intro: 'Upload your CV once and every Download CV button uses it. The button only appears when a file is set and enabled.',
    blocks: [
      { base: 'portfolio.profile', fields: [{ kind: 'file', key: 'cvFile', label: 'CV file (PDF)', accept: 'pdf' }] },
      { base: 'portfolio.cv', fields: [{ kind: 'bool', key: 'enabled', label: 'Show the Download CV buttons' }, { kind: 'text', key: 'title', label: 'CV title' }, { kind: 'text', key: 'version', label: 'Version (for your own reference)' }, { kind: 'text', key: 'filename', label: 'Download file name (for example Jane-Doe-CV.pdf)' }] },
    ],
  },
  social: {
    title: 'Social Links', intro: 'Links appear in the footer and contact section. Empty ones are hidden.',
    blocks: [{ base: 'portfolio.profile.social', fields: ['linkedin', 'instagram', 'tiktok', 'facebook', 'youtube', 'pinterest', 'website'].map((k) => ({ kind: 'url' as const, key: k, label: k[0].toUpperCase() + k.slice(1), placeholder: 'https://' })) }],
  },
  contact: {
    title: 'Contact', intro: 'How visitors reach you, and what you are open to. Choose below whether the form sends to your inbox on this server or drafts an email or WhatsApp message.',
    blocks: [
      { title: 'Contact details', base: 'portfolio.profile', fields: [{ kind: 'email', key: 'email', label: 'Email' }, { kind: 'tel', key: 'whatsapp', label: 'WhatsApp number (international format)' }, { kind: 'tel', key: 'phone', label: 'Phone' }] },
      { title: 'Recruitment and availability', base: 'portfolio.contact', fields: [
        { kind: 'multi', key: 'availableFor', label: 'Available for', options: ['Full-time roles', 'Part-time roles', 'Contract roles', 'Freelance projects', 'Consulting'], custom: true },
        { kind: 'multi', key: 'workModes', label: 'Working style', options: ['Remote', 'Hybrid', 'On-site'] },
        { kind: 'strings', key: 'enquiryTypes', label: 'Enquiry types in the form' },
        { kind: 'select', key: 'recruiterType', label: 'Which type reveals the recruiter questions (company and role)', options: (c: SiteContent) => c.portfolio.contact.enquiryTypes },
        { kind: 'textarea', key: 'whatsappGreeting', label: 'Opening line for the WhatsApp button' },
        { kind: 'select', key: 'delivery', label: 'How the contact form works', options: [{ value: 'client', label: 'Open the visitor email app or WhatsApp (nothing stored here)' }, { value: 'both', label: 'Send to my inbox here, or open email or WhatsApp' }, { value: 'server', label: 'Send to my inbox here (falls back to email if sending fails)' }], help: 'Messages sent here appear under Inbox. Email alerts need SMTP settings on the server.' },
        { kind: 'text', key: 'successMessage', label: 'Message shown after sending' },
        { kind: 'bool', key: 'showBudget', label: 'Show the budget question for client enquiries' },
        { kind: 'list', key: 'budgetRanges', label: 'Budget ranges', item: (b: any) => `${b.min} to ${b.max ?? 'and above'}`, make: () => ({ min: 0, max: null }), fields: [{ kind: 'number', key: 'min', label: 'From', nullable: false }, { kind: 'number', key: 'max', label: 'To (empty means no upper limit)' }] },
      ] },
    ],
  },
  seo: {
    title: 'SEO', intro: 'How search engines and social networks show your site. These are written into the page for crawlers when you publish.',
    blocks: [
      { base: 'portfolio.seo', fields: [
        { kind: 'text', key: 'title', label: 'Page title' }, { kind: 'textarea', key: 'description', label: 'Meta description (about 150 characters)' }, { kind: 'text', key: 'keywords', label: 'Keywords (optional, comma separated)' },
        { kind: 'text', key: 'ogTitle', label: 'Social sharing title (blank uses the page title)' }, { kind: 'textarea', key: 'ogDescription', label: 'Social sharing description (blank uses the meta description)' },
        { kind: 'file', key: 'ogImage', label: 'Social sharing image (1200 x 630 works best)', accept: 'image' }, { kind: 'url', key: 'canonical', label: 'Canonical URL (optional)' },
        { kind: 'select', key: 'robots', label: 'Search engines', options: [{ value: 'index', label: 'Allow indexing (visible in search results)' }, { value: 'noindex', label: 'Hide from search engines (noindex). Use only while the site is private.' }] },
        { kind: 'bool', key: 'structuredData', label: 'Add structured data (a "Person" profile for search engines)' },
      ] },
      { title: 'Website address', base: 'portfolio.site', fields: [{ kind: 'url', key: 'url', label: 'Public website address (for example https://yourname.com)', help: 'Needed for correct canonical links, social previews and the sitemap.' }] },
    ],
  },
  analytics: {
    title: 'Analytics Tracking', intro: 'Optional visitor analytics. Off by default. Only the ID formats below are accepted, and trackers load only after the visitor agrees when consent is required.',
    blocks: [{ base: 'portfolio.analytics', fields: [
      { kind: 'bool', key: 'enabled', label: 'Enable analytics' }, { kind: 'text', key: 'ga4', label: 'Google Analytics 4 measurement ID', placeholder: 'G-XXXXXXXXXX' },
      { kind: 'text', key: 'gtm', label: 'Google Tag Manager container ID', placeholder: 'GTM-XXXXXXX' }, { kind: 'text', key: 'metaPixel', label: 'Meta Pixel ID', placeholder: '1234567890' },
      { kind: 'bool', key: 'requireConsent', label: 'Ask visitors for consent first (recommended; required in the UK and EU)' },
      { kind: 'bool', key: 'respectDoNotTrack', label: 'Never track visitors who send Do Not Track or Global Privacy Control' },
    ] }],
  },
  footer: {
    title: 'Footer', blocks: [{ base: 'portfolio.footer', fields: [
      { kind: 'text', key: 'tagline', label: 'Line under your name (blank uses your title)' }, { kind: 'text', key: 'copyright', label: 'Copyright line (blank is generated with the current year)' },
      { kind: 'bool', key: 'showNav', label: 'Show navigation links' }, { kind: 'bool', key: 'showSocial', label: 'Show social icons' }, { kind: 'bool', key: 'showFootprints', label: 'Show the footprints illustration' },
    ] }],
  },
  strategy: {
    title: 'Strategy Framework', intro: 'The planning board. It is labelled as a sample framework, so keep that label unless this is a real client plan.',
    blocks: [{ base: 'portfolio.strategy', fields: [
      { kind: 'text', key: 'label', label: 'Badge text' }, { kind: 'text', key: 'heading', label: 'Heading' }, { kind: 'textarea', key: 'intro', label: 'Introduction' },
      { kind: 'text', key: 'hint', label: 'Click hint above the notes (leave empty to hide)' }, { kind: 'bool', key: 'showToggleAll', label: 'Show an Open all / Close all button' },
      { kind: 'list', key: 'steps', label: 'Steps', item: (s: any) => s.title, make: () => ({ title: '', summary: '', questions: [], color: 'sky' }), addLabel: 'Add step', fields: [{ kind: 'text', key: 'title', label: 'Title' }, { kind: 'textarea', key: 'summary', label: 'Summary' }, { kind: 'strings', key: 'questions', label: 'Questions' }, { kind: 'tone', key: 'color', label: 'Note colour' }] },
    ] }],
  },
  mentoring: {
    title: 'Mentoring & Training', intro: 'Optional. Turn the section on under Sections & Visibility once this is filled in.',
    blocks: [{ base: 'portfolio.mentoring', fields: [
      { kind: 'text', key: 'heading', label: 'Heading' }, { kind: 'rich', key: 'overview', label: 'Course overview' }, { kind: 'strings', key: 'topics', label: 'Topics' }, { kind: 'strings', key: 'outcomes', label: 'Learning outcomes' },
      { kind: 'text', key: 'format', label: 'Format' }, { kind: 'image', video: true, key: 'instructorPhoto', label: 'Instructor photo' }, { kind: 'bool', key: 'showLiveBadge', label: 'Show a Live badge (only when a real session is on)' },
    ] }],
  },
}
