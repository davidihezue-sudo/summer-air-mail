import type { SeasonTheme } from './types'

/** The original Summer Air Mail identity. Colours are unchanged from the first release. */
export const summer: SeasonTheme = {
  name: 'summer',
  label: 'Summer',
  postLabel: 'SUMMER AIR MAIL',
  blurb: 'Sand, sea and sunlight. Postmarks, beach towels and pool rings.',
  colors: {
    stone: '#A08F80', green: '#055C2F', red: '#B5262E', sand: '#EED9B4', ink: '#17323F',
    sea: '#2A8DB0', aqua: '#8FD3CF', pink: '#F39CAB', sage: '#93C383', butter: '#F6DC8C',
    peach: '#F4A77E', sky: '#A9DCEB', paper: '#FBF4E4',
  },
  heroBg: 'radial-gradient(120% 90% at 78% 30%, var(--c-butter) 0%, var(--c-sand) 55%, #e6c995 100%)',
  sun: 'var(--c-peach)',
  textureFreq: 0.9,
  textureOpacity: 0,
  divider: 'waves',
  tide: 'water',
  cursor: { stroke: '42,141,176', fill: '169,220,235' },
  decorations: [
    { id: 'glints', label: 'Sun glints', description: 'Soft twinkles of sunlight drifting across the page.', defaultOn: true },
    { id: 'bubbles', label: 'Bubble cursor trail', description: 'Bubbles follow the mouse on desktop (Creative mode only).', defaultOn: true },
  ],
  defaultIntensity: 'expressive',
  surfaceName: 'beach towel',
  copy: {
    servicesTitle: 'What I put on the towel',
    workTitle: 'Pinned up to dry',
    toolsTitle: 'What floats my boat',
    contentTitle: 'Made for the feed',
    websitesTitle: 'On the laptop',
    testimonialsTitle: 'Kind words, with permission',
    sticker: 'hello!',
  },
}
