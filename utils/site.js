/**
 * Canonical site URL & shared SEO constants
 */

export const SITE_NAME = 'Trading Wall'
export const SITE_NAME_FA = 'دیوار معاملاتی'
export const SITE_TAGLINE =
  'ژورنال معاملاتی، لیدربورد تریدرها و دیوار عمومی عملکرد — مدیریت معاملات، ستاپ و انضباط'

export const SITE_DESCRIPTION =
  'Trading Wall پلتفرم فارسی ژورنال و تحلیل معاملات است. ثبت ترید، تقویم معاملاتی، لیدربورد وین‌ریت و سود، و دیوار عمومی تریدرها.'

export const SITE_KEYWORDS = [
  'Trading Wall',
  'دیوار معاملاتی',
  'ژورنال معاملاتی',
  'لیدربورد ترید',
  'ژورنال تریدینگ',
  'مدیریت معاملات',
  'وین ریت',
  'ترید فارکس',
  'تقویم معاملاتی',
  'trading journal',
  'trading leaderboard',
]

/** Production canonical origin (no trailing slash) */
export const PRODUCTION_SITE_URL = 'https://tradingwall.ir'

function normalizeOrigin(url) {
  return String(url || '')
    .trim()
    .replace(/\/$/, '')
}

function isLocalOrigin(url) {
  if (!url) return true
  try {
    const { hostname } = new URL(url)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local')
    )
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url)
  }
}

/**
 * Canonical site origin for sitemap / robots / Open Graph.
 * In production, localhost values are ignored so Google never gets bad URLs.
 * NEXT_PUBLIC_SITE_URL is baked at build time — set it before `npm run build` on the server.
 */
export function getSiteUrl() {
  const isProd = process.env.NODE_ENV === 'production'
  const fromEnv = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL)

  if (fromEnv) {
    if (isProd && isLocalOrigin(fromEnv)) {
      return PRODUCTION_SITE_URL
    }
    return fromEnv
  }

  const vercel = normalizeOrigin(process.env.VERCEL_URL)
  if (vercel && !isLocalOrigin(vercel.startsWith('http') ? vercel : `https://${vercel}`)) {
    return vercel.startsWith('http') ? vercel : `https://${vercel}`
  }

  if (isProd) {
    return PRODUCTION_SITE_URL
  }

  return 'http://localhost:3000'
}

export function absoluteUrl(path = '/') {
  const base = getSiteUrl()
  if (!path || path === '/') return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
