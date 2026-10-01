export const SITE_WATERMARK = 'tradingwall.ir'

export default function WatermarkedFigure({
  src,
  alt = '',
  imgClassName = '',
  large = false,
  onClick,
}) {
  if (!src) return null

  return (
    <figure className="blog-figure relative w-fit max-w-full" onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={imgClassName} />
      <span
        className={`blog-watermark ${large ? 'blog-watermark-lg' : ''}`}
        aria-hidden="true"
      >
        {SITE_WATERMARK}
      </span>
    </figure>
  )
}
