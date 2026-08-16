'use client'

import Link from 'next/link'
import Image from 'next/image'
import PairGuideTool from '@/components/tools/PairGuideTool'

export default function PairGuidePage() {
  return (
    <main className="page-shell text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="shrink-0">
              <Image
                src="/logo/tradinggwall-logo-horizontal.svg"
                alt="Trading Wall"
                width={160}
                height={40}
                className="h-8 md:h-10 w-auto"
              />
            </Link>
            <span className="text-white/30 hidden sm:inline">|</span>
            <h1 className="text-base md:text-lg font-bold truncate">
              راهنمای جفت‌ارز
            </h1>
          </div>
          <Link
            href="/tools"
            className="px-3 py-1.5 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 text-sm"
          >
            همه ابزارها
          </Link>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
        <PairGuideTool />
      </div>
    </main>
  )
}
