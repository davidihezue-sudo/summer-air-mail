// Entities and pages added in version 3. Registered into the same tables the rest of the admin reads.
import type { SiteContent } from '../content/types'
import { SECTION_LABELS } from '../content/sections'
import { newApplication, newAudience, newFaq, newJourney, newNote, newResource, newShortLink } from '../content/factories'
import { ENTITIES, PAGES, type EntityDef } from './schema'
import type { Field } from './fields'

/* eslint-disable @typescript-eslint/no-explicit-any */
const hiddenToggle = { shown: (x: any) => !x.hidden, setShown: (x: any, v: boolean) => { x.hidden = !v }, shownLabels: ['Published', 'Draft'] as [string, string] }
const sectionOptions = (c: SiteContent) => c.portfolio.sections.filter((x) => x.type !== 'hero').map((x) => ({ value: x.id, label: x.heading || x.navLabel || SECTION_LABELS[x.type] || x.id }))

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
    id: 'faq', title: 'FAQ questions', singular: 'question', collection: 'faqs', make: newFaq,
    intro: 'Questions people often ask, with your answers. Nothing appears until a question is published and has both a question and an answer. The section stays hidden while it is empty.',
    titleOf: (q) => q.question || 'Untitled question', subtitleOf: (q) => q.topic || '',
    ...hiddenToggle,
    fields: [
      { kind: 'text', key: 'question', label: 'Question', maxLength: 200 },
      { kind: 'textarea', key: 'answer', label: 'Answer', rows: 6, help: 'Leave a blank line between paragraphs. Start a line with "- " for a bullet list. Use **bold**, *italic* and [a label](https://link).' },
      { kind: 'select', key: 'topic', label: 'Topic (optional)', custom: true, options: (c: SiteContent) => [{ value: '', label: 'No topic' }, ...[...new Set(c.faqs.map((q) => q.topic).filter(Boolean))].map((t) => ({ value: t, label: t }))], help: 'Visitors can filter by topic. Pick one you have used, or type a new one. Questions with no topic show under All only.' },
      { kind: 'text', key: 'buttonLabel', label: 'Button under the answer (optional)', placeholder: 'For example: Book a call', maxLength: 40 },
      { kind: 'url', key: 'buttonLink', label: 'Where the button goes', placeholder: 'https://, mailto: or #contact' },
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
      { kind: 'rich', key: 'body', label: 'Body', rows: 14 }, { kind: 'image', video: true, key: 'cover', label: 'Cover image' }, { kind: 'strings', key: 'tags', label: 'Tags' },
      { kind: 'group', label: 'Search and sharing', open: false, fields: [{ kind: 'text', key: 'seoTitle', label: 'Page title' }, { kind: 'textarea', key: 'seoDescription', label: 'Description' }] },
    ],
  },
  {
    id: 'audiences', title: 'Audience Views', singular: 'audience view', collection: 'audiences', make: newAudience,
    intro: 'One version of your site for each kind of visitor, such as recruiters, freelance clients, agencies and collaborators. Set it up once, then share its address. A view only changes what you set; everything else follows the main site. Views are not listed or indexed by Google.',
    titleOf: (a) => a.name || 'Untitled view', subtitleOf: (a) => (a.slug ? `/for/${a.slug}` : 'Needs an address'),
    shown: (a) => a.enabled !== false, setShown: (a, v) => { a.enabled = v }, shownLabels: ['Active', 'Switched off'],
    fields: [
      { kind: 'text', key: 'name', label: 'Name of this view', placeholder: 'For example: Recruiters', maxLength: 60, help: 'Only for your own use, but note it is part of the published page data, so keep it to something like Recruiters or Clients.' },
      { kind: 'text', key: 'slug', label: 'Address', placeholder: 'recruiters', maxLength: 40, help: 'Letters, numbers and dashes. The view lives at yoursite.com/for/<address>. Application links use the same /for/ space, so the two cannot share a name.' },
      { kind: 'group', label: 'What this audience reads first', open: true, fields: [
        { kind: 'group', key: 'hero', label: 'Hero words (blank uses the main site\'s words)', open: true, fields: [{ kind: 'text', key: 'label', label: 'Label', inherit: (c: SiteContent) => c.portfolio.hero.label }, { kind: 'text', key: 'headline', label: 'Headline', inherit: (c: SiteContent) => c.portfolio.hero.headline }, { kind: 'text', key: 'supporting', label: 'Supporting line', inherit: (c: SiteContent) => c.portfolio.hero.supporting }, { kind: 'textarea', key: 'intro', label: 'Intro', inherit: (c: SiteContent) => c.portfolio.hero.intro }] },
        { kind: 'list', key: 'ctas', label: 'Hero buttons for this view', seed: (c: SiteContent) => c.portfolio.hero.ctas, item: (c: any) => c.label, make: () => ({ label: '', target: 'contact' }), addLabel: 'Add button', fields: [{ kind: 'text', key: 'label', label: 'Button text' }, { kind: 'select', key: 'target', label: 'Goes to', options: sectionOptions }] },
        { kind: 'textarea', key: 'bio', label: 'About text for this view', rows: 6, help: 'Leave a blank line between paragraphs. Blank uses the main About text.', inherit: (c: SiteContent) => c.portfolio.profile.bio.join('\n\n') },
        { kind: 'list', key: 'sectionWording', label: 'Different heading or intro for a section', item: (w: any) => w.heading || w.sectionId || 'Section', make: () => ({ sectionId: '', heading: '', intro: '' }), addLabel: 'Reword a section', fields: [{ kind: 'select', key: 'sectionId', label: 'Section', options: sectionOptions }, { kind: 'text', key: 'heading', label: 'Heading', inherit: (c: SiteContent, sib: (k: string) => unknown) => c.portfolio.sections.find((s) => s.id === sib('sectionId'))?.heading ?? '' }, { kind: 'textarea', key: 'intro', label: 'Intro', inherit: (c: SiteContent, sib: (k: string) => unknown) => c.portfolio.sections.find((s) => s.id === sib('sectionId'))?.intro ?? '' }] },
      ] },
      { kind: 'group', label: 'Which sections show, and in what order', open: true, fields: [
        { kind: 'viewSections', label: 'Sections in this view' },
      ] },
      { kind: 'group', label: 'Leave out individual items', open: false, fields: [
        { kind: 'group', key: 'hide', label: 'Hide for this audience', open: true, fields: [
          { kind: 'refs', key: 'projects', label: 'Projects', from: 'projects' }, { kind: 'refs', key: 'services', label: 'Services', from: 'services' }, { kind: 'refs', key: 'tools', label: 'Tools', from: 'tools' },
          { kind: 'refs', key: 'results', label: 'Results', from: 'results' }, { kind: 'refs', key: 'testimonials', label: 'Testimonials', from: 'testimonials' }, { kind: 'refs', key: 'faqs', label: 'FAQ questions', from: 'faqs' },
          { kind: 'refs', key: 'websites', label: 'Websites', from: 'websites' }, { kind: 'refs', key: 'notes', label: 'Notes', from: 'notes' },
        ] },
      ] },
      { kind: 'group', label: 'What to emphasise', open: false, fields: [
        { kind: 'refs', key: 'featuredProjectIds', label: 'Projects to put first', from: 'projects' },
        { kind: 'bool', key: 'onlyFeatured', label: 'Show only those projects' },
        { kind: 'strings', key: 'highlightSkills', label: 'Skills and competencies to list first' },
      ] },
      { kind: 'group', label: 'Look and CV', open: false, fields: [
        { kind: 'select', key: 'professional', label: 'Professional intensity', options: [{ value: '', label: 'Keep the site setting' }, { value: 'creative', label: 'Creative' }, { value: 'balanced', label: 'Balanced' }, { value: 'professional', label: 'Professional' }] },
        { kind: 'select', key: 'season', label: 'Season', options: [{ value: '', label: 'Keep the site setting' }, 'spring', 'summer', 'autumn', 'winter'] },
        { kind: 'file', key: 'cvFile', label: 'CV for this audience (replaces the main CV here)', accept: 'any' }, { kind: 'text', key: 'cvFilename', label: 'Download file name' },
      ] },
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
        { kind: 'group', key: 'hero', label: 'Hero (blank uses the main site\'s words)', open: true, fields: [{ kind: 'text', key: 'label', label: 'Label', inherit: (c: SiteContent) => c.portfolio.hero.label }, { kind: 'text', key: 'headline', label: 'Headline', inherit: (c: SiteContent) => c.portfolio.hero.headline }, { kind: 'text', key: 'supporting', label: 'Supporting line', inherit: (c: SiteContent) => c.portfolio.hero.supporting }, { kind: 'textarea', key: 'intro', label: 'Intro', inherit: (c: SiteContent) => c.portfolio.hero.intro }] },
        { kind: 'group', key: 'greeting', label: 'Welcome note (small, dismissible)', open: false, fields: [{ kind: 'bool', key: 'enabled', label: 'Show a welcome note' }, { kind: 'text', key: 'text', label: 'Text, for example "Prepared for the Acme team"' }] },
      ] },
      { kind: 'group', label: 'What to emphasise', open: true, fields: [
        { kind: 'refs', key: 'featuredProjectIds', label: 'Projects to put first', from: 'projects' },
        { kind: 'bool', key: 'onlyFeatured', label: 'Show only those projects' },
        { kind: 'strings', key: 'highlightSkills', label: 'Skills and competencies to list first' },
        { kind: 'multi', key: 'hideSectionIds', label: 'Hide these sections', options: sectionOptions },
      ] },
      { kind: 'group', label: 'Look and CV', open: false, fields: [
        { kind: 'ref', key: 'audienceId', label: 'Build on an audience view', from: 'audiences', help: 'Start from one of your audience views (for example Recruiters), then change only what is different for this application. Updating the view updates every link built on it.' },
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

if (ENTITIES.screenshots) ENTITIES.screenshots.fields.push({ kind: 'select', key: 'size', label: 'Size on the page (this screenshot)', options: [{ value: '', label: 'Use the site setting' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }], help: 'Only changes how big it appears. The shape and sharpness stay the same.' })

/** The public "This site, in numbers" panel. */
export const STATS_FIELDS: Field[] = [
  { kind: 'bool', key: 'enabled', label: 'Allow a public stats panel', help: 'Needs the visit counting above to be on.' },
  { kind: 'select', key: 'rangeDays', label: 'Period shown', options: [{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }] },
  { kind: 'bool', key: 'showViews', label: 'Show page views as well as visitors' }, { kind: 'bool', key: 'showTopPages', label: 'Show the most read pages' },
  { kind: 'textarea', key: 'note', label: 'Your own words above the numbers (optional)', help: 'Leave blank for a short plain line.' },
]

/** The switches for counting visits. They live on the Visit Insights page, next to the numbers they control. */
export const INSIGHT_FIELDS: Field[] = [
        { kind: 'bool', key: 'enabled', label: 'Count visits on my own server', help: 'Stores daily totals only. No IP address, cookie or profile of any visitor is kept.' },
        { kind: 'bool', key: 'countOwn', label: 'Count my own visits separately', help: 'Your visits (signed in, on a device you have used for the admin, or from the network you signed in from) are shown apart as "You and home" and never added to outside visitors. Off ignores them completely.' },
        { kind: 'bool', key: 'respectDoNotTrack', label: 'Skip visitors who send Do Not Track' }, { kind: 'bool', key: 'requireConsent', label: 'Count only visitors who accepted cookies and analytics' },
        { kind: 'number', key: 'retentionDays', label: 'Keep daily totals for (days)', min: 7, max: 3650, nullable: false },
]

Object.assign(PAGES, {
  extras: {
    title: 'Extras', intro: 'Small touches that make the site nicer to use. Each one can be switched off.',
    blocks: [{ base: 'portfolio.extras', fields: [
      { kind: 'bool', key: 'availabilityBadge', label: 'Availability badge in the header', help: 'A softly pulsing green dot and your availability message from Personal Profile. Desktop only.' },
      { kind: 'bool', key: 'projectNav', label: 'Previous and Next buttons inside a project' },
      { kind: 'bool', key: 'backToTop', label: 'Back to top button' },
      { kind: 'bool', key: 'copyEmail', label: 'Copy button beside your email address' },
      { kind: 'bool', key: 'clientStrip', label: 'Strip of brands I have worked with', help: 'Built from the client names on your published projects, so it only ever shows real work. Needs at least two clients.' },
      { kind: 'bool', key: 'readingTime', label: 'Minutes to read on notes' },
      { kind: 'bool', key: 'siteSearch', label: 'Search box for visitors', help: 'Visitors press Ctrl+K (Command+K on a Mac) or use the magnifier in the header to jump straight to a project, service, tool or note.' },
      { kind: 'bool', key: 'reelPreview', label: 'Silent video preview when hovering over a reel', help: 'Only for videos you uploaded, on devices with a mouse. Nothing loads until the visitor hovers.' },
      { kind: 'bool', key: 'casePdf', label: '"Save as PDF" button on case studies', help: 'Opens the print dialog with a clean version of the case study, which visitors can save as a PDF.' },
    ] }],
  },
  mediaDisplay: {
    title: 'Pictures & Screenshots', intro: 'Posts, stories, reels and screenshots come in different shapes. These settings decide how they are shown. The default shows every picture whole, in its own shape, so nothing is trimmed.',
    blocks: [{ base: 'portfolio.media', fields: [
      { kind: 'select', key: 'cardShape', label: 'Shape of portfolio cards', options: [{ value: 'auto', label: 'Follow each picture (nothing is trimmed)' }, { value: 'square', label: 'Square (1:1)' }, { value: 'portrait', label: 'Instagram portrait (4:5)' }, { value: 'story', label: 'Story, Reel and TikTok (9:16)' }, { value: 'tall', label: 'Pinterest (2:3)' }, { value: 'landscape', label: 'YouTube (16:9)' }, { value: 'wide', label: 'Facebook and LinkedIn link (1.91:1)' }], help: 'You can also set the shape for one project in its own settings.' },
      { kind: 'select', key: 'cardFit', label: 'When a picture is not the frame\'s shape', options: [{ value: 'smart', label: 'Smart: trim only a sliver, otherwise show it whole' }, { value: 'contain', label: 'Always show the whole picture' }, { value: 'cover', label: 'Fill the frame and trim the edges' }] },
      { kind: 'select', key: 'fill', label: 'What fills the space around a picture', options: [{ value: 'blur', label: 'A soft blurred copy of the picture' }, { value: 'tone', label: 'A plain colour' }, { value: 'none', label: 'Nothing' }] },
      { kind: 'select', key: 'screenshotSize', label: 'Screenshot size', options: [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }], help: 'Only how big they appear on the page. Their shape and sharpness never change, and visitors can still zoom in to the full picture. You can also set the size on each screenshot.' },
      { kind: 'select', key: 'screenshots', label: 'Screenshots section layout', options: [{ value: 'masonry', label: 'Masonry: tall and wide screenshots fit together' }, { value: 'grid', label: 'Even grid' }] },
    ] }],
  },
  faqDisplay: {
    title: 'FAQ Display', intro: 'How the FAQ section behaves and the words around it. The questions and answers themselves are under FAQ. Change the section heading and intro under Sections & Visibility.',
    blocks: [{ title: 'Behaviour', base: 'portfolio.faq', fields: [
      { kind: 'select', key: 'openMode', label: 'Opening an answer', options: [{ value: 'one', label: 'One at a time: opening one closes the other' }, { value: 'many', label: 'Several can stay open' }] },
      { kind: 'bool', key: 'showTopics', label: 'Show topic buttons', help: 'Only appears when your questions use at least two topics.' },
      { kind: 'select', key: 'search', label: 'Search box', options: [{ value: 'auto', label: 'Only when there are 8 or more questions' }, { value: 'always', label: 'Always' }, { value: 'never', label: 'Never' }] },
    ] }, { title: 'Words', base: 'portfolio.faq', fields: [
      { kind: 'text', key: 'allLabel', label: 'Label of the button that shows every topic', maxLength: 24 },
      { kind: 'text', key: 'searchLabel', label: 'Search box label', maxLength: 60 },
      { kind: 'text', key: 'closingText', label: 'Line after the questions', maxLength: 120 },
      { kind: 'text', key: 'closingLabel', label: 'Button after the questions', maxLength: 40 },
      { kind: 'text', key: 'closingLink', label: 'Where that button goes (blank means your contact section)', placeholder: 'https://, mailto: or #contact', maxLength: 300 },
    ] }],
  },
  resultsDisplay: {
    title: 'Results Display', intro: 'How visitors can explore your results. Everything comes from the results you enter under Analytics & Results; nothing is added or estimated.',
    blocks: [{ title: 'Explorer', base: 'portfolio.resultsUi', fields: [
      { kind: 'select', key: 'defaultView', label: 'What visitors see first', options: [{ value: 'cards', label: 'Cards: one card per result' }, { value: 'compare', label: 'Compare: bars ranking how far each result moved' }, { value: 'table', label: 'Table: every figure in rows' }] },
      { kind: 'bool', key: 'showSwitcher', label: 'Let visitors switch between cards, compare and table', help: 'They can also filter by platform and type, and sort by biggest change.' },
      { kind: 'bool', key: 'allowDownload', label: 'Offer a "Download the data (CSV)" button', help: 'Visitors get the results they can see as a spreadsheet file. Confidential results with hidden values are left out of the numbers.' },
    ] }],
  },
  toolsDisplay: {
    title: 'Tools Display', intro: 'How the tools you use appear on the site. Everything shows without clicking. Turn individual tools on under Tools & Platforms.',
    blocks: [
      { title: 'Layout', base: 'portfolio.toolsUi', fields: [
        { kind: 'select', key: 'layout', label: 'Layout', options: [
          { value: 'cards', label: 'Cards: logo, name, category and how you use it' },
          { value: 'wall', label: 'Logo wall: just the logos (names on hover, or shown under each)' },
          { value: 'list', label: 'List: tidy rows with the description beside each logo' },
          { value: 'compact', label: 'Compact: small cards' },
          { value: 'marquee', label: 'Scrolling strip: logos drift past slowly' },
          { value: 'rings', label: 'Rings: flip to read (the original look)' },
        ] },
        { kind: 'select', key: 'marquee', label: 'Scrolling strip style', showIf: (u: any) => u.layout === 'marquee', options: [
          { value: 'logos', label: 'True logos only: their real colours, no name, no pill, no tile' },
          { value: 'chips', label: 'Logo with its name in a pill' },
        ] },
        { kind: 'bool', key: 'logosBand', label: 'Show the logos on a light band', showIf: (u: any) => u.layout === 'marquee' && u.marquee !== 'chips', help: 'One plain light strip behind the whole row, so every colour (black logos too) reads clearly. Off puts the logos straight on the dark section and any black logo is drawn in white.' },
        { kind: 'bool', key: 'tabs', label: 'Category tabs with counts', help: 'Visitors pick a category. Off shows everything, grouped or in one list.' },
        { kind: 'bool', key: 'group', label: 'Group by category when there are no tabs' },
      ] },
      { title: 'What shows', base: 'portfolio.toolsUi', fields: [
        { kind: 'bool', key: 'showLogos', label: 'Logos' }, { kind: 'bool', key: 'showNames', label: 'Names with the logos', help: 'Not used by the scrolling strip when it is set to true logos only.' },
        { kind: 'bool', key: 'showUsage', label: 'How I use each tool (the description)' }, { kind: 'bool', key: 'showCategory', label: 'Category on each card' },
      ] },
      { title: 'Look', base: 'portfolio.toolsUi', fields: [
        { kind: 'select', key: 'logoSize', label: 'Logo size', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] },
        { kind: 'range', key: 'logoPx', label: 'Exact logo size', min: 0, max: 160, step: 4, unit: 'px', help: '0 uses the size above. Otherwise anything from 24 to 160 pixels, in every layout, including the scrolling strip.' },
        { kind: 'select', key: 'logoStyle', label: 'Logo colours', options: [{ value: 'color', label: 'Brand colours' }, { value: 'mono', label: 'One colour (matches the site)' }] },
        { kind: 'select', key: 'tile', label: 'What the logo sits on', options: [{ value: 'white', label: 'A white tile' }, { value: 'glass', label: 'Frosted glass' }, { value: 'bare', label: 'Nothing (logo only)' }] },
        { kind: 'bool', key: 'glow', label: 'Glow in the brand colour on hover' },
      ] },
    ],
  },
  design: {
    title: 'Design', intro: 'Shape, spacing and finish for the whole site. Colours come from the season; dark mode is below.',
    blocks: [
      { title: 'Shape and feel', base: 'portfolio.design', fields: [
        { kind: 'select', key: 'radius', label: 'Corner roundness', options: [{ value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Very round' }] },
        { kind: 'select', key: 'buttons', label: 'Button shape', help: 'Applies to every button on the site.', options: [
          { value: 'pill', label: 'Pill (fully rounded)' }, { value: 'rounded', label: 'Rounded' }, { value: 'soft', label: 'Soft square (small corner)' }, { value: 'square', label: 'Square' },
          { value: 'pebble', label: 'Pebble (uneven, organic corners)' }, { value: 'tab', label: 'Tab (rounded on top only)' }, { value: 'cut', label: 'Cut corners (angled, like a badge)' },
          { value: 'slanted', label: 'Slanted (a leaning ticket)' }, { value: 'ticket', label: 'Ticket (notch on each side)' }, { value: 'perforated', label: 'Perforated (stamp edge)' },
          { value: 'airmail', label: 'Airmail border (red and blue stripes)' }, { value: 'hard', label: 'Hard shadow (flat offset shadow)' }, { value: 'outlined', label: 'Outlined only (fills on hover)' },
          { value: 'glass', label: 'Frosted glass' }, { value: 'arrow', label: 'Pill with arrow' }, { value: 'underline', label: 'Underlined text (no box)' },
        ] },
        { kind: 'select', key: 'density', label: 'Spacing', options: [{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }] },
        { kind: 'range', key: 'fontScale', label: 'Text size', min: 0.85, max: 1.3, step: 0.05, help: '1 is normal. Visitors can still zoom.' },
        { kind: 'select', key: 'shadow', label: 'Shadows', options: [{ value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'strong', label: 'Strong' }] },
        { kind: 'select', key: 'borderWeight', label: 'Outline weight', options: [{ value: 'thin', label: 'Thin' }, { value: 'normal', label: 'Normal' }, { value: 'bold', label: 'Bold' }] },
        { kind: 'select', key: 'headingCase', label: 'Headings', options: [{ value: 'normal', label: 'As written' }, { value: 'upper', label: 'Capitals' }] },
        { kind: 'select', key: 'cards', label: 'Cards', options: [{ value: 'soft', label: 'Soft shadow' }, { value: 'flat', label: 'Flat' }, { value: 'outlined', label: 'Outlined' }, { value: 'glass', label: 'Frosted glass' }] },
        { kind: 'select', key: 'dialogTransition', label: 'How pop-ups open', help: 'Applies to every pop-up: projects, pictures, service details and the phone menu. Visitors who prefer reduced motion see a plain appearance.', options: [
          { value: 'scale', label: 'Grow gently (fade and scale up)' }, { value: 'fade', label: 'Fade in' }, { value: 'zoom', label: 'Zoom with a little bounce' },
          { value: 'slide-up', label: 'Slide up' }, { value: 'slide-down', label: 'Slide down' }, { value: 'flip', label: 'Tilt forward' }, { value: 'none', label: 'No animation' },
        ] },
        { kind: 'select', key: 'dialogSpeed', label: 'How fast pop-ups open', options: [{ value: 'fast', label: 'Fast' }, { value: 'normal', label: 'Normal' }, { value: 'slow', label: 'Slow and smooth' }] },
        { kind: 'bool', key: 'readingProgress', label: 'Show the scroll progress surfer' },
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
      { title: 'Recommendations from visitors', base: 'portfolio.endorsements', fields: [
        { kind: 'bool', key: 'enabled', label: 'Let people you have worked with leave a recommendation', help: 'Adds a form to your Testimonials section. What people write goes to your Inbox, under Recommendations, and appears on the site only after you approve it and publish.' },
        { kind: 'text', key: 'heading', label: 'Heading' }, { kind: 'textarea', key: 'text', label: 'Text above the button' }, { kind: 'text', key: 'buttonLabel', label: 'Button text' },
        { kind: 'textarea', key: 'consentText', label: 'Consent wording', help: 'Shown next to a required tick box.' }, { kind: 'text', key: 'successMessage', label: 'Thank you message' },
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
    title: 'Quality Rules', intro: 'What counts as a complete project. The switches for counting visits are on the Visit Insights page.',
    blocks: [
      { title: 'Quality rules', base: 'portfolio.quality', fields: [
        { kind: 'number', key: 'minDescription', label: 'Shortest acceptable project description (characters)', min: 0, nullable: false },
        { kind: 'bool', key: 'requireCover', label: 'Every project needs a cover image' }, { kind: 'bool', key: 'requireAlt', label: 'Images need alt text' },
        { kind: 'bool', key: 'requirePeriod', label: 'Every project needs a year or period' }, { kind: 'bool', key: 'requireLink', label: 'Every project needs an external link' },
      ] },
    ],
  },
})

PAGES.hero.blocks.push({
  title: 'Hero circle (the water bubble behind the stamp)', base: 'portfolio.hero.orb',
  fields: [
    { kind: 'select', key: 'style', label: 'Style', options: [{ value: 'bubble', label: 'Water bubble' }, { value: 'sun', label: 'Soft sun glow' }, { value: 'glow', label: 'Diffuse glow' }, { value: 'ring', label: 'Thin ring' }, { value: 'none', label: 'None' }] },
    { kind: 'range', key: 'size', label: 'Size', min: 20, max: 110, step: 1, unit: ' vmin', help: 'vmin is a share of the screen\'s shorter side, so it scales on every device.' },
    { kind: 'range', key: 'x', label: 'Horizontal position', min: -10, max: 110, step: 1, unit: '%', help: '0 is the left edge, 100 the right edge.' },
    { kind: 'range', key: 'y', label: 'Vertical position', min: -10, max: 110, step: 1, unit: '%' },
    { kind: 'tone', key: 'color', label: 'Colour', help: 'Season default picks aqua for the bubble and the season glow for the others.' },
    { kind: 'range', key: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05 },
    { kind: 'range', key: 'rim', label: 'Rainbow sheen on the rim', min: 0, max: 1, step: 0.05, showIf: (o: any) => o.style === 'bubble' },
    { kind: 'bool', key: 'shine', label: 'Bright reflection in the top left', showIf: (o: any) => o.style === 'bubble' },
    { kind: 'range', key: 'blur', label: 'Frosted glass blur', min: 0, max: 20, step: 1, unit: 'px', showIf: (o: any) => o.style === 'bubble' },
    { kind: 'select', key: 'wobble', label: 'Wobble', options: [{ value: 'off', label: 'Still' }, { value: 'gentle', label: 'Gentle' }, { value: 'lively', label: 'Lively' }], showIf: (o: any) => o.style === 'bubble' },
    { kind: 'range', key: 'float', label: 'Up and down drift', min: 0, max: 60, step: 1, unit: 'px', help: '0 holds it still.' },
    { kind: 'range', key: 'parallax', label: 'Movement as the visitor scrolls', min: 0, max: 100, step: 5 },
    { kind: 'range', key: 'satellites', label: 'Small bubbles around it', min: 0, max: 8, step: 1, showIf: (o: any) => o.style === 'bubble' },
  ],
})

// A page for visitors to your business card, with a QR code and a button that saves your contact details.
PAGES.contact.blocks.push({
  title: 'Business card page (/card)', base: 'portfolio.card', fields: [
    { kind: 'bool', key: 'enabled', label: 'Turn on the business card page', help: 'A clean page at /card with your name, title and contact details, a QR code and a button that saves your details to a phone. Handy at events and on a printed card.' },
    { kind: 'bool', key: 'showQr', label: 'Show a QR code' },
    { kind: 'select', key: 'qrTarget', label: 'The QR code opens', options: [{ value: 'site', label: 'My website' }, { value: 'card', label: 'This card page' }], help: 'Needs your public website address under SEO.' },
    { kind: 'bool', key: 'showSocial', label: 'Show my social links' },
    { kind: 'textarea', key: 'note', label: 'A line under your name (optional)', placeholder: 'For example: Say hello at the event.' },
  ],
})
