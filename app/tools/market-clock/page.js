'use client'

import Link from 'next/link'
import PublicPageHeader from '@/components/PublicPageHeader'
import MarketClockTool from '@/components/tools/MarketClockTool'

export default function MarketClockPage() {
  return (
    <main className="page-shell text-white">
      <PublicPageHeader title="ساعت بازار فارکس و سشن‌ها">
        <Link
          href="/tools"
          className="px-3 py-1.5 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 text-sm"
        >
          همه ابزارها
        </Link>
      </PublicPageHeader>

        <div className="container mx-auto px-4 py-6 md:py-10">
        <p className="text-sm text-white/55 mb-6 max-w-3xl" dir="rtl">
          چهار سشن سیدنی، توکیو، لندن و نیویورک را به وقت تهران و GMT ببینید، ساعت
          بانک نیویورک را دنبال کنید، زمان را تبدیل کنید و تعطیلات امروز / هفته /
          ماه را ببینید. در روزهای تابستانه، اختلاف +۱ به‌صورت خودکار اعمال می‌شود.
        </p>
        <MarketClockTool />
      </div>
    </main>
  )
}
