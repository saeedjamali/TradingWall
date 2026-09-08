'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const VISITOR_KEY = 'tw_visitor_id'

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id =
        crypto.randomUUID?.() ||
        `v_${Date.now()}_${Math.random().toString(16).slice(2)}`
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

function sessionUserId() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const u = JSON.parse(raw)
    return u?.id || u?._id || null
  } catch {
    return null
  }
}

function sendLog(payload) {
  const body = JSON.stringify({
    ...payload,
    visitorId: visitorId(),
    userId: sessionUserId(),
  })
  try {
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}

export default function SiteLogTracker() {
  const pathname = usePathname()
  const lastPath = useRef('')
  const patched = useRef(false)

  useEffect(() => {
    if (patched.current || typeof window === 'undefined') return
    patched.current = true
    const orig = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const res = await orig(input, init)
      try {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof Request
              ? input.url
              : String(input)
        const method = String(
          init?.method || (input instanceof Request ? input.method : 'GET'),
        ).toUpperCase()
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return res
        const path = url.startsWith('http')
          ? new URL(url).pathname
          : url.split('?')[0]
        if (!path.startsWith('/api/') || path.startsWith('/api/logs')) return res
        if (path.startsWith('/api/admin/logs')) return res
        sendLog({
          kind: 'action',
          path,
          method,
          status: res.status,
        })
      } catch {
        /* ignore */
      }
      return res
    }
  }, [])

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/api')) return
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    sendLog({
      kind: 'page_view',
      path: pathname,
      method: 'GET',
      status: 200,
    })
  }, [pathname])

  return null
}
