export function esc(value: unknown): string
export function buildMeta(p: any): { lang: string; title: string; description: string; keywords: string; ogTitle: string; ogDescription: string; url: string; image: string; robots: string }
export function buildFaqJsonLd(c: any): { '@context': string; '@type': string; mainEntity: Record<string, unknown>[] } | null
export function buildJsonLd(p: any): { '@context': string; '@graph': Record<string, unknown>[] }
export function buildHeadTags(p: any): string
export function injectHead(html: string, p: any): string
export function buildRobots(p: any): string
export function buildSitemap(p: any): string
export function buildCsp(p: any): string
export function ogCardUrl(p: any, key: string): string
export const DASHBOARD_HOSTS: string[]
export function dashboardEmbedUrl(url: unknown): string
export function buildFeed(content: unknown): string
export function buildFullSitemap(content: unknown): string
export function pageSeo(content: unknown, path: string): null | { missing: true } | { missing?: false; title: string; description: string; image: string; canonical: string }
export function withSeo(portfolio: any, seo: { title: string; description: string; image: string; canonical: string }): any // eslint-disable-line @typescript-eslint/no-explicit-any
export function appNames(p: any): { name: string; shortName: string }
export function buildManifest(p: any, colors?: { theme?: string; background?: string }): Record<string, unknown>
