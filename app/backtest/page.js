'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BacktestApp from '@/components/BacktestApp'
import ThemeToggle from '@/components/ThemeToggle'
import { getSessionUser } from '@/utils/session'

export default function BacktestPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getSessionUser())
  }, [])

  if (user) {
    return <BacktestApp loginRedirect={null} />
  }

  return <BacktestLanding />
}

function BacktestLanding() {
  return (
    <main className="page-shell text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo/tradinggwall-logo-horizontal.svg"
              alt="Trading Wall"
              width={160}
              height={40}
              className="h-8 md:h-10 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/tools" className="text-white/70 hover:text-white px-2">
              ابزارها
            </Link>
            <Link
              href="/auth/login?next=/backtest"
              className="px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              ورود به بک‌تست
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-16" dir="rtl">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-primary-300 text-sm font-medium mb-2">
            Backtest Journal
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            بک‌تست فارکس و ژورنال بکتست
          </h1>
          <p className="text-white/65 text-base md:text-lg leading-relaxed mb-8">
            بک‌تست (بکتست) یعنی آزمودن ستاپ روی چارت تاریخی. بک‌تست‌های روزانه را
            ثبت کنید، تعداد TP و SL را پیگیری کنید و با گزارش ستاپ‌ها و تقویم
            ماهانه وضعیت عملکرد خود را ببینید.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/login?next=/backtest"
              className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700"
            >
              ورود و شروع بک‌تست
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-3 rounded-xl border border-white/20 text-white/90 hover:bg-white/10"
            >
              ثبت‌نام
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-12">
          {[
            {
              title: 'تقویم بک‌تست',
              desc: 'چند بک‌تست در هر روز با خلاصه هفتگی و ماهانه TP/SL',
            },
            {
              title: 'نتیجه بر اساس تعداد',
              desc: 'برایند با شمارش TP و SL و Risk اختیاری — نه حجم معامله',
            },
            {
              title: 'گزارش ستاپ‌ها',
              desc: 'عملکرد ستاپ‌های شخصی و استاندارد در یک نگاه',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-right"
            >
              <h2 className="text-lg font-bold mb-2">{f.title}</h2>
              <p className="text-sm text-white/55 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-white/40">
          ابزارهای مرتبط:{' '}
          <Link
            href="/tools/market-clock"
            className="text-cyan-300 hover:underline"
          >
            ساعت بازار
          </Link>
          {' · '}
          <Link
            href="/tools/risk-calculator"
            className="text-cyan-300 hover:underline"
          >
            ماشین‌حساب ریسک
          </Link>
        </p>

        <article
          className="max-w-3xl mx-auto mt-14 text-right text-white/60 text-sm leading-relaxed space-y-4"
          dir="rtl"
        >
          <h2 className="text-lg font-bold text-white">
            چرا بک‌تست را در ژورنال ثبت کنیم؟
          </h2>
          <p>
            بدون ثبت منظم، بکتست فقط چند اسکرین‌شات پراکنده است. ژورنال بک‌تست
            دیوار معاملاتی تعداد نتایج را کنار هم می‌گذارد تا ببینید کدام ستاپ
            روی کدام نماد پایدارتر است و کجا حد ضرر بیشتر از حد سود تکرار می‌شود.
          </p>
          <p>
            بعد از ثبت بک‌تست می‌توانید در{' '}
            <Link href="/challenges" className="text-cyan-300 hover:underline">
              چالش بک‌تست
            </Link>{' '}
            با دیگران روی یک نماد کار کنید، یا معاملات واقعی را در{' '}
            <Link href="/" className="text-cyan-300 hover:underline">
              ژورنال معاملاتی
            </Link>{' '}
            دنبال کنید.
          </p>
        </article>
      </div>
    </main>
  )
}
