/**
 * Canonical site URL & shared SEO constants
 */

export const SITE_NAME = 'Trading Wall'
export const SITE_NAME_FA = 'دیوار معاملاتی'
export const HOME_TITLE = 'ژورنال معاملاتی و بک‌تست فارکس | دیوار معاملاتی'
export const SITE_TAGLINE =
  'ژورنال معاملاتی فارسی، بک‌تست، چالش بک‌تست و چالش معامله برای تحلیل نقاط ضعف و قوت، لیدربورد تریدرها و ابزار فارکس'

export const SITE_DESCRIPTION =
  'Trading Wall پلتفرم فارسی ژورنال و تحلیل معاملات است: ثبت ترید، تقویم معاملاتی، بک‌تست فارکس، چالش بک‌تست و چالش معامله برای شناسایی نقاط ضعف و قوت (نه رتبه‌بندی)، لیدربورد وین‌ریت و سود، دیوار عمومی تریدرها و ابزار معامله (ساعت سشن، ماشین‌حساب ریسک و پیپ).'

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
  'بک تست فارکس',
  'بک‌تست',
  'بکتست',
  'بک تست',
  'ژورنال بک تست',
  'ژورنال فارکس',
  'ژورنال ترید',
  'چالش بک تست',
  'چالش بک‌تست',
  'چالش معامله',
  'چالش ترید',
  'تحلیل نقاط ضعف و قوت',
  'تحلیل بک تست',
  'تحلیل معامله',
  'ابزار معامله',
  'ابزار فارکس',
  'ساعت بازار فارکس',
  'ماشین حساب ریسک',
  'همپوشانی سشن',
  'trading journal',
  'trading leaderboard',
  'forex backtest',
  'backtest challenge',
  'trading challenge',
  'forex tools',
]

/** Hard-coded public origin — used by sitemap/robots so Google never sees localhost */
export const PRODUCTION_SITE_URL = 'https://tradingwall.ir'

function normalizeOrigin(url) {
  return String(url || '')
    .trim()
    .replace(/\/$/, '')
}

export function isLocalOrigin(url) {
  if (!url) return true
  try {
    const { hostname } = new URL(url.includes('://') ? url : `http://${url}`)
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
 * Public URL for SEO files (sitemap.xml / robots.txt).
 * Never returns localhost — Google rejects those URLs.
 */
export function getSeoSiteUrl() {
  const fromEnv = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL)
  if (fromEnv && !isLocalOrigin(fromEnv)) {
    return fromEnv
  }
  return PRODUCTION_SITE_URL
}

/**
 * General site origin (metadata, OG, etc.)
 */
export function getSiteUrl() {
  const fromEnv = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL)

  if (fromEnv && !isLocalOrigin(fromEnv)) {
    return fromEnv
  }

  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_SITE_URL
  }

  return fromEnv || 'http://localhost:3000'
}

/** @deprecated use getSeoSiteUrl for sitemap/robots */
export async function resolveSiteUrl() {
  return getSeoSiteUrl()
}

export function absoluteUrl(path = '/', base) {
  const origin = normalizeOrigin(base || getSiteUrl())
  if (!path || path === '/') return origin
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
