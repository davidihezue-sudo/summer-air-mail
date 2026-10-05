import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { portfolio } from './src/content/portfolio.config'
import { THEMES } from './src/themes'
import { buildCsp, buildManifest, buildRobots, buildSitemap, injectHead } from './shared/head.mjs'

/** Static fallback: bakes SEO tags from the bundled defaults. The Node server regenerates them from published content. */
function seoPlugin(): Plugin {
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html) {
      return injectHead(html, portfolio).replaceAll('%THEME_COLOR%', THEMES.summer.colors.sand)
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots(portfolio) })
      const map = buildSitemap(portfolio)
      if (map) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: map })
      // Colours are the design tokens the page already uses for theme-color; the server swaps in the published names.
      const sand = THEMES.summer.colors.sand
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: JSON.stringify(buildManifest(portfolio, { theme: sand, background: sand }), null, 2) })
      this.emitFile({ type: 'asset', fileName: 'csp.txt', source: buildCsp(portfolio) })
    },
  }
}

export default defineConfig({
  plugins: [react(), seoPlugin()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rolldownOptions: {
      output: {
        // React is its own file so it stays cached across deploys of the site's own code.
        codeSplitting: { groups: [{ name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 20 }] },
      },
    },
  },
  // Object form on purpose: the string shorthand sets changeOrigin, which rewrites Host and breaks the admin origin check.
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false }, '/uploads': { target: 'http://127.0.0.1:8787', changeOrigin: false } } },
  preview: { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false }, '/uploads': { target: 'http://127.0.0.1:8787', changeOrigin: false } } },
  test: { include: ['tests/**/*.test.ts'] },
})
