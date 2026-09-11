'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const WATERMARK = 'tradingwall.ir'

export function BlogFigure({ src, alt, className = '', imgClassName = '' }) {
  if (!src) return null
  return (
    <figure className={`blog-figure ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ''}
        data-zoom="true"
        title="برای بزرگ‌نمایی کلیک کنید"
        className={imgClassName}
      />
      <span className="blog-watermark" aria-hidden="true">
        {WATERMARK}
      </span>
    </figure>
  )
}

export default function BlogZoomRoot({ children, className = '' }) {
  const [zoom, setZoom] = useState(null)

  const close = useCallback(() => setZoom(null), [])

  useEffect(() => {
    if (!zoom) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') close()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [zoom, close])

  const onClick = (event) => {
    const img = event.target.closest?.('img[data-zoom="true"]')
    if (!img) return
    event.preventDefault()
    setZoom({
      src: img.currentSrc || img.src,
      alt: img.alt || '',
    })
  }

  return (
    <div className={className} onClick={onClick}>
      {children}
      {zoom && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-8"
              role="dialog"
              aria-modal="true"
              aria-label="بزرگ‌نمایی تصویر"
              onClick={close}
            >
              <button
                type="button"
                onClick={close}
                className="absolute top-4 left-4 md:top-6 md:left-6 w-10 h-10 rounded-full bg-white/15 text-white text-2xl leading-none hover:bg-white/25"
                aria-label="بستن"
              >
                ×
              </button>
              <figure
                className="blog-figure relative max-w-[96vw] max-h-[92vh]"
                onClick={(event) => event.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoom.src}
                  alt={zoom.alt}
                  className="max-w-[96vw] max-h-[92vh] object-contain rounded-xl shadow-2xl"
                />
                <span className="blog-watermark blog-watermark-lg" aria-hidden="true">
                  {WATERMARK}
                </span>
              </figure>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
