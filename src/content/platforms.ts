import type { PlatformExpertise } from './types'

const p = (platform: string): PlatformExpertise => ({
  id: platform, platform, level: '', services: [], contentTypes: [], campaigns: [], hidden: true,
})

/** Catalogue only. Platforms stay hidden until you describe your real experience. */
export const platforms: PlatformExpertise[] = ['instagram', 'tiktok', 'facebook', 'linkedin', 'youtube', 'pinterest', 'x', 'threads', 'snapchat'].map(p)
