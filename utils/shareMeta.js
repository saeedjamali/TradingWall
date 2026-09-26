import { SITE_NAME_FA, absoluteUrl, getSeoSiteUrl } from '@/utils/site'

export const DEFAULT_OG_IMAGE = '/opengraph-image'
export const DEFAULT_OG_SIZE = { width: 1200, height: 630 }

function imageType(path) {
  const value = String(path || '').toLowerCase()
  if (value.endsWith('.jpg') || value.endsWith('.jpeg')) return 'image/jpeg'
  if (value.endsWith('.webp')) return 'image/webp'
  if (value.includes('opengraph-image') || value.endsWith('.png')) return 'image/png'
  return 'image/png'
}

function toIso(value) {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

export function shareImage(path, alt, size = {}) {
  const raw = path || DEFAULT_OG_IMAGE
  const url = /^https?:\/\//i.test(raw) ? raw : absoluteUrl(raw, getSeoSiteUrl())
  const isDefault = !path || raw === DEFAULT_OG_IMAGE
  return {
    url,
    secureUrl: url,
    alt: alt || SITE_NAME_FA,
    type: imageType(raw),
    width: size.width || (isDefault ? DEFAULT_OG_SIZE.width : 1280),
    height: size.height || (isDefault ? DEFAULT_OG_SIZE.height : 720),
  }
}

export function publicPageUrl(path = '/') {
  return absoluteUrl(path, getSeoSiteUrl())
}

export function buildShareMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = 'article',
  keywords,
  publishedTime,
  modifiedTime,
  noindex = false,
}) {
  const origin = getSeoSiteUrl()
  const pageUrl = absoluteUrl(path, origin)
  const images = [shareImage(image, imageAlt || title)]
  const published = toIso(publishedTime)
  const modified = toIso(modifiedTime)

  return {
    metadataBase: new URL(origin),
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME_FA,
      locale: 'fa_IR',
      title,
      description,
      url: pageUrl,
      publishedTime: published,
      modifiedTime: modified,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((item) => item.url),
    },
    other: {
      thumbnail: images[0].url,
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}
