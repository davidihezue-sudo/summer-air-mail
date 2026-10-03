import type { ImageRef } from '../../content/types'

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
    <img
      className={className}
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  )
}
