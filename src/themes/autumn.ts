import type { SeasonTheme } from './types'

export const autumn: SeasonTheme = {
  name: 'autumn',
  label: 'Autumn',
  postLabel: 'AUTUMN AIR MAIL',
  blurb: 'Burgundy, burnt orange and warm paper. Editorial, film and leather.',
  colors: {
    stone: '#8B7765', green: '#4F5B2A', red: '#7E1F2E', sand: '#EFE0C4', ink: '#2A1A13',
    sea: '#A3501F', aqua: '#E3C27A', pink: '#E2A98F', sage: '#BDBF84', butter: '#EDCB75',
    peach: '#E49A60', sky: '#DDC9A3', paper: '#FBF3E3',
  },
  heroBg:
    'radial-gradient(110% 90% at 78% 28%, var(--c-peach) 0%, var(--c-sand) 58%, #d6b98e 100%)',
  sun: 'var(--c-butter)',
  textureFreq: 0.85,
  textureOpacity: 0.12,
  divider: 'deckle',
  tide: 'embers',
  cursor: { stroke: '126,31,46', fill: '228,154,96' },
  decorations: [
    { id: 'leaves', label: 'Falling leaves', description: 'Burgundy, orange and mustard leaves drifting down.', defaultOn: true },
    { id: 'glow', label: 'Warm glow', description: 'A soft amber vignette, like low evening light.', defaultOn: true },
    { id: 'bubbles', label: 'Leaf cursor trail', description: 'Warm sparks follow the mouse on desktop (Creative mode only).', defaultOn: false },
  ],
  defaultIntensity: 'standard',
  surfaceName: 'wool blanket',
  copy: {
    servicesTitle: 'On the desk this season',
    workTitle: 'Pinned to the board',
    toolsTitle: 'The toolkit',
    contentTitle: 'Made for the feed',
    websitesTitle: 'On the laptop',
    testimonialsTitle: 'Kind words, with permission',
    sticker: 'welcome back',
  },
}
