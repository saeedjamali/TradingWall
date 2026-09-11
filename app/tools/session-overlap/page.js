'use client'

import Link from 'next/link'
import PublicPageHeader from '@/components/PublicPageHeader'
import SessionOverlapTool from '@/components/tools/SessionOverlapTool'

export default function SessionOverlapPage() {
  return (
    <main className="page-shell text-white">
      <PublicPageHeader title="همپوشانی سشن‌ها">
        <Link
          href="/tools"
          className="px-3 py-1.5 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 text-sm"
        >
          همه ابزارها
        </Link>
      </PublicPageHeader>
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
        <SessionOverlapTool />
        <p className="text-center text-xs text-white/35 mt-6" dir="rtl">
          جزئیات کامل سشن‌ها:{' '}
          <Link href="/tools/market-clock" className="text-cyan-300 hover:underline">
            ساعت بازار
          </Link>
        </p>
      </div>
    </main>
  )
}
