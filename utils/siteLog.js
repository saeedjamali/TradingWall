import connectDB from '@/lib/mongodb'
import SiteLog from '@/models/SiteLog'
import { ACTION_LABELS, getActionLabel } from '@/utils/siteLogLabels'

export { ACTION_LABELS, getActionLabel }

const ACTION_RULES = [
  [/\/api\/auth\/login-password$/, 'auth.login'],
  [/\/api\/auth\/verify-otp$/, 'auth.verify_otp'],
  [/\/api\/auth\/send-otp$/, 'auth.send_otp'],
  [/\/api\/auth\/register$/, 'auth.register'],
  [/\/api\/trades\/upload$/, 'trade.upload'],
  [/\/api\/trades\/[^/]+$/, { PUT: 'trade.update', DELETE: 'trade.delete' }],
  [/\/api\/trades$/, { POST: 'trade.create' }],
  [/\/api\/backtests\/[^/]+$/, { PUT: 'backtest.update', DELETE: 'backtest.delete' }],
  [/\/api\/backtests$/, { POST: 'backtest.create' }],
  [/\/api\/market-realities\/[^/]+$/, { PUT: 'market_reality.update', DELETE: 'market_reality.delete' }],
  [/\/api\/market-realities$/, { POST: 'market_reality.create' }],
  [/\/api\/plans\/[^/]+$/, { PUT: 'plan.update', DELETE: 'plan.delete' }],
  [/\/api\/plans$/, { POST: 'plan.create' }],
  [/\/api\/challenges\/[^/]+\/join$/, 'challenge.join'],
  [/\/api\/challenges\/[^/]+\/moderate$/, 'challenge.moderate'],
  [/\/api\/challenges\/[^/]+\/invite-sms$/, 'challenge.invite_sms'],
  [/\/api\/challenges\/[^/]+$/, { PUT: 'challenge.update', DELETE: 'challenge.delete' }],
  [/\/api\/challenges$/, { POST: 'challenge.create' }],
  [/\/api\/messages$/, { POST: 'message.create', PUT: 'message.update' }],
  [/\/api\/profile$/, { PUT: 'profile.update', POST: 'profile.update' }],
  [/\/api\/setups\/[^/]+$/, { PUT: 'setup.update', DELETE: 'setup.delete' }],
  [/\/api\/setups$/, { POST: 'setup.create' }],
  [/\/api\/checklists\/status$/, 'checklist.update'],
  [/\/api\/checklists\/[^/]+$/, { PUT: 'checklist.update', DELETE: 'checklist.update' }],
  [/\/api\/checklists$/, { POST: 'checklist.create' }],
  [/\/api\/upload\/image$/, 'upload.image'],
  [/\/api\/admin\/users\/[^/]+\/verify$/, 'admin.verify'],
  [/\/api\/admin\/users\/[^/]+\/status$/, 'admin.status'],
  [/\/api\/admin\/users\/[^/]+\/reset-password$/, 'admin.reset_password'],
  [/\/api\/admin\/users/, 'admin.users'],
  [/\/api\/admin\/setups/, 'admin.setups'],
  [/\/api\/admin\/symbols/, 'admin.symbols'],
  [/\/api\/admin\/demo-data/, 'admin.demo'],
  [/\/api\/admin\/messages/, 'admin.messages'],
]

export function normalizePath(raw) {
  if (!raw) return '/'
  try {
    const u = raw.startsWith('http') ? new URL(raw) : new URL(raw, 'http://local')
    let p = u.pathname || '/'
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
    return p.slice(0, 400)
  } catch {
    return String(raw).split('?')[0].slice(0, 400) || '/'
  }
}

export function inferAction(method, pathname) {
  const m = String(method || 'GET').toUpperCase()
  const p = normalizePath(pathname)
  if (m === 'GET' && !p.startsWith('/api/')) return 'page_view'
  for (const [re, spec] of ACTION_RULES) {
    if (!re.test(p)) continue
    if (typeof spec === 'string') return spec
    return spec[m] || `api.${m.toLowerCase()}`
  }
  if (p.startsWith('/api/')) {
    const key = p.replace(/^\/api\//, '').replace(/\//g, '.')
    return `api.${m.toLowerCase()}.${key}`.slice(0, 80)
  }
  return `${m.toLowerCase()}.${p}`.slice(0, 80)
}

export function clientIp(request) {
  const h = request?.headers
  if (!h) return ''
  const xf = h.get('x-forwarded-for') || ''
  const ip = xf.split(',')[0].trim() || h.get('x-real-ip') || ''
  return ip.slice(0, 80)
}

const SENSITIVE = /pass|otp|token|secret|code|authorization/i

export function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return null
  const out = {}
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE.test(k)) continue
    if (typeof v === 'string') out[k] = v.slice(0, 200)
    else if (typeof v === 'number' || typeof v === 'boolean') out[k] = v
    else if (v == null) continue
    else out[k] = String(v).slice(0, 120)
    if (Object.keys(out).length >= 8) break
  }
  return Object.keys(out).length ? out : null
}

export async function writeSiteLog(entry) {
  try {
    await connectDB()
    const kind = entry.kind === 'action' ? 'action' : 'page_view'
    await SiteLog.create({
      kind,
      action: String(entry.action || (kind === 'page_view' ? 'page_view' : 'unknown')).slice(0, 80),
      path: normalizePath(entry.path || ''),
      method: String(entry.method || (kind === 'page_view' ? 'GET' : '')).slice(0, 10),
      status: Number.isFinite(Number(entry.status)) ? Number(entry.status) : null,
      userId: entry.userId || null,
      visitorId: String(entry.visitorId || '').slice(0, 64),
      ip: String(entry.ip || '').slice(0, 80),
      userAgent: String(entry.userAgent || '').slice(0, 240),
      meta: sanitizeMeta(entry.meta),
    })
  } catch (err) {
    console.error('SiteLog write error:', err?.message || err)
  }
}

export function resolveLogRange(range, from, to) {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  let start = new Date(now)

  if (range === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (range === '24h') {
    start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  } else if (range === '7d') {
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  } else if (range === '30d') {
    start.setDate(start.getDate() - 29)
    start.setHours(0, 0, 0, 0)
  } else if (range === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
    start.setHours(0, 0, 0, 0)
  } else if (range === 'year') {
    start = new Date(now.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
  } else if (range === 'custom' && from && to) {
    start = new Date(from)
    start.setHours(0, 0, 0, 0)
    const t = new Date(to)
    t.setHours(23, 59, 59, 999)
    return { start, end: t }
  } else {
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  }

  if (Number.isNaN(start.getTime())) {
    start = new Date(now)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  }
  return { start, end }
}

export function seriesGranularity(start, end) {
  const ms = end.getTime() - start.getTime()
  const hours = ms / 36e5
  if (hours <= 48) return 'hour'
  if (hours <= 24 * 45) return 'day'
  return 'month'
}
