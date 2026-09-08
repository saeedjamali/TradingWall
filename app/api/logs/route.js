import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { writeSiteLog, inferAction, normalizePath, clientIp } from '@/utils/siteLog'

const buckets = globalThis.__siteLogRate || (globalThis.__siteLogRate = new Map())

function rateOk(ip) {
  const key = ip || 'unknown'
  const now = Date.now()
  const row = buckets.get(key) || { n: 0, t: now }
  if (now - row.t > 60_000) {
    row.n = 0
    row.t = now
  }
  row.n += 1
  buckets.set(key, row)
  return row.n <= 80
}

export async function POST(request) {
  try {
    const ip = clientIp(request)
    if (!rateOk(ip)) {
      return NextResponse.json({ success: true, skipped: 'rate' })
    }

    const body = await request.json().catch(() => ({}))
    const kind = body.kind === 'action' ? 'action' : 'page_view'
    const path = normalizePath(body.path || '/')
    if (path.startsWith('/api/logs') || path.startsWith('/_next')) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const method = String(body.method || (kind === 'page_view' ? 'GET' : 'POST')).toUpperCase()
    let userId = null
    if (body.userId && mongoose.Types.ObjectId.isValid(String(body.userId))) {
      userId = body.userId
    }

    await writeSiteLog({
      kind,
      action:
        kind === 'page_view'
          ? 'page_view'
          : inferAction(method, path),
      path,
      method,
      status: body.status,
      userId,
      visitorId: body.visitorId,
      ip,
      userAgent: request.headers.get('user-agent') || body.userAgent || '',
      meta: body.meta,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logs collect error:', error)
    return NextResponse.json({ success: true })
  }
}
