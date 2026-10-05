import type { SeasonTheme } from './types'

export const winter: SeasonTheme = {
  name: 'winter',
  label: 'Winter',
  postLabel: 'WINTER AIR MAIL',
  blurb: 'Deep navy, ice and silver. Frosted glass and quiet luxury.',
  colors: {
    stone: '#8794A3', green: '#1F4D3A', red: '#9E2F3C', sand: '#E6ECF2', ink: '#0F1F33',
    sea: '#2A5A87', aqua: '#C6DCEA', pink: '#DCC7D3', sage: '#B9CCC3', butter: '#ECE5CF',
    peach: '#EBD3C8', sky: '#D6E5F1', paper: '#F8FAFC',
  },
  heroBg:
    'radial-gradient(120% 90% at 80% 18%, #ffffff 0%, var(--c-sand) 52%, var(--c-aqua) 100%)',
  sun: 'var(--c-sky)',
  textureFreq: 1.2,
  textureOpacity: 0.07,
  divider: 'ridge',
  tide: 'frost',
  cursor: { stroke: '42,90,135', fill: '198,220,234' },
  decorations: [
    { id: 'snow', label: 'Snowfall', description: 'Sparse snowflakes falling gently.', defaultOn: true },
    { id: 'stars', label: 'Silver stars', description: 'A few twinkling silver stars.', defaultOn: true },
    { id: 'frost', label: 'Frosted edges', description: 'A pale frosted vignette around the page.', defaultOn: true },
    { id: 'bubbles', label: 'Ice sparkle cursor trail', description: 'Sparkles follow the mouse on desktop (Creative mode only).', defaultOn: false },
  ],
  defaultIntensity: 'standard',
  surfaceName: 'knitted throw',
  copy: {
    servicesTitle: 'By the fire',
    workTitle: 'Hung for the season',
    toolsTitle: 'The toolkit',
    contentTitle: 'Made for the feed',
    websitesTitle: 'On the laptop',
    testimonialsTitle: 'Kind words, with permission',
    sticker: 'cosy',
  },
}
