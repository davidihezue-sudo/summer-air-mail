# Summer Air Mail

A four-season social media and digital marketing portfolio with a built-in admin. The public site is art-directed (a 3D postage stamp hero, seasonal artwork, Polaroids, case studies with evidence). The admin at `/admin` lets the owner change almost everything without touching code.

- **Four seasons plus Auto.** Spring, Summer (the original design, unchanged), Autumn, Winter. Auto follows the visitor's date, and you choose the start date of each season.
- **Real admin.** Sign-in with a hashed password, private drafts, preview on desktop, tablet and mobile in any season, one-click publish, version history, media library.
- **Proof of work.** Projects are built from content blocks, case studies are structured, results carry a start, an end, a period and a label saying who produced them.
- **No invented content.** Nothing is shown unless the owner switches it on. There are no fake projects, clients, testimonials, tools or statistics.

## Contents

1. [Quick start](#quick-start)
2. [Signing in to the admin](#signing-in-to-the-admin)
3. [Using the admin](#using-the-admin)
4. [Seasons](#seasons)
5. [Professional intensity](#professional-intensity)
6. [Deploying](#deploying)
7. [How it is built](#how-it-is-built)
8. [Security](#security)
9. [Testing](#testing)
10. [Known limits](#known-limits)

---

## Quick start

You need Node.js 22 or newer.

```bash
npm install

# 1. Create your admin login (asks for a username and a password of at least 12 characters)
npm run admin:setup

# 2. Start the site and the admin together
npm run dev:all
```

Open <http://localhost:5173> for the site and <http://localhost:5173/admin> for the admin.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run dev:all` | API server (port 8787) and Vite dev server (port 5173) together |
| `npm run dev:phone` | Same as `dev:all`, but also reachable from your phone on the same Wi-Fi (prints the addresses to open) |
| `npm run dev` | Vite only. The site works with the built-in starter content; the admin needs the API server |
| `npm run dev:server` | API server only, restarting on changes |
| `npm run build` | Type-check and build the production site into `dist/` |
| `npm start` | Production server: serves `dist/` and the API on port 8787 |
| `npm run check` | Type-check, lint, unit tests and build |
| `npm test` | Unit and server tests |
| `npm run images` | Convert JPG/PNG in `public/images` to WebP |
| `npm run smoke` | Browser checks of the public site (needs `npm run build` and `npm run dev` running) |
| `npm run smoke:admin` | Browser checks of the whole admin workflow (needs `npm run build`) |
| `npm run a11y` | axe-core accessibility audit of the site and the admin (needs `npm run build` and `npm run dev`) |
| `npm run admin:hash` | Prints `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` for hosts without a disk |

Browser checks use the Chromium that Playwright installed. Point them at it with `CHROME=/path/to/chromium npm run smoke`.

**On your phone.** Run `npm run dev:phone`, then open the address it prints (for example `http://192.168.1.20:5173`, and `/admin` after it) in your phone's browser. The phone must be on the same Wi-Fi. If Windows asks about the firewall, allow Node.js on private networks. Sign in to the admin with the same username and password.

To preview every section with clearly labelled sample data while developing, open `http://localhost:5173/?sample=1`. Sample data exists only in the dev server and is never part of a production build.

## Signing in to the admin

The admin needs the Node server. It does not work on static-only hosting (Netlify static, GitHub Pages) because it saves your content and uploads on the server.

1. Run `npm run admin:setup` on the machine that runs the site. Your password is hashed with scrypt and stored in `data/admin.json`. The plain password is never stored.
2. Visit `/admin` and sign in.
3. Wrong passwords are rate limited (5 per 15 minutes per address). Sessions last 8 hours.
4. Change your password under **Advanced Settings**, or run `npm run admin:setup` again.

If your host has no persistent disk for `admin.json`, run `npm run admin:hash` and set the two environment variables it prints.

## Using the admin

Edits save automatically as a **private draft**. Nothing is public until you press **Publish**. Use **Preview** (top bar) to see the draft as a visitor would, or **Preview & Publish** for desktop, tablet and mobile views in any season.

| Admin page | What you manage |
| --- | --- |
| Dashboard | Counts, publishing status, current theme, and a list of what still needs attention |
| Personal Profile | Name, title, roles, summary, location, contact details, photo, availability, language and currency |
| About & Recruiter Overview | Biography, highlights, statistics (empty ones stay hidden), competencies, education, certifications, employment |
| Hero | Headline, supporting line, label, buttons, layout, alignment, scroll effect, portrait cut-out |
| Resume / CV | Upload your CV. The Download CV buttons appear only when a file is set and enabled |
| Social Links, Contact | Links, email, WhatsApp, availability (full-time, contract, remote and so on), recruiter questions |
| Appearance | Professional intensity, maximum animation, fonts |
| Seasons | Mode, season start dates, transition, per-season colours, decorations, fonts, images and a live preview |
| Sections & Visibility | Drag to reorder, switch on or off, rename, change headings, colours and images, duplicate, add text sections |
| Navigation | Automatic or custom menu with your own labels, order and links |
| Portfolio, Case Studies, Campaigns | Projects with images, videos, links, metrics, charts, before and after, documents and a full case study |
| Social Media Content, Videos & Reels | Posts, carousels, reels and videos (upload, YouTube or Vimeo) |
| Screenshots | Evidence gallery with zoom, captions, categories and before and after |
| Analytics & Results | Metrics with start, end, period, platform, campaign, chart type and result label |
| Websites & Digital Projects | Laptop mockups with screenshots |
| Services, Skills, Platform Expertise | What you offer and know, described in words (never percentage bars) |
| Tools & Platforms, AI & Automation | Only what you genuinely use |
| Marketing Process, Strategy Framework | How you work |
| Testimonials, Mentoring & Training | Shown only when approved or switched on |
| Media Library | Every upload with alt text, caption, tags and project links |
| SEO, Analytics Tracking, Footer, Advanced | Search and sharing, optional trackers, footer, password, backups |

### How to...

**Add a project.** Portfolio > Add project. Fill in the basics, choose a cover image, switch on **Published**. Add content blocks to tell the story: headings, text, images, galleries, videos, reels, screenshots, links, quotes, metrics, charts, before and after, PDFs and downloads, timelines, frameworks, skills and platforms. A project can be one image and a link, or a long story.

**Write a case study.** Open a project and switch on **This project has a case study**. Fill in the sections you have: challenge, objectives, audience, strategy, execution, creative, distribution, paid media, results, your contribution and lessons. Empty sections are not shown. Always include the measurement period with results.

**Add a result.** Analytics & Results > Add result. Enter the metric, the starting value, the ending value and the period. A percentage appears only if you enter it or if both start and end exist; the card says which. Label it **Verified**, **Team**, **Individual**, **Confidential** or **Illustrative**. For confidential numbers, write approved wording and switch off **Show the numbers**.

**Add a video or reel.** Videos & Reels > Add video. Upload an MP4 or WebM, or paste a YouTube or Vimeo link. Nothing autoplays and nothing loads until a visitor presses play. Instagram and TikTok links open as link cards, because those sites cannot be safely embedded.

**Hide client details in a screenshot.** Leave **Review images for sensitive information before uploading** ticked in the Media Library. Drag over names, numbers or faces and choose Pixelate or Black box. The detail is destroyed in the saved pixels, not just covered on screen. For files already uploaded, open the file and choose **Hide parts**.

**Reuse an image.** Upload once to the Media Library, then choose it from any image field. Nothing is uploaded twice. A file in use cannot be deleted.

**Reorder or hide sections.** Sections & Visibility. Drag, or use the arrows. A section that is on but has no content stays hidden and is marked "Waiting for content".

**Change a heading, colour or image for one section.** Open the section row. Leave a field empty to use the default for the current season.

**Change the menu.** Navigation > Custom. Links to hidden sections are skipped automatically, so there are no broken links.

**Change colours.** Seasons > pick a season > Colours. Readable text colours are worked out from your choices.

**Update the CV.** Resume / CV > choose the PDF. Every button updates.

**Set SEO.** SEO > fill in the title, description and sharing image, and set your public website address. These are written into the HTML for search engines when you publish. Keep **Allow indexing** selected unless the site is private.

**Back up.** Preview & Publish > Download backup. Also back up the `data/` folder, which holds uploaded files.

**Go back to an earlier version.** Preview & Publish > Earlier versions > Restore to draft, then Publish.

## Seasons

Open **Seasons** in the admin.

- **Mode:** Auto, Spring, Summer, Autumn or Winter. Auto decides from the visitor's own date.
- **Start dates:** each season starts on its date and lasts until the next one starts. Defaults are 20 March, 21 June, 22 September and 21 December. There is a Southern Hemisphere preset. Invalid or duplicate dates are flagged, and the site falls back to the defaults so it never has no season.
- **Transition:** none, immediate, fade or crossfade (used when the season changes while a page is open, and in the preview).
- **Per season:** colours, decorations (petals, leaves, snow, stars, frost, glow and so on), animation intensity, optional fonts, paper texture, a hero portrait, hero decorative image, hero background image and a decorative image.

Each season has its own palette, stamp artwork, hero lighting, section divider shape, services surface and objects, night-reveal effect and decorations. Summer keeps the original colours exactly.

The seasonal themes live in `src/themes/` (`spring.ts`, `summer.ts`, `autumn.ts`, `winter.ts`, `seasonManager.ts`). They change design tokens; the layout and typography stay the same.

## Professional intensity

Appearance > **Professional intensity** lets one portfolio serve different applications.

| Setting | What changes |
| --- | --- |
| Creative | All decoration and motion, including the cursor trail |
| Balanced (default) | Same personality, calmer motion, no cursor trail |
| Professional | No particles, no night reveal, no floating, no swinging Polaroids, services as clean cards, plain section titles ("Selected work", "Services") |

Motion is also capped by the **Maximum animation** setting, by each season's intensity, and by the visitor's own "reduce motion" preference, which always wins.

## Deploying

The site is a Node server that serves the built site, the API and the uploads. Deploy it anywhere that runs Node 22: Render, Railway, Fly.io, a VPS, or Docker.

```bash
npm ci
npm run build
npm run admin:setup      # once, on the server
NODE_ENV=production npm start
```

**Persistent storage is essential.** Content, the admin login and uploads live in `DATA_DIR` (default `./data`). Mount a persistent disk there and back it up. On hosts with ephemeral disks your edits would be lost on every deploy.

Environment variables are listed in `.env.example`. The ones you will usually set:

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on (most hosts set it for you) |
| `DATA_DIR` | Folder for `content.json`, `admin.json` and `uploads/` |
| `TRUST_PROXY=1` | Behind a proxy or platform load balancer, so HTTPS and client addresses are detected |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` | Admin login without a disk file. Make the hash with `npm run admin:hash` |

HTTPS is required in production. The session cookie is `HttpOnly` and `SameSite=Strict`, and gets the `Secure` flag automatically over HTTPS.

**Docker.** A `Dockerfile` is included (it was not built in the authoring environment, so test it first). Mount a volume at `/data`.

**Static-only hosting.** `dist/` also works on a static host and shows the starter content from `src/content`, but there is no admin and no persistence. `public/_headers` carries the security headers for Netlify and Cloudflare Pages.

Before you launch: set your public website address and sharing image under **SEO**, upload your CV, add your portrait cut-out, and press **Publish**.

## How it is built

```
src/
  admin/            Admin app: login, shell, form engine (fields.tsx), schema (schema.ts), pages, media library
  components/       Public site sections (hero, about, services, projects, case-studies, results, skills, tools, ...)
  content/          Types, starter content, selectors (visibility, navigation, filters), normalisation
  hooks/            Content, theme and motion providers, scroll and pointer hooks
  motion/           One place that decides how much motion is allowed
  themes/           Spring, Summer, Autumn, Winter and the season manager
  styles/           base.css, hero.css, sections.css, seasons.css
  utils/            Links, validation, SEO helpers, analytics loader
server/             Express API: auth, draft and publish store, media, validation, public view
shared/             Head tags, robots, sitemap and Content-Security-Policy builders (used by build, server and browser)
scripts/            Admin setup, image conversion, browser and accessibility checks
tests/              Unit and server tests
```

**Content flow.** Everything the site shows comes from one `SiteContent` object. In the browser it is the published copy (embedded in the page by the server), or the starter content in `src/content` if nothing is published. The admin edits a private draft held on the server. Publishing copies the draft to the published copy. Visitors only ever receive a filtered view: drafts, hidden items, unapproved testimonials, unconfirmed tools and hidden skills are removed on the server before the content is sent.

**Admin form engine.** Every admin page is described by data in `src/admin/schema.ts` (field type, label, help). To add a field to a project, add one line there and one optional property in `src/content/types.ts`. Block types are in `src/admin/blocks.tsx` and `src/content/factories.ts`.

**Storage.** Content is stored in one JSON file (`data/content.json`) with atomic writes, a backup copy and the last 20 published versions. That is reliable for one server and one editor. See [Known limits](#known-limits) for moving to a database.

**Performance.** Lighthouse on the production build (throttled mobile / desktop): Performance 93 / 99, Accessibility 100 / 100, Best Practices 100 / 100, SEO 100 / 100. Responses are gzip compressed, sections below the first screen are code split, project views and the image viewer load on first use, fonts are self-hosted, uploaded photos are resized and converted to WebP, and videos load only when played.

**Fonts.** Italiana, Pinyon Script and Figtree, self-hosted through Fontsource.

## Security

- **Authentication.** scrypt-hashed password, random server-side sessions, `HttpOnly` + `SameSite=Strict` cookie, login rate limiting, constant-time comparison. No password is ever stored in plain text, and no fake or client-only login exists.
- **Request protection.** Every change needs a custom header that other websites cannot send, plus an origin check, on top of `SameSite=Strict`.
- **Private data.** All admin routes require a session. Drafts and hidden items are never sent to visitors.
- **Uploads.** Files are identified by content, not by name. JPG, PNG, WebP, GIF, MP4, WebM and PDF are accepted; SVG, HTML and everything else are refused. Photos are re-encoded (this removes location data). Uploads are served with `nosniff` and a sandboxing policy. Uploaded files are public to anyone who has the exact link; names are random.
- **Content.** The server validates every save: size and depth limits, no `javascript:` links, no prototype pollution keys, unique ids. The browser renders text through React and a small safe formatter, never through raw HTML, and only allows `http`, `https`, `mailto` and `tel` links.
- **Headers.** The server sends a Content-Security-Policy that allows trackers only if you have switched them on. `frame-src` allows only your own site (for the preview) and YouTube and Vimeo.
- **Analytics.** Off by default. Only correctly formatted IDs are accepted. When consent is required, trackers load only after the visitor agrees, and Do Not Track and Global Privacy Control are respected.
- **Secrets.** The browser code contains no keys or secrets. The contact form sends nothing to a server; it opens the visitor's email app or WhatsApp with a drafted message and says so.

## Testing

```bash
npm run check                         # type-check, lint, unit and server tests, build
npm run build && npm run smoke:admin  # the admin workflow in a real browser
npm run dev                           # then, in another terminal:
npm run smoke                         # public site: 8 widths, seasons, interactions, reduced motion
npm run a11y                          # axe-core on the site (all seasons, desktop and mobile) and every admin page
```

Covered by tests: season detection on and around every boundary (including Southern Hemisphere dates and invalid dates), colour contrast of every season's palette, the motion plan, section ordering and visibility, empty states, navigation without broken links, SEO and CSP output, writing rules (no em dashes, no banned fonts, no fabricated defaults), password hashing, access control on every admin route, CSRF protection, lockout, draft and publish, private content filtering, upload safety, and the full admin workflow through publishing to the live site.

## Known limits

- **One server, one editor.** The JSON file store has no locking across several servers. If you need several editors or several servers, replace `server/store.mjs` and `server/media.mjs` with a database (PostgreSQL) and object storage (S3 compatible); the API and the front end do not change. A second tab saving over the first is detected and refused.
- **One admin account.** There is one login, not a user system with roles.
- **Sessions are in memory.** Restarting the server signs you out.
- **Uploaded files are public by link.** They are not drafts. Do not upload anything that must stay confidential; use **Hide parts** on screenshots first.
- **Instagram and TikTok are link cards, not embeds.** Their embed scripts cannot be loaded under a strict security policy. YouTube and Vimeo play in the page after a click.
- **The Dockerfile has not been run** in the environment this was built in.
- **Lighthouse and browser checks** were run in headless Chromium. Device motion tilt on a real phone and Safari rendering were not tested.
- **Spelling variants** (UK, Canada, US) apply to the few built-in interface words and number and currency formats. Your own text is shown exactly as you write it.
