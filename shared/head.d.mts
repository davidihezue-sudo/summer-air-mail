export function esc(value: unknown): string
export function buildMeta(p: any): { lang: string; title: string; description: string; keywords: string; ogTitle: string; ogDescription: string; url: string; image: string; robots: string }
export function buildJsonLd(p: any): { '@context': string; '@graph': Record<string, unknown>[] }
export function buildHeadTags(p: any): string
export function injectHead(html: string, p: any): string
export function buildRobots(p: any): string
export function buildSitemap(p: any): string
export function buildCsp(p: any): string
