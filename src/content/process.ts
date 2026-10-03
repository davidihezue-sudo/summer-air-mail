import type { ProcessStep } from './types'

/** A generic marketing workflow. Edit the wording so it reflects how you really work. */
export const process: ProcessStep[] = [
  { id: 'research', title: 'Research', icon: 'Search', color: 'sky', description: 'Audience, category and competitor research to find the open space.' },
  { id: 'strategy', title: 'Strategy', icon: 'Target', color: 'butter', description: 'Positioning, objectives with a baseline, and the role of each channel.' },
  { id: 'create', title: 'Create', icon: 'PenTool', color: 'pink', description: 'Concepts, copy and visuals made for the platform they will live on.' },
  { id: 'publish', title: 'Publish', icon: 'Megaphone', color: 'aqua', description: 'A calendar the team can keep, with clear approvals.' },
  { id: 'engage', title: 'Engage', icon: 'Users', color: 'peach', description: 'Community replies and conversations that build the relationship.' },
  { id: 'measure', title: 'Measure', icon: 'BarChart3', color: 'sage', description: 'Reporting against the baseline, with the period stated.' },
  { id: 'optimise', title: 'Optimise', icon: 'Sparkles', color: 'sand', description: 'Keep what worked, change what did not, and plan the next cycle.' },
]
