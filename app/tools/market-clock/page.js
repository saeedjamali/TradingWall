'use client'

import Link from 'next/link'
import Image from 'next/image'
import MarketClockTool from '@/components/tools/MarketClockTool'

export default function MarketClockPage() {
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
              ساعت بازار فارکس و سشن‌ها
            </h1>
          </div>
          <nav className="flex items-center gap-2 text-sm shrink-0">
            <Link
              href="/tools"
              className="px-3 py-1.5 rounded-lg border border-white/15 text-white/80 hover:bg-white/10"
            >
              همه ابزارها
            </Link>
          </nav>
        </div>
      </header>

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
