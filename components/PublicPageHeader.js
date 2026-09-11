'use client'

import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'

export default function PublicPageHeader({
  title,
  children,
  sticky = true,
  logoPriority = false,
}) {
  return (
    <header
      className={`border-b border-white/10 bg-black/20 backdrop-blur ${
        sticky ? 'sticky top-0 z-20' : ''
      }`}
    >
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity">
            <Image
              src="/logo/tradinggwall-logo-horizontal.svg"
              alt="Trading Wall"
              width={160}
              height={40}
              priority={logoPriority}
              className="theme-logo h-8 md:h-10 w-auto"
            />
          </Link>
          {title ? (
            <>
              <span className="text-white/30 hidden sm:inline">|</span>
              <h1 className="text-base md:text-lg font-bold truncate">{title}</h1>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
