import { SITE_NAME_FA, absoluteUrl, getSeoSiteUrl } from '@/utils/site'

function imageType(path) {
  const value = String(path || '').toLowerCase()
  if (value.endsWith('.jpg') || value.endsWith('.jpeg')) return 'image/jpeg'
  if (value.endsWith('.webp')) return 'image/webp'
  if (value.endsWith('.svg')) return 'image/svg+xml'
  return 'image/png'
}

export function shareImage(path, alt, size = {}) {
  const url = absoluteUrl(path || '/icons/tradingwall-icon-512x512.png', getSeoSiteUrl())
  return {
    url,
    secureUrl: url,
    alt: alt || SITE_NAME_FA,
    type: imageType(path),
    width: size.width || (path ? 1280 : 512),
    height: size.height || (path ? 720 : 512),
  }
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
  const images = [
    shareImage(image, imageAlt || title),
  ]

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
      publishedTime: publishedTime || undefined,
      modifiedTime: modifiedTime || undefined,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((item) => item.url),
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}
