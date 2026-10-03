import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { portfolio } from './src/content/portfolio.config'
import { buildJsonLd, buildMeta } from './src/utils/seo'

/** Injects SEO metadata, social previews and JSON-LD from the central config at build time. */
function seoPlugin(): Plugin {
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html) {
      const meta = buildMeta(portfolio)
      const ld = JSON.stringify(buildJsonLd(portfolio))
      return html
        .replaceAll('%LANG%', meta.lang)
        .replaceAll('%TITLE%', meta.title)
        .replaceAll('%DESCRIPTION%', meta.description)
        .replaceAll('%CANONICAL%', meta.url)
        .replaceAll('%OG_IMAGE%', meta.image)
        .replaceAll('%THEME_COLOR%', portfolio.theme.colors.sand)
        .replace('%JSON_LD%', ld.replaceAll('<', '\\u003c'))
    },
    generateBundle() {
      const base = portfolio.site.url.replace(/\/$/, '')
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`,
      })
      if (base) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url></urlset>\n`,
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), seoPlugin()],
  build: { target: 'es2022', sourcemap: false },
  test: { include: ['tests/**/*.test.ts'] },
})
