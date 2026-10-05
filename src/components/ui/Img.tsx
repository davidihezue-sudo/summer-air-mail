import type { ImageRef } from '../../content/types'
import { Visual } from './Visual'

interface Props {
  image: ImageRef | null | undefined
  className?: string
  eager?: boolean
  sizes?: string
}

/** Plain responsive image with intrinsic dimensions to prevent layout shift. */
export function Img({ image, className, eager, sizes }: Props) {
  if (!image?.src) return null
  return (
    <Visual className={className} src={image.src} alt={image.alt} poster={image.poster} width={image.width} height={image.height} sizes={sizes} eager={eager} />
  )
}
