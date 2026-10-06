/**
 * The extra fonts an owner can pick. Each is bundled with the site (nothing is fetched from another company) and is only
 * downloaded by a visitor's browser when the site actually uses it, so unused choices cost nothing.
 */
const LOADERS: Record<string, () => Promise<unknown>> = {
  // The originals are already part of the public site; the admin asks for them here so the font picker can show them.
  'Italiana': () => import('@fontsource/italiana/latin-400.css'),
  'Pinyon Script': () => import('@fontsource/pinyon-script/latin-400.css'),
  'Figtree Variable': () => import('@fontsource-variable/figtree/wght.css'),
  'Great Vibes': () => import('@fontsource/great-vibes/latin-400.css'),
  'Allura': () => import('@fontsource/allura/latin-400.css'),
  'Parisienne': () => import('@fontsource/parisienne/latin-400.css'),
  'Sacramento': () => import('@fontsource/sacramento/latin-400.css'),
  'Alex Brush': () => import('@fontsource/alex-brush/latin-400.css'),
  'Satisfy': () => import('@fontsource/satisfy/latin-400.css'),
  'Playball': () => import('@fontsource/playball/latin-400.css'),
  'Dancing Script Variable': () => import('@fontsource-variable/dancing-script/wght.css'),
  'Playfair Display Variable': () => import('@fontsource-variable/playfair-display/wght.css'),
  'Cormorant Garamond': () => Promise.all([import('@fontsource/cormorant-garamond/latin-400.css'), import('@fontsource/cormorant-garamond/latin-600.css'), import('@fontsource/cormorant-garamond/latin-700.css')]),
  'Cinzel Variable': () => import('@fontsource-variable/cinzel/wght.css'),
  'DM Serif Display': () => import('@fontsource/dm-serif-display/latin-400.css'),
  'Lora Variable': () => import('@fontsource-variable/lora/wght.css'),
  'Marcellus': () => import('@fontsource/marcellus/latin-400.css'),
  'Inter Variable': () => import('@fontsource-variable/inter/wght.css'),
  'Poppins': () => Promise.all([import('@fontsource/poppins/latin-400.css'), import('@fontsource/poppins/latin-500.css'), import('@fontsource/poppins/latin-600.css'), import('@fontsource/poppins/latin-700.css')]),
  'Montserrat Variable': () => import('@fontsource-variable/montserrat/wght.css'),
  'DM Sans Variable': () => import('@fontsource-variable/dm-sans/wght.css'),
  'Nunito Variable': () => import('@fontsource-variable/nunito/wght.css'),
}

export const LOADABLE_FONTS = Object.keys(LOADERS)
const started = new Set<string>()

/** The first font family named in a CSS font stack, without quotes. */
export const firstFamily = (stack: string | undefined) => (stack ?? '').split(',')[0].replace(/['"]/g, '').trim()

/** Starts downloading the font a stack begins with, if it is one of the optional fonts. Safe to call again and again. */
export function loadFont(stack: string | undefined) {
  const fam = firstFamily(stack)
  const load = LOADERS[fam]
  if (!load || started.has(fam)) return
  started.add(fam)
  void load().catch(() => started.delete(fam))
}
