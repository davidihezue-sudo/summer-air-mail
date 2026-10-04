# Summer Air Mail

A four-season social media and digital marketing portfolio with a built-in admin. The public site is art-directed (a 3D postage stamp hero, seasonal artwork, Polaroids, case studies with evidence). The admin at `/admin` lets the owner change almost everything without touching code.

- **Four seasons plus Auto.** Spring, Summer (the original design, unchanged), Autumn, Winter. Auto follows the visitor's date, and you choose the start date of each season.
- **Real admin.** Sign-in with a hashed password, private drafts, preview on desktop, tablet and mobile in any season, one-click publish, version history, media library.
- **Proof of work.** Projects are built from content blocks, case studies are structured, results carry a start, an end, a period and a label saying who produced them.
- **No invented content.** Nothing is shown unless the owner switches it on. There are no fake projects, clients, testimonials, tools or statistics.
- **Version 3 adds** a customizable cursor effect, dark mode, a design panel, private application links, a one page printable profile, a contact form that really sends, a messages inbox, privacy friendly visit counts, notes with an RSS feed, languages, scheduled changes, saved looks, a team with roles, backups, and optional Postgres storage. See [What is new in version 3](#what-is-new-in-version-3).

## Contents

1. [Quick start](#quick-start)
2. [Signing in to the admin](#signing-in-to-the-admin)
3. [Using the admin](#using-the-admin)
4. [Seasons](#seasons)
5. [Professional intensity](#professional-intensity)
6. [What is new in version 3](#what-is-new-in-version-3)
7. [Keeping your work safe](#keeping-your-work-safe)
8. [Putting the site online at your own address](#putting-the-site-online-at-your-own-address)
9. [Deploying](#deploying)
10. [How it is built](#how-it-is-built)
11. [Security](#security)
12. [Testing](#testing)
13. [Known limits](#known-limits)

---

## Quick start

**Everyday use, one command:** `npm run go` gets the latest code from GitHub, installs anything new, and starts the site so your phone (on the same Wi-Fi) can open it too. It prints the phone addresses. Use it every time.

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

## What is new in version 3

Everything below is controlled from the admin. Nothing is on unless you switch it on, and nothing is invented.

| Feature | Where to find it | What it does |
| --- | --- | --- |
| Tools with logos | Capabilities > Tools & Platforms, Tools Display | Every tool you switch on shows its logo, name, category and how you use it, with no clicking. Well known tools get their logo automatically; otherwise upload one, paste a link, or choose a built-in mark. Cards, compact chips or the original flip rings; sizes, brand or single colour, grouping. Logos also show in the admin list where you switch tools on and off. |
| Admin search | Top bar of the admin (press `/` or Ctrl+K) | Start typing and matches appear: pages, individual settings, and the things you wrote (projects, tools, notes...). It understands everyday words ("dark mode", "logo", "backup", "password"). Pick with the arrow keys and Enter; for a setting it opens the page, scrolls to the setting and highlights it. |
| Toolkit redesign | Capabilities > Tools Display | Six layouts: cards, logo wall (logos only, names on hover or shown), list (logo with description beside it), compact, a slow scrolling strip, and the original rings. Category tabs with counts, logo size and tile (white, frosted or none), brand or single colour logos, hover glow in each brand's colour. |
| Pictures and screenshots | Portfolio > Pictures & Screenshots | Instagram, TikTok, YouTube, LinkedIn and Pinterest pictures are all different shapes. By default every card follows its own picture, so a tall phone screenshot is shown whole with a soft blurred fill. Force a shape for the whole site or per project, choose smart/whole/trim, and show screenshots as a masonry or even grid. Screenshot size (small, medium or large, for the whole site or per screenshot) only changes how big a picture appears. Its shape and sharpness stay the same, and visitors can still zoom in to the full picture. |
| Big video upload | Media Library | Videos up to 2 GB (MP4, MOV, WebM, MKV, AVI) upload with a progress bar, then are shrunk automatically to a web friendly 1080p MP4 with a cover image. Needs no setup: ffmpeg comes with `npm install`. Set `MAX_VIDEO_MB` to change the limit. |
| Extras | Look and layout > Extras | Pulsing availability badge, previous and next project buttons, back to top, copy email, a strip of brands you have worked with (built only from your real projects), minutes to read on notes. |
| Hero water bubble | Identity > Hero > Hero circle | The circle behind the stamp is now a glassy water bubble with a rainbow rim and reflection. Style, size, position, colour, opacity, sheen, frosted blur, wobble, drift, scroll movement and small satellite bubbles are all adjustable. |
| Per card customization | Portfolio, Testimonials, Results, Design | Each project has a card label and accent colour; testimonials and results have an accent colour; Design > Cards switches every card between soft, flat, outlined and frosted glass. |
| Cursor effect | Look and layout > Cursor effect | 14 styles (bubbles, water drop, ripples, ring, circle, blob, spotlight, halo, comet, sparkles, crosshair, seasonal, emoji, your own image), size, colour, opacity, smoothing, trail length, blend, where it shows, which professional modes allow it, tap ripple on touch screens. Also sets the hero reveal circle size. Live preview as you edit. |
| Clickable strategy notes | Capabilities > Strategy Framework | Each sticky note says "Tap to open", with an Open all button and an editable hint line. |
| Design | Look and layout > Design | Corner roundness, button shape, spacing, text size, shadows, outline weight, heading case, pop-up animation, scroll progress. |
| Dark mode | Design > Light and dark | Always light, always dark, or follow the visitor's device, with an optional visitor switch. Every season gets a dark version derived from its own colours, and every pairing is contrast tested. |
| Section styling | Sections & Visibility > any section | Spacing, edge shape, background pattern, width, and the arrangement (grid, list, carousel) for testimonials, notes and journey. |
| Saved looks | Look and layout > Saved Looks | Save the current professional intensity, season setting, design and hero layout; apply in one click. |
| Application links | Reach and engagement > Application Links | A private `/for/<code>` version of the site for one employer: its own hero words, welcome note, projects first, hidden sections, look, season and CV. Never listed, noindex, can expire, and never part of the public data. |
| One page profile | One Page Profile | `/profile`: a clean summary that prints to A4 or saves as a PDF with the browser's Print dialog. You choose what it includes. |
| Short links | Short Links | `/go/cv` style addresses that redirect on the server. |
| Notes | Notes (blog) | Articles at `/notes/<address>` with their own share preview, an RSS feed at `/feed.xml` and sitemap entries. |
| Career journey, Resources | Career Journey, Resources | A timeline and a downloads section. Hidden until they have real entries. |
| Booking and newsletter | Booking & Newsletter | A booking button in the hero, header, contact and profile. A newsletter signup that either collects addresses on your server (with a consent tick box) or sends people to your newsletter service. |
| Contact form | Identity > Contact | Choose: open the visitor's email or WhatsApp, or send to your inbox here (with fallback to email). A hidden honeypot field, a minimum fill time and a rate limit stop most bots. |
| Inbox and subscribers | Messages and insight | Read, mark, reply, delete, export to CSV. Optional email and webhook alerts. Old messages can be deleted automatically. |
| Visit insights | Messages and insight > Visit Insights | Cookieless, first party counts of visitors and views per day, top pages, sources, project opens, downloads and shares. No IP address, cookie or profile is stored. Your own visits while signed in are ignored. |
| Banner and schedule | Banner & Schedule | An announcement bar with a date window, plus rules that switch season, professional intensity, availability, hero words, sections and a banner on and off by themselves on dates you set. |
| Maintenance and 404 | Maintenance & 404 | A "back soon" page (optionally a proper 503) while you are signed in you still see the site, and your own 404 page. |
| Languages | Languages | Add languages, translate your own text field by field and the interface labels, with right to left support and a header switcher. |
| Share links | Portfolio | Every project has its own address (`/work/<id>`), a copy link button, and its own share preview. The back button closes the project. |
| Case study highlight | Case Studies > Highlight strip | Feature one of your own measured results as a headline strip on the case study card. |
| Testimonials | Testimonials | Optional video recommendation (plays only on click) and a carousel layout. |
| Quality score | Messages and insight > Quality Score | A checklist scored from your real content, using rules you set. |
| Bulk tools and CSV | Tools > Bulk & CSV | Publish, hide or delete many items; export and import projects, results, testimonials, services, journey and notes as CSV. Imports only ever create new drafts. |
| Alt text assistant | Tools > Alt Text Assistant | Finds every image without alt text and helps you write it. It suggests a starting point from where the image is used; you describe what is actually shown. |
| Undo for one item | Any item > History | Earlier versions of a single project, result, note and so on, with Restore. |
| Team and roles | Tools > Team & Access | Owner, editor and viewer, enforced on the server. A setting decides whether editors may publish. |
| Backups | Tools > Server & Backups | A zip of your content, messages, subscribers, insights, media list and uploads, on a schedule and on demand, optionally uploaded to S3 compatible storage. |

### Storage: files or Postgres

By default everything is stored as JSON files in `DATA_DIR`. Set `DATABASE_URL` to keep content, the admin login, messages, subscribers, insights, snapshots and settings in Postgres instead (a single table, `sam_kv`, created automatically). Uploaded images and files stay in `DATA_DIR`, so mount a persistent disk there either way. Backups, roles and every feature behave the same on both. The server tests run against both when `TEST_DATABASE_URL` is set.

`npm run admin:setup` writes the owner login to whichever store `DATABASE_URL` selects.

### Email, webhooks and backups

Secrets are never kept in the admin. Set them as environment variables (see `.env.example`): `SMTP_*` for email alerts, `ALERT_WEBHOOK_URL` for Slack, Discord or Zapier, and `S3_*` for off-site backups. The admin shows only whether each is configured. S3 uploads use a small hand written Signature V4 signer that is tested against Amazon's published example; it has not been run against a live bucket in the authoring environment, so make one backup and check that the object appears before relying on it.

## Keeping your work safe

**Why things disappeared.** Before version 3.1 your content lived in a `data` folder inside the project folder. A new zip unzipped into a new folder starts with an empty `data` folder, so the site (and the admin login) started from scratch. Your old work is still in the *old* folder's `data` directory.

**What changed.**
- Without a database, uploads and records now live in a folder called `.summer-air-mail` in your home directory (for example `C:\Users\you\.summer-air-mail`), outside the project. Unzipping a new version anywhere keeps your work. If a `data` folder already exists in the project, that is used instead.
- Automatic daily backups are on by default (Admin > Tools > Server & Backups), and you can download one at any time.
- The server prints where it is storing your work every time it starts, and the dashboard reminds you while you are on file storage.
- A `.env` file in the project folder is now read automatically, so you can set `DATABASE_URL` once and forget it.

**Get your old work back.** In PowerShell, from the new project folder:

```powershell
npm run data:import -- "C:\path\to\old-project-folder\data"
npm run admin:setup        # only if you also want to reset the admin password
```

**Use a database so this can never happen again (recommended).**

1. Make a free Postgres database. Easiest: sign up at neon.tech (or supabase.com), create a project, and copy the connection string. It looks like `postgres://user:password@host/dbname?sslmode=require`.
   Prefer local? Install Docker Desktop and run `npm run db:up`, then use `postgres://sam:sam@localhost:5432/summer_air_mail`.
2. Copy `.env.example` to `.env` and add one line: `DATABASE_URL=...your connection string...`
3. Create the admin login in that database: `npm run admin:setup`
4. If you have old work, run the `data:import` command above now.
5. Start the site: `npm run dev:all`. It should print `Storing your content in: Postgres database`.

Content, messages, subscribers, visit counts, settings and the admin login are then in the database, not on your computer. Uploaded images and files stay in the `.summer-air-mail` folder (or `DATA_DIR`); the backup zip includes them.

**Can not sign in?** Run `npm run admin:setup` again in the project folder. It sets (or resets) the owner username and password in whichever place is in use. The most common cause is a fresh folder with no account yet.

**Putting the code on GitHub.** From the project folder in PowerShell:

```powershell
git init
git add .
git commit -m "Summer Air Mail"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/summer-air-mail.git
git push -u origin main
```

`.gitignore` already keeps `node_modules`, `data` and `.env` (your secrets and database address) out of GitHub. GitHub stores the code; your content lives in your database.

## Putting the site online at your own address

The site needs a host that runs Node (GitHub cannot run it). These steps use **Render** to run it and **Neon** for the database, with your own domain. Budget about $7 a month for Render plus a few cents for the disk; Neon's free plan is enough.

**1. Database (5 minutes).** At neon.tech make a project and copy the connection string (Connect, then Show password). Keep it for step 3 and for your own `.env` (`DATABASE_URL=...`).

**2. Make your admin login in that database.** On your computer, with `DATABASE_URL` in `.env`:
```powershell
npm run admin:setup
```
It stores the username and password (hashed) in the database, so the live site recognises them.

**3. Create the website on Render.**
1. Sign up at render.com and connect your GitHub account.
2. **New > Blueprint**, choose the `summer-air-mail` repository. Render reads `render.yaml`.
3. When it asks for the secret values, paste your `DATABASE_URL`. Leave the email ones empty for now.
4. Press Apply. The first build takes about 5 to 10 minutes. When it finishes, the site is live at `something.onrender.com`. Open `/healthz` on it; it should say `ok`.

**4. Point your domain at it.**
1. In Render open the service, **Settings > Custom Domains**, add `kidochukwuihezue.ca` and also `www.kidochukwuihezue.ca`. Render shows the exact DNS records to create.
2. Log in where you bought the domain and open its DNS settings (for a `.ca` that is your registrar: GoDaddy, Namecheap, Google Domains successor, CIRA member registrar and so on). Delete any old "parking page" records for `@` and `www`, then add what Render shows. Normally that is an `A` record for `@` pointing at the IP Render gives you, and a `CNAME` record for `www` pointing at `your-service.onrender.com`.
3. Back in Render press Verify. DNS can take from a few minutes to a few hours. Render then issues the HTTPS certificate by itself, and redirects `www` to the main address.

**5. Move your content up.** On your computer: Admin > Server & Backups > **Download a backup now**. Then open `https://kidochukwuihezue.ca/admin`, sign in, and under Server & Backups use **Restore from a backup** with that zip. Your content, images, messages and settings appear on the live site. Press Publish if the draft says it is unpublished.

**6. Check it.** In the admin open **SEO** and confirm the website address is `https://kidochukwuihezue.ca` (the server already supplies it until you do), then look at the live site on your phone.

**After that.** Every time you `git push` to GitHub, Render rebuilds and updates the site by itself. Your content is in the database and your images are on the disk, so deploying never changes them. Daily backups are on; download one now and then.

Costs and limits: the Starter plan stays awake (the free plan sleeps and would make visitors wait). The 2 GB disk holds your uploads and backups; raise `sizeGB` in `render.yaml` if you add many videos. Large videos are shrunk when uploaded, which needs a little memory, so keep one upload going at a time.

## Deploying

The site is a Node server that serves the built site, the API and the uploads. Deploy it anywhere that runs Node 22: Render, Railway, Fly.io, a VPS, or Docker.

```bash
npm ci
npm run build
npm run admin:setup      # once, on the server
NODE_ENV=production npm start
```

**Persistent storage is essential.** Uploads (and, without Postgres, content, the admin login and messages) live in `DATA_DIR` (default `./data`). Mount a persistent disk there and back it up. On hosts with ephemeral disks your edits would be lost on every deploy.

Environment variables are listed in `.env.example`. The ones you will usually set:

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on (most hosts set it for you) |
| `DATA_DIR` | Folder for uploads, and for the JSON files when you are not using Postgres |
| `DATABASE_URL` | Optional. Use Postgres instead of JSON files |
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
- **Secrets.** The browser code contains no keys or secrets. SMTP, webhook and S3 credentials exist only as server environment variables.
- **Public forms.** The contact, newsletter and tracking endpoints validate and size limit input, rate limit per address, reject hidden-field and too-fast posts, and never store an IP address. Exports neutralise spreadsheet formulas.
- **Roles.** Viewer, editor and owner are enforced on every admin route on the server. Removing a person or changing their role signs them out at once.
- **Private links.** Application links are served only by their code, are never in the public data, are marked noindex, and honour an expiry date.
- **Backups.** Backup zips never include logins or password hashes.

## On a phone

Both the website and the admin are built phone first and checked at four phone widths (320, 360, 390 and 430 pixels) by `npm run mobile`: no sideways scrolling on any page, menus no wider than half the screen, every menu link at least 44 pixels tall, controls big enough for a thumb, and form fields at 16 pixels so iPhones do not zoom in. The menu on the website and in the admin opens as a narrow side panel (half the screen at most) that scrolls inside itself. On the website the language picker moves into the menu on phones to keep the top bar clear. The announcement banner makes room for however many lines it needs.

## Testing

```bash
npm run check                         # type-check, lint, unit and server tests, build
npm run build && npm run smoke:admin  # the admin workflow in a real browser
npm run dev                           # then, in another terminal:
npm run smoke                         # public site: 8 widths, seasons, interactions, reduced motion
npm run a11y                          # axe-core on the site (all seasons, light and dark, desktop and mobile) and every admin page
npm run mobile                        # phone audit at four widths: overflow, menu width, tap targets, text size (needs npm run dev)
npm run build && npm run smoke:v3     # version 3 features in a real browser: banner, dark mode, languages, application links, profile PDF, contact form, maintenance
```

Covered by tests: season detection on and around every boundary (including Southern Hemisphere dates and invalid dates), colour contrast of every season's palette, the motion plan, section ordering and visibility, empty states, navigation without broken links, SEO and CSP output, writing rules (no em dashes, no banned fonts, no fabricated defaults), password hashing, access control on every admin route, CSRF protection, lockout, draft and publish, private content filtering, upload safety, and the full admin workflow through publishing to the live site.

## Known limits

- **One server.** Postgres removes the file store limit for content, but sessions, rate limits and uploads are still per server. Several servers need a shared session store and shared object storage for uploads. A second tab saving over the first is detected and refused.
- **Sessions are in memory.** Restarting the server signs everyone out.
- **No real PDF engine.** The one page profile uses your browser's Print dialog (Save as PDF), styled for A4. It is not generated on the server.
- **Email and S3 are untested against real services.** The code is tested with stand-ins (a fake mail transport and Amazon's published signature example). Send yourself a test alert and make one backup before relying on either.
- **Translations are yours.** The admin helps you translate field by field; it does not translate for you.
- **Uploaded files are public by link.** They are not drafts. Do not upload anything that must stay confidential; use **Hide parts** on screenshots first.
- **Instagram and TikTok are link cards, not embeds.** Their embed scripts cannot be loaded under a strict security policy. YouTube and Vimeo play in the page after a click.
- **The Dockerfile has not been run** in the environment this was built in.
- **Lighthouse and browser checks** were run in headless Chromium. Device motion tilt on a real phone and Safari rendering were not tested.
- **Spelling variants** (UK, Canada, US) apply to the few built-in interface words and number and currency formats. Your own text is shown exactly as you write it.
