'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { clearSession, getSessionUser } from '@/utils/session'
import { buildSupportRedirect } from '@/utils/supportRedirect'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/profile',
  '/admin',
]

function isProtectedPath(pathname) {
  if (!pathname) return false
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/**
 * Clears local session and kicks inactive users out of protected pages.
 */
export default function ActiveSessionGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const session = getSessionUser()
      if (!session) return

      try {
        const res = await fetch(`/api/auth/session?userId=${session.id}`)
        const data = await res.json()

        if (cancelled) return

        if (!res.ok || data.active === false) {
          const phone = session.phone || ''
          clearSession()
          router.replace(
            buildSupportRedirect({
              phone,
              category: 'account_activation',
              reason: 'inactive',
            })
          )
        }
      } catch {
        // Ignore network blips; next navigation will re-check
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  return null
}
