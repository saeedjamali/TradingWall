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

/**
 * Production canonical origin, without trailing slash.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://tradingwall.ir).
 */
export function getSiteUrl() {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv

  const vercel = (process.env.VERCEL_URL || '').trim().replace(/\/$/, '')
  if (vercel) {
    return vercel.startsWith('http') ? vercel : `https://${vercel}`
  }

  // Documented production domain (README)
  if (process.env.NODE_ENV === 'production') {
    return 'https://tradingwall.ir'
  }

  return 'http://localhost:3000'
}

export function absoluteUrl(path = '/') {
  const base = getSiteUrl()
  if (!path || path === '/') return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
