import type { MediaSettings, Project } from '../content/types'

/** Shapes that social platforms use, as width divided by height. */
export const SHAPES: Record<Exclude<MediaSettings['cardShape'], 'auto'>, number> = {
  square: 1, portrait: 4 / 5, story: 9 / 16, tall: 2 / 3, landscape: 16 / 9, wide: 1.91,
}

/** What each platform's pictures usually look like, used only until the real size of the image is known. */
const PLATFORM_SHAPE: Record<string, number> = {
  instagram: 4 / 5, threads: 4 / 5, tiktok: 9 / 16, snapchat: 9 / 16, pinterest: 2 / 3, youtube: 16 / 9, x: 16 / 9, facebook: 1.91, linkedin: 1.91,
}

export const MIN_RATIO = 9 / 16
export const MAX_RATIO = 2.4
export const clampRatio = (r: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, Number.isFinite(r) && r > 0 ? r : 1))

/** The ratio of an image if its size is known. */
export const ratioOf = (img?: { width?: number; height?: number } | null): number | null => (img?.width && img?.height ? img.width / img.height : null)

/** A first guess at the shape of a project's pictures: its platform, then 4:5. */
export function guessRatio(platforms: string[] = []): number {
  for (const p of platforms) if (PLATFORM_SHAPE[p.toLowerCase()]) return PLATFORM_SHAPE[p.toLowerCase()]
  return 4 / 5
}

/**
 * The shape a project card should take. A forced shape (set for the whole site or for this project) wins.
 * Otherwise null: the card follows the picture itself, so nothing is trimmed.
 */
export function forcedRatio(project: Pick<Project, 'cardFormat'>, media: MediaSettings): number | null {
  const shape = project.cardFormat || media.cardShape
  return shape && shape !== 'auto' ? SHAPES[shape] ?? null : null
}
