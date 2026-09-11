'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CountBadge, useInboxCounts } from '@/components/useInboxCounts'

const ITEMS = [
  { href: '/dashboard', label: 'دیوار', match: (p) => p === '/dashboard' || p.startsWith('/dashboard/') },
  { href: '/backtest', label: 'بک‌تست', match: (p) => p.startsWith('/backtest') },
  { href: '/challenges', label: 'چالش', match: (p) => p.startsWith('/challenges') },
  { href: '/profile', label: 'پروفایل', match: (p) => p.startsWith('/profile') },
]

/**
 * Slim primary nav for authenticated app pages.
 * Secondary destinations (trades list, tools, admin) live elsewhere.
 */
export default function AppTopNav({
  isAdmin = false,
  onLogout,
  showLogout = true,
  userId,
}) {
  const pathname = usePathname() || ''
  const { userUnread, adminInbox } = useInboxCounts({ userId, isAdmin })

  return (
    <nav className="flex items-center gap-0.5 md:gap-1">
      {ITEMS.map((item) => {
        const active = item.match(pathname)
        const isProfile = item.href === '/profile'
        return (
          <Link
            key={item.href}
            href={isProfile && userUnread ? '/profile?tab=messages' : item.href}
            className={`relative px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors ${
              active
                ? 'bg-white/10 text-primary-300 font-semibold'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.label}
            {isProfile && <CountBadge count={userUnread} />}
          </Link>
        )
      })}

      {isAdmin && (
        <Link
          href="/admin/messages"
          className={`relative hidden sm:inline-flex px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors ${
            pathname.startsWith('/admin')
              ? 'bg-white/10 text-amber-300 font-semibold'
              : 'text-white/50 hover:text-amber-200 hover:bg-white/5'
          }`}
        >
          ادمین
          <CountBadge count={adminInbox} />
        </Link>
      )}

      {showLogout && onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="mr-1 md:mr-2 px-2.5 md:px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:bg-white/10 hover:text-white text-xs md:text-sm transition-colors"
        >
          خروج
        </button>
      )}
    </nav>
  )
}
