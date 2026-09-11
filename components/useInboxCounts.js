'use client'

import { useEffect, useState } from 'react'
import { getSessionUser } from '@/utils/session'

export function useInboxCounts({ userId, isAdmin } = {}) {
  const [userUnread, setUserUnread] = useState(0)
  const [adminInbox, setAdminInbox] = useState(0)

  useEffect(() => {
    const session = getSessionUser()
    const uid = userId || session?.id
    const admin = isAdmin || session?.role === 'admin'
    if (!uid) return undefined

    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`/api/messages?userId=${uid}&countOnly=1`)
        const data = await res.json()
        if (!cancelled && data.success) setUserUnread(data.unreadCount || 0)
      } catch {
        // ignore
      }

      if (admin) {
        try {
          const res = await fetch(
            `/api/admin/messages?adminUserId=${uid}&countOnly=1`,
          )
          const data = await res.json()
          if (!cancelled && data.success) setAdminInbox(data.inboxCount || 0)
        } catch {
          // ignore
        }
      }
    }

    load()
    const timer = setInterval(load, 40000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [userId, isAdmin])

  return { userUnread, adminInbox }
}

export function CountBadge({ count, className = '', inline = false }) {
  if (!count) return null
  return (
    <span
      className={`${
        inline
          ? 'min-w-[1.1rem] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 text-center font-bold'
          : 'absolute -top-1 -left-1 min-w-[1.1rem] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 text-center font-bold'
      } ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
