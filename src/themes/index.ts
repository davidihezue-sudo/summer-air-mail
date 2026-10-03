import type { SeasonName } from '../content/types'
import { autumn } from './autumn'
import { spring } from './spring'
import { summer } from './summer'
import { winter } from './winter'
import type { SeasonTheme } from './types'

export const THEMES: Record<SeasonName, SeasonTheme> = { spring, summer, autumn, winter }
export const SEASON_ORDER: SeasonName[] = ['spring', 'summer', 'autumn', 'winter']
export type { SeasonTheme } from './types'
