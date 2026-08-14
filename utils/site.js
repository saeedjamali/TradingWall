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
 * Resolve public site origin from an incoming Host header (preferred for sitemap/robots).
 */
export function siteUrlFromHostHeader(hostHeader, protoHeader) {
  const host = String(hostHeader || '')
    .split(',')[0]
    .trim()
    .replace(/:\d+$/, '') // drop port if any

  if (!host || isLocalOrigin(host)) return null

  const protoRaw = String(protoHeader || 'https')
    .split(',')[0]
    .trim()
    .toLowerCase()
  const proto = protoRaw === 'http' ? 'http' : 'https'

  return `${proto}://${host}`
}

/**
 * Canonical site origin for sitemap / robots / Open Graph.
 * Never emit localhost when NODE_ENV=production.
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

/**
 * Best-effort public URL for SEO routes (sitemap/robots).
 * Uses request Host when not localhost, else getSiteUrl().
 */
export async function resolveSiteUrl() {
  try {
    const { headers } = await import('next/headers')
    const h = await headers()
    const fromRequest = siteUrlFromHostHeader(
      h.get('x-forwarded-host') || h.get('host'),
      h.get('x-forwarded-proto'),
    )
    if (fromRequest) return fromRequest
  } catch {
    // headers() unavailable (build time) — fall through
  }

  return getSiteUrl()
}

export function absoluteUrl(path = '/', base) {
  const origin = normalizeOrigin(base || getSiteUrl())
  if (!path || path === '/') return origin
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
