'use client'

import Link from 'next/link'
import PublicPageHeader from '@/components/PublicPageHeader'
import PairGuideTool from '@/components/tools/PairGuideTool'

export default function PairGuidePage() {
  return (
    <main className="page-shell text-white">
      <PublicPageHeader title="راهنمای جفت‌ارز">
        <Link
          href="/tools"
          className="px-3 py-1.5 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 text-sm"
        >
          همه ابزارها
        </Link>
      </PublicPageHeader>
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
        <PairGuideTool />
      </div>
    </main>
  )
}
