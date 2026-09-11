'use client'

import Link from 'next/link'
import PublicPageHeader from '@/components/PublicPageHeader'
import RiskCalculatorTool from '@/components/tools/RiskCalculatorTool'

export default function RiskCalculatorPage() {
  return (
    <main className="page-shell text-white">
      <PublicPageHeader title="ماشین‌حساب ریسک">
        <Link
          href="/tools"
          className="px-3 py-1.5 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 text-sm"
        >
          همه ابزارها
        </Link>
      </PublicPageHeader>

      <div className="container mx-auto px-4 py-6 md:py-10">
        <p className="text-sm text-white/55 mb-6 max-w-3xl" dir="rtl">
          حجم معامله را بر اساس درصد ریسک حساب، فاصله حد ضرر و ارزش پیپ محاسبه
          کنید. مناسب فارکس و نمادهای سفارشی.
        </p>
        <RiskCalculatorTool />
      </div>
    </main>
  )
}
