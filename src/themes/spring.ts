import type { SeasonTheme } from './types'

export const spring: SeasonTheme = {
  name: 'spring',
  label: 'Spring',
  postLabel: 'SPRING AIR MAIL',
  blurb: 'Fresh greens, soft pinks and cream. Botanical details and light.',
  colors: {
    stone: '#8F9A84', green: '#2F6B3A', red: '#B33A63', sand: '#F4ECD6', ink: '#1F3A33',
    sea: '#4C9BAE', aqua: '#BFE3D4', pink: '#F6BCCB', sage: '#B0D69C', butter: '#F8E7A9',
    peach: '#F7CBB0', sky: '#D2E8F3', paper: '#FDFAF2',
  },
  heroBg:
    'radial-gradient(70% 60% at 14% 18%, color-mix(in srgb, var(--c-pink) 70%, transparent) 0%, transparent 70%), radial-gradient(80% 70% at 88% 72%, color-mix(in srgb, var(--c-aqua) 80%, transparent) 0%, transparent 70%), linear-gradient(165deg, var(--c-paper), var(--c-sand))',
  sun: 'var(--c-butter)',
  textureFreq: 0.7,
  textureOpacity: 0.06,
  divider: 'hills',
  tide: 'dew',
  cursor: { stroke: '179,58,99', fill: '246,188,203' },
  decorations: [
    { id: 'petals', label: 'Falling petals', description: 'A few blossom petals drifting down the page.', defaultOn: true },
    { id: 'leaves', label: 'Fresh leaves', description: 'Light green leaves floating past.', defaultOn: true },
    { id: 'bubbles', label: 'Petal cursor trail', description: 'Soft petals follow the mouse on desktop (Creative mode only).', defaultOn: true },
  ],
  defaultIntensity: 'standard',
  surfaceName: 'picnic blanket',
  copy: {
    servicesTitle: 'What is in the picnic basket',
    workTitle: 'Fresh from the garden',
    toolsTitle: 'The toolkit',
    contentTitle: 'Made for the feed',
    websitesTitle: 'On the laptop',
    testimonialsTitle: 'Kind words, with permission',
    sticker: 'bloom!',
  },
}
