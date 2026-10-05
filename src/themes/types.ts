import type { Level, SeasonName, ThemeColors } from '../content/types'

export interface DecorationDef {
  id: string
  label: string
  description: string
  defaultOn: boolean
}

export type TideMode = 'water' | 'dew' | 'embers' | 'frost'
export type DividerShape = 'waves' | 'hills' | 'deckle' | 'ridge'

export interface SeasonCopy {
  servicesTitle: string
  workTitle: string
  toolsTitle: string
  contentTitle: string
  websitesTitle: string
  testimonialsTitle: string
  sticker: string
}

export interface SeasonTheme {
  name: SeasonName
  label: string
  /** Printed on the postmark and the stamp. */
  postLabel: string
  blurb: string
  colors: ThemeColors
  heroBg: string
  /** Colour of the soft glow behind the hero. */
  sun: string
  textureFreq: number
  textureOpacity: number
  divider: DividerShape
  tide: TideMode
  cursor: { stroke: string; fill: string }
  decorations: DecorationDef[]
  /** Default decorative motion level for this season. */
  defaultIntensity: Level
  surfaceName: string
  copy: SeasonCopy
}
