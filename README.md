# Summer Air Mail

A premium, static portfolio website for a social media manager and digital marketer. Built with React, TypeScript and Vite. The concept is a summer editorial magazine meets a vintage airmail stamp: a 3D postage stamp hero, a "Night Tide" reveal, a beach towel of services, Polaroids on a rope, case studies with measured results and an honest enquiry form.

There is no backend. All content lives in a few TypeScript files, so everything can be edited without touching components.

## Run it

```bash
npm install
npm run dev        # development server at http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build at http://localhost:4173
npm test           # unit tests (content rules, links, validation, writing rules)
npm run lint       # eslint
npm run images     # convert public/images JPG/PNG to WebP
npm run smoke      # browser end to end checks (needs dev + preview running, see below)
```

Preview every section with clearly labelled sample data while developing: open `http://localhost:5173/?sample=1`. Sample data exists only in the dev server and is never included in a production build.

## What shows up when

Sections only render when they have real content, so nothing is ever an empty placeholder.

| Section | Appears when |
| --- | --- |
| Hero, About, Services, Strategy, Contact | On by default |
| At a glance (recruiter overview) | `recruiter` lists have entries |
| Work (Polaroids) | `src/content/projects.ts` has projects |
| Case studies | at least one project has a `caseStudy` |
| Tools | at least one tool has `confirmed: true` and a real `usage` |
| Content gallery | `src/content/contentItems.ts` has items |
| Websites | `src/content/websites.ts` has items |
| Testimonials | at least one testimonial has `approved: true` |
| Mentoring | `sections.showMentoring: true` and a real overview |

Every section also has a switch in `portfolio.config.ts` under `sections` (for example `showWork: false`). Anything in `[square brackets]` is a visible placeholder. Empty strings and `null` values hide links, images and statistics automatically.

## Edit your content

| I want to... | Edit |
| --- | --- |
| Change name, roles, bio, contact details, social links, CV, availability | `src/content/portfolio.config.ts` under `profile` |
| Set spelling locale and currency | `site.locale` (`en-GB`, `en-CA`, `en-US`) and `site.currency` (`GBP`, `CAD`...) |
| Add statistics | `stats` (value `null` or `0` is hidden). `yearsExperience` feeds a statistic automatically |
| Set recruiter overview, education, certifications, employment | `recruiter` |
| Change budget ranges and enquiry types | `contact` |
| Edit, hide, reorder services | `src/content/services.ts` (`hidden: true` hides, array order is display order) |
| Add projects and case studies | `src/content/projects.ts` |
| Mark real tools | `src/content/tools.ts` (set `confirmed: true`, write a truthful `usage`) |
| Add testimonials | `src/content/testimonials.ts` (only with permission, `approved: true`) |
| Add reels, TikToks, carousels | `src/content/contentItems.ts` |
| Add website projects | `src/content/websites.ts` |
| Edit the strategy framework | `strategy` in `portfolio.config.ts` (keep the "Sample framework" label unless it is a real client plan) |
| Turn mentoring on | `sections.showMentoring: true` and fill `mentoring` |

### Photographs and the hero stamp

Put files in `public/images/` and reference them with a leading slash.

```ts
heroCutout:  { src: '/images/portrait-cutout.webp', alt: 'Name smiling in a straw hat', width: 900, height: 1200 },
heroFlowers: { src: '/images/sunflowers.webp',      alt: '', width: 420, height: 540 },
profilePhoto:{ src: '/images/profile.webp',         alt: 'Name at a desk', width: 1000, height: 1250 },
```

- `heroCutout` is a transparent PNG or WebP of you. Your real photograph is used as supplied; no lookalike is ever generated. Until it is set, a clearly labelled placeholder silhouette shows.
- `heroFlowers` is an optional transparent flower image. A built-in sunflower illustration is used if empty.
- Always provide `width` and `height` to prevent layout shift.
- Run `npm run images` to convert JPG/PNG to WebP (transparency kept, max 2000px wide), then reference the `.webp` files.

### Adding a project

```ts
{
  id: 'brand-launch',
  title: 'Spring Launch Campaign',
  client: 'Brand Name',
  industry: 'Hospitality',
  category: 'Campaigns',             // becomes a filter automatically
  description: 'One honest sentence.',
  year: '2025',
  period: 'Mar to Jun 2025',
  platforms: ['instagram', 'tiktok'],
  role: 'Social media lead',
  thumbnail: { src: '/images/projects/launch.webp', alt: 'Launch reel cover', width: 800, height: 800 },
  media: [{ type: 'image', src: '/images/projects/launch-1.webp', alt: '...' },
          { type: 'video', src: '/videos/launch.mp4', poster: '/images/projects/launch.webp', alt: '...' }],
  externalLink: 'https://example.com',
  caseStudy: { /* see below */ },
}
```

### Adding a case study

Add a `caseStudy` object to any project. Only the structure is required; every metric needs a measurement `period` and should include a `baseline` when you have one. Results are labelled as change during the period, not as proof of sole cause.

```ts
caseStudy: {
  objective: 'What the client wanted.',
  challenge: 'The situation.',
  objectives: ['Increase enquiries from Instagram'],
  strategy: 'The thinking.',
  execution: ['Built a 12 week content calendar', 'Produced 24 reels'],
  deliverables: ['Content calendar', 'Reel series'],
  metrics: [{ label: 'Engagement rate', baseline: 2.1, result: 4.6, unit: '%', period: 'Jan to Jun 2025' }],
  confidentialResults: 'Approved wording if numbers cannot be shared.',
  contribution: { personal: ['Strategy and scripts'], team: ['Photography by the agency'] },
  lessons: ['Short opening hooks beat long intros for this audience.'],
}
```

### Colours, fonts, motion

`theme` in `portfolio.config.ts` controls the whole palette (written to CSS variables on load), the three font stacks, `borderStyle`, `animationIntensity` (`'full' | 'subtle' | 'off'`) and the optional `bubbleCursor`. Fonts (Italiana, Pinyon Script, Figtree) are self-hosted through Fontsource, so there are no third party font requests.

### CV

Copy your file to `public/documents/` and set `profile.cvFile: '/documents/your-cv.pdf'`. The Download CV buttons appear only when a file is configured.

### WhatsApp and email

Set `profile.whatsapp` in international format (for example `'+447700900123'`) and `profile.email`. The form offers whichever are configured:

- Email opens the visitor's email app with a drafted, correctly encoded message.
- WhatsApp opens `wa.me` with the message encoded.

Nothing is submitted to a server and the interface says so plainly. If neither is configured, a note explains how to enable the form.

## Behaviour notes

- **Loader:** about 1.4 seconds, once per session, skipped for reduced motion.
- **Hero:** four layers (stamp background, frame, flowers, your cut-out) with tilt towards the pointer, idle float, moving light reflection, tap reaction, finger drag on touch, and a "Tilt with my phone" button that asks for device motion permission only when pressed. The hero breakout is driven by a single scroll listener writing one CSS variable.
- **Night Tide:** circular reveal following the cursor; on touch devices it needs a held finger, and the canvas water is disabled on touch.
- **Services towel:** objects can be dragged on desktop; on touch they are plain buttons so scrolling is never blocked. Every object is a keyboard-accessible button that opens a detail dialog.
- **Accessibility:** native `<dialog>` modals, visible focus, skip link, reduced motion support, 44px touch targets, nothing essential depends on hover.
- **Security:** no API keys, no `dangerouslySetInnerHTML`, link protocols are allow-listed, external links use `rel="noopener noreferrer"`, and `index.html` ships a Content Security Policy.

## Deploy

```bash
npm run build
```

Upload the `dist/` folder to any static host.

- **Netlify or Cloudflare Pages:** build command `npm run build`, publish directory `dist`. `public/_headers` sets security and cache headers.
- **Vercel:** framework preset Vite. `vercel.json` sets headers.
- **GitHub Pages:** works with the default root path. For a project subpath, set `base` in `vite.config.ts`.

Before launch set `site.url` (for example `'https://yourname.com'`) so the canonical URL, social previews, JSON-LD, `sitemap.xml` and `robots.txt` are correct, and add a 1200x630 image at `public/images/og.webp` with `site.ogImage: '/images/og.webp'`.

## Browser checks

```bash
npm run dev &
npm run build && npm run preview &
CHROME=/path/to/chromium npm run smoke
```

The smoke test covers eight widths (320 to 1920) for horizontal overflow and console errors, hidden-section behaviour, navigation, dialogs, filters, gallery keyboard control, case studies, form validation, WhatsApp encoding, the mobile drawer and reduced motion.

## Project structure

```
src/
  content/       portfolio.config.ts, projects.ts, services.ts, tools.ts, testimonials.ts, ...
  components/    layout, hero, about, services, projects, case-studies, tools,
                 content-gallery, strategy, websites, testimonials, mentoring, contact, footer, ui
  hooks/         motion, media queries, scroll variable, stage interaction
  styles/        base.css, hero.css, sections.css
  utils/         text/links/validation, seo, theme, navigation
public/          images, videos, documents, headers
scripts/         optimize-images.mjs, smoke.mjs
tests/           unit tests
```
