// Entities and pages added in version 3. Registered into the same tables the rest of the admin reads.
import type { SiteContent } from '../content/types'
import { newApplication, newJourney, newNote, newResource, newShortLink } from '../content/factories'
import { ENTITIES, PAGES, type EntityDef } from './schema'

/* eslint-disable @typescript-eslint/no-explicit-any */
const hiddenToggle = { shown: (x: any) => !x.hidden, setShown: (x: any, v: boolean) => { x.hidden = !v }, shownLabels: ['Published', 'Draft'] as [string, string] }
const sectionOptions = (c: SiteContent) => c.portfolio.sections.filter((x) => x.type !== 'hero').map((x) => ({ value: x.id, label: x.heading || x.navLabel || x.id }))

const defs: EntityDef[] = [
  {
    id: 'journey', title: 'Career Journey', singular: 'milestone', collection: 'journey', make: newJourney,
    intro: 'A timeline of roles, projects, learning, awards and milestones. Nothing appears until you publish an entry.',
    titleOf: (j) => j.title || 'Untitled milestone', subtitleOf: (j) => [j.period, j.org].filter(Boolean).join(' · '), thumbOf: (j) => j.image?.src,
    ...hiddenToggle,
    fields: [
      { kind: 'text', key: 'title', label: 'Title' }, { kind: 'text', key: 'org', label: 'Organisation or place' }, { kind: 'text', key: 'period', label: 'When (for example 2023 to 2025)' },
      { kind: 'select', key: 'kind', label: 'Kind', options: [{ value: 'role', label: 'Role' }, { value: 'project', label: 'Project' }, { value: 'learning', label: 'Learning' }, { value: 'award', label: 'Award' }, { value: 'milestone', label: 'Milestone' }] },
      { kind: 'textarea', key: 'description', label: 'Description' }, { kind: 'url', key: 'link', label: 'Link (optional)' }, { kind: 'image', key: 'image', label: 'Image (optional)' },
    ],
  },
  {
    id: 'resources', title: 'Resources', singular: 'resource', collection: 'resources', make: newResource,
    intro: 'Downloads such as a media kit, a content calendar template or a checklist. Visitors download the file directly.',
    titleOf: (r) => r.title || 'Untitled resource', subtitleOf: (r) => r.format, thumbOf: (r) => r.image?.src, ...hiddenToggle,
    fields: [
      { kind: 'text', key: 'title', label: 'Title' }, { kind: 'textarea', key: 'description', label: 'Description' },
      { kind: 'file', key: 'file', label: 'File', accept: 'any' }, { kind: 'text', key: 'format', label: 'Format label (PDF, XLSX, Template)' }, { kind: 'image', key: 'image', label: 'Preview image (optional)' },
    ],
  },
  {
    id: 'notes', title: 'Notes (blog)', singular: 'note', collection: 'notes', make: newNote,
    intro: 'Short articles that show how you think. Each note gets its own address (/notes/<address>), a share preview and a place in the RSS feed.',
    titleOf: (n) => n.title || 'Untitled note', subtitleOf: (n) => [n.date, n.slug && `/notes/${n.slug}`].filter(Boolean).join(' · '), thumbOf: (n) => n.cover?.src, ...hiddenToggle,
    fields: [
      { kind: 'text', key: 'title', label: 'Title' }, { kind: 'text', key: 'slug', label: 'Address (letters, numbers, dashes)', help: 'Becomes /notes/<this>. Notes without an address stay hidden.', maxLength: 80 },
      { kind: 'date', key: 'date', label: 'Date' }, { kind: 'textarea', key: 'summary', label: 'Summary (shown on cards and in the feed)' },
      { kind: 'rich', key: 'body', label: 'Body', rows: 14 }, { kind: 'image', key: 'cover', label: 'Cover image' }, { kind: 'strings', key: 'tags', label: 'Tags' },
      { kind: 'group', label: 'Search and sharing', open: false, fields: [{ kind: 'text', key: 'seoTitle', label: 'Page title' }, { kind: 'textarea', key: 'seoDescription', label: 'Description' }] },
    ],
  },
  {
    id: 'applications', title: 'Application Links', singular: 'application link', collection: 'applications', make: newApplication,
    intro: 'A private version of your portfolio for one employer or client, at /for/<code>. It is never listed or indexed, and only someone with the link can open it. Publish to make a new link work.',
    titleOf: (a) => a.label || a.company || 'Untitled link', subtitleOf: (a) => [a.company, a.role, a.slug && `/for/${a.slug}`].filter(Boolean).join(' · '),
    shown: (a) => a.enabled !== false, setShown: (a, v) => { a.enabled = v }, shownLabels: ['Active', 'Switched off'],
    fields: [
      { kind: 'text', key: 'label', label: 'Private label (only you see this)' }, { kind: 'text', key: 'company', label: 'Company' }, { kind: 'text', key: 'role', label: 'Role applied for' },
      { kind: 'text', key: 'slug', label: 'Link code', help: 'Use something hard to guess. The link is /for/<code>.', maxLength: 40 },
      { kind: 'date', key: 'expiresAt', label: 'Link stops working after (optional)' },
      { kind: 'group', label: 'Words for this application', open: true, fields: [
        { kind: 'group', key: 'hero', label: 'Hero', open: true, fields: [{ kind: 'text', key: 'label', label: 'Label' }, { kind: 'text', key: 'headline', label: 'Headline' }, { kind: 'text', key: 'supporting', label: 'Supporting line' }, { kind: 'textarea', key: 'intro', label: 'Intro' }] },
        { kind: 'group', key: 'greeting', label: 'Welcome note (small, dismissible)', open: false, fields: [{ kind: 'bool', key: 'enabled', label: 'Show a welcome note' }, { kind: 'text', key: 'text', label: 'Text, for example "Prepared for the Acme team"' }] },
      ] },
      { kind: 'group', label: 'What to emphasise', open: true, fields: [
        { kind: 'refs', key: 'featuredProjectIds', label: 'Projects to put first', from: 'projects' },
        { kind: 'bool', key: 'onlyFeatured', label: 'Show only those projects' },
        { kind: 'strings', key: 'highlightSkills', label: 'Skills and competencies to list first' },
        { kind: 'multi', key: 'hideSectionIds', label: 'Hide these sections', options: sectionOptions },
      ] },
      { kind: 'group', label: 'Look and CV', open: false, fields: [
        { kind: 'ref', key: 'lookId', label: 'Saved look to use', from: 'looks' },
        { kind: 'select', key: 'professional', label: 'Professional intensity', options: [{ value: '', label: 'Keep the site setting' }, { value: 'creative', label: 'Creative' }, { value: 'balanced', label: 'Balanced' }, { value: 'professional', label: 'Professional' }] },
        { kind: 'select', key: 'season', label: 'Season', options: [{ value: '', label: 'Keep the site setting' }, 'spring', 'summer', 'autumn', 'winter'] },
        { kind: 'file', key: 'cvFile', label: 'CV for this application (replaces the main CV here)', accept: 'any' }, { kind: 'text', key: 'cvFilename', label: 'Download file name' },
      ] },
    ],
  },
  {
    id: 'shortLinks', title: 'Short Links', singular: 'short link', collection: 'shortLinks', make: newShortLink,
    intro: 'Memorable addresses such as yoursite.com/go/cv for bios, business cards and print. They redirect on the server.',
    titleOf: (l) => (l.slug ? `/go/${l.slug}` : 'Untitled link'), subtitleOf: (l) => [l.label, `${l.target?.type}: ${l.target?.value}`].filter(Boolean).join(' · '),
    shown: (l) => l.enabled !== false, setShown: (l, v) => { l.enabled = v }, shownLabels: ['On', 'Off'],
    fields: [
      { kind: 'text', key: 'slug', label: 'Short code (letters, numbers, dashes)', maxLength: 40 }, { kind: 'text', key: 'label', label: 'Private note' },
      { kind: 'group', key: 'target', label: 'Where it goes', open: true, fields: [
        { kind: 'select', key: 'type', label: 'Goes to', options: [{ value: 'section', label: 'A section of the homepage' }, { value: 'project', label: 'A project' }, { value: 'note', label: 'A note' }, { value: 'application', label: 'An application link' }, { value: 'profile', label: 'The one page profile' }, { value: 'url', label: 'Another website' }] },
        { kind: 'text', key: 'value', label: 'Which one', help: 'Section id, project id, note address, application code, or a full https address.' },
      ] },
    ],
  },
]
for (const d of defs) ENTITIES[d.id] = d

const SECTION_LAYOUT = 'Applies to sections that offer more than one arrangement.'
void SECTION_LAYOUT

Object.assign(PAGES, {
  design: {
    title: 'Design', intro: 'Shape, spacing and finish for the whole site. Colours come from the season; dark mode is below.',
    blocks: [
      { title: 'Shape and feel', base: 'portfolio.design', fields: [
        { kind: 'select', key: 'radius', label: 'Corner roundness', options: [{ value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Very round' }] },
        { kind: 'select', key: 'buttons', label: 'Button shape', options: [{ value: 'pill', label: 'Pill' }, { value: 'rounded', label: 'Rounded' }, { value: 'square', label: 'Square' }] },
        { kind: 'select', key: 'density', label: 'Spacing', options: [{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }] },
        { kind: 'range', key: 'fontScale', label: 'Text size', min: 0.85, max: 1.3, step: 0.05, help: '1 is normal. Visitors can still zoom.' },
        { kind: 'select', key: 'shadow', label: 'Shadows', options: [{ value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'strong', label: 'Strong' }] },
        { kind: 'select', key: 'borderWeight', label: 'Outline weight', options: [{ value: 'thin', label: 'Thin' }, { value: 'normal', label: 'Normal' }, { value: 'bold', label: 'Bold' }] },
        { kind: 'select', key: 'headingCase', label: 'Headings', options: [{ value: 'normal', label: 'As written' }, { value: 'upper', label: 'Capitals' }] },
        { kind: 'bool', key: 'dialogAnimation', label: 'Animate pop-ups' }, { kind: 'bool', key: 'readingProgress', label: 'Show the scroll progress surfer' },
      ] },
      { title: 'Light and dark', base: 'portfolio.design', fields: [
        { kind: 'select', key: 'colorMode', label: 'Colour mode', options: [{ value: 'light', label: 'Always light' }, { value: 'dark', label: 'Always dark' }, { value: 'system', label: 'Follow the visitor device' }], help: 'Every season has a dark version made from its own colours.' },
        { kind: 'bool', key: 'colorToggle', label: 'Show a light and dark switch to visitors' },
      ] },
    ],
  },
  announcement: {
    title: 'Banner & Schedule', intro: 'A banner across the top, and changes that switch on and off by themselves on dates you choose.',
    blocks: [
      { title: 'Announcement banner', base: 'portfolio.announcement', fields: [
        { kind: 'bool', key: 'enabled', label: 'Show the banner' }, { kind: 'text', key: 'text', label: 'Message' },
        { kind: 'text', key: 'linkLabel', label: 'Link text' }, { kind: 'url', key: 'link', label: 'Link' },
        { kind: 'select', key: 'tone', label: 'Colour', options: ['ink', 'red', 'butter', 'sky', 'green'] },
        { kind: 'bool', key: 'dismissible', label: 'Let visitors close it' },
        { kind: 'date', key: 'from', label: 'Show from (optional)' }, { kind: 'date', key: 'to', label: 'Show until (optional)' },
      ] },
      { title: 'Scheduled changes', base: 'portfolio', fields: [{
        kind: 'list', key: 'schedule', label: 'Rules', addLabel: 'Add a scheduled change', item: (r: any) => r.label || 'Untitled rule',
        make: () => ({ id: `rule-${Math.random().toString(36).slice(2, 8)}`, label: '', enabled: true, from: '', to: '', seasonMode: '', professional: '', availability: '', heroLabel: '', heroHeadline: '', heroIntro: '', showSectionIds: [], hideSectionIds: [], announcementText: '', announcementLink: '' }),
        fields: [
          { kind: 'text', key: 'label', label: 'Name (only you see this)' }, { kind: 'bool', key: 'enabled', label: 'Active' },
          { kind: 'date', key: 'from', label: 'Starts' }, { kind: 'date', key: 'to', label: 'Ends (last day included)' },
          { kind: 'select', key: 'seasonMode', label: 'Season during this time', options: [{ value: '', label: 'No change' }, 'spring', 'summer', 'autumn', 'winter'] },
          { kind: 'select', key: 'professional', label: 'Professional intensity', options: [{ value: '', label: 'No change' }, 'creative', 'balanced', 'professional'] },
          { kind: 'text', key: 'availability', label: 'Availability message' },
          { kind: 'text', key: 'heroLabel', label: 'Hero label' }, { kind: 'text', key: 'heroHeadline', label: 'Hero headline' }, { kind: 'textarea', key: 'heroIntro', label: 'Hero intro' },
          { kind: 'multi', key: 'showSectionIds', label: 'Show these sections', options: sectionOptions }, { kind: 'multi', key: 'hideSectionIds', label: 'Hide these sections', options: sectionOptions },
          { kind: 'text', key: 'announcementText', label: 'Banner message' }, { kind: 'url', key: 'announcementLink', label: 'Banner link' },
        ],
      }] },
    ],
  },
  engage: {
    title: 'Booking & Newsletter', intro: 'Ways for visitors to take the next step.',
    blocks: [
      { title: 'Booking link', base: 'portfolio.booking', fields: [
        { kind: 'bool', key: 'enabled', label: 'Show a booking button' }, { kind: 'text', key: 'label', label: 'Button text' }, { kind: 'url', key: 'url', label: 'Booking page (Calendly, Cal.com, Google Calendar)' },
        { kind: 'multi', key: 'showIn', label: 'Where it appears', options: [{ value: 'hero', label: 'Hero' }, { value: 'header', label: 'Header' }, { value: 'contact', label: 'Contact section' }, { value: 'profile', label: 'One page profile' }] },
      ] },
      { title: 'Newsletter signup', base: 'portfolio.newsletter', fields: [
        { kind: 'bool', key: 'enabled', label: 'Show the signup section' },
        { kind: 'select', key: 'mode', label: 'How it works', options: [{ value: 'collect', label: 'Collect addresses here (stored on your server, with consent)' }, { value: 'link', label: 'Send people to my newsletter service' }] },
        { kind: 'url', key: 'link', label: 'Signup page (link mode)', showIf: (n: any) => n.mode === 'link' },
        { kind: 'text', key: 'heading', label: 'Heading' }, { kind: 'textarea', key: 'text', label: 'Text' }, { kind: 'text', key: 'buttonLabel', label: 'Button text' },
        { kind: 'textarea', key: 'consentText', label: 'Consent wording', help: 'Shown next to a required tick box.' }, { kind: 'text', key: 'successMessage', label: 'Thank you message' },
      ] },
    ],
  },
  profilePage: {
    title: 'One Page Profile', intro: 'A clean, printable summary at /profile that recruiters can save as a PDF. It draws on your real content only.',
    blocks: [
      { base: 'portfolio.profilePage', fields: [
        { kind: 'bool', key: 'enabled', label: 'Offer the one page profile' }, { kind: 'text', key: 'title', label: 'Title (blank uses your name)' }, { kind: 'text', key: 'subtitle', label: 'Subtitle (blank uses your job title)' },
        { kind: 'bool', key: 'showPhoto', label: 'Show my photo' }, { kind: 'text', key: 'accent', label: 'Accent colour (hex, for example #b5262e)' },
        { kind: 'group', key: 'include', label: 'What to include', open: true, fields: ['summary', 'competencies', 'platforms', 'industries', 'achievements', 'results', 'projects', 'tools', 'education', 'certifications', 'employment', 'contact'].map((k) => ({ kind: 'bool' as const, key: k, label: k[0].toUpperCase() + k.slice(1) })) },
        { kind: 'refs', key: 'resultIds', label: 'Results to feature (blank uses the latest six)', from: 'results' },
        { kind: 'refs', key: 'projectIds', label: 'Projects to feature (blank uses featured projects)', from: 'projects' },
        { kind: 'number', key: 'maxProjects', label: 'Most projects to show', min: 1, max: 12, nullable: false },
        { kind: 'textarea', key: 'footerNote', label: 'Note at the bottom (for example references available on request)' },
      ] },
    ],
  },
  maintenance: {
    title: 'Maintenance & 404', intro: 'Pause the public site politely, and decide what a missing page says. You can still see the site while signed in.',
    blocks: [
      { title: 'Maintenance mode', base: 'portfolio.maintenance', fields: [
        { kind: 'bool', key: 'enabled', label: 'Show a "back soon" page instead of the site' }, { kind: 'text', key: 'title', label: 'Title' }, { kind: 'textarea', key: 'message', label: 'Message' },
        { kind: 'bool', key: 'showContact', label: 'Show an email button' }, { kind: 'bool', key: 'showSocial', label: 'Show social links' },
        { kind: 'bool', key: 'status503', label: 'Tell search engines it is temporary (503)', help: 'Use for short pauses. Search engines keep your ranking and come back later.' },
      ] },
      { title: 'Page not found', base: 'portfolio.notFound', fields: [{ kind: 'text', key: 'title', label: 'Title' }, { kind: 'textarea', key: 'message', label: 'Message' }, { kind: 'text', key: 'buttonLabel', label: 'Button text' }] },
    ],
  },
  quality: {
    title: 'Quality Rules & Insights', intro: 'What counts as a complete project, and privacy friendly visit counts.',
    blocks: [
      { title: 'Quality rules', base: 'portfolio.quality', fields: [
        { kind: 'number', key: 'minDescription', label: 'Shortest acceptable project description (characters)', min: 0, nullable: false },
        { kind: 'bool', key: 'requireCover', label: 'Every project needs a cover image' }, { kind: 'bool', key: 'requireAlt', label: 'Images need alt text' },
        { kind: 'bool', key: 'requirePeriod', label: 'Every project needs a year or period' }, { kind: 'bool', key: 'requireLink', label: 'Every project needs an external link' },
      ] },
      { title: 'Visit insights (first party, no cookies)', base: 'portfolio.insights', fields: [
        { kind: 'bool', key: 'enabled', label: 'Count visits on my own server', help: 'Stores daily totals only. No IP address, cookie or profile of any visitor is kept.' },
        { kind: 'bool', key: 'respectDoNotTrack', label: 'Skip visitors who send Do Not Track' }, { kind: 'bool', key: 'requireConsent', label: 'Count only visitors who accepted cookies and analytics' },
        { kind: 'number', key: 'retentionDays', label: 'Keep daily totals for (days)', min: 7, max: 3650, nullable: false },
      ] },
    ],
  },
})
