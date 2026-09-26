'use client'

import { useState } from 'react'

const PERIODS = [
  { id: 'month', label: 'ماهانه' },
  { id: 'year', label: 'سالانه' },
  { id: 'all', label: 'کلی' },
]

const EMPTY_STATS = {
  totalTrades: 0,
  winRate: 0,
  totalProfitLoss: 0,
  averageProfit: 0,
}

export default function TradeSummaryCards({
  summary,
  monthLabel,
  yearLabel,
}) {
  const [period, setPeriod] = useState('month')
  const stats = summary?.[period] || EMPTY_STATS
  const caption =
    period === 'month'
      ? monthLabel || 'آمار ماه جاری'
      : period === 'year'
        ? yearLabel || 'آمار سال جاری'
        : 'آمار کلی همه معاملات'

  const pnl = Number(stats.totalProfitLoss || 0)
  const avg = Number(stats.averageProfit || 0)

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6" dir="rtl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">خلاصه معاملات</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{caption}</p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`rounded-md px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors ${
                period === item.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard title="تعداد معاملات" value={stats.totalTrades || 0} icon="📊" accent="sky" />
        <StatCard
          title="وین ریت"
          value={`${Number(stats.winRate || 0)}%`}
          icon="🎯"
          accent="teal"
        />
        <StatCard
          title="سود/زیان کل"
          value={`$${pnl.toFixed(2)}`}
          icon="💰"
          accent={pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'sky'}
          valueTone={pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'neutral'}
        />
        <StatCard
          title="میانگین سود"
          value={`$${avg.toFixed(2)}`}
          icon="📈"
          accent={avg > 0 ? 'profit' : avg < 0 ? 'loss' : 'cyan'}
          valueTone={avg > 0 ? 'profit' : avg < 0 ? 'loss' : 'neutral'}
        />
      </div>
    </section>
  )
}

function StatCard({ title, value, icon, accent = 'sky', valueTone = 'neutral' }) {
  const accents = {
    sky: {
      card: 'from-sky-50 via-white to-primary-100 border-primary-200/80',
      bar: 'bg-primary-500',
      icon: 'bg-primary-100',
    },
    teal: {
      card: 'from-teal-50 via-white to-emerald-50 border-teal-200/80',
      bar: 'bg-teal-500',
      icon: 'bg-teal-100',
    },
    cyan: {
      card: 'from-cyan-50 via-white to-sky-50 border-cyan-200/80',
      bar: 'bg-cyan-500',
      icon: 'bg-cyan-100',
    },
    profit: {
      card: 'from-emerald-50 via-white to-green-50 border-emerald-200/80',
      bar: 'bg-emerald-500',
      icon: 'bg-emerald-100',
    },
    loss: {
      card: 'from-rose-50 via-white to-red-50 border-rose-200/80',
      bar: 'bg-rose-500',
      icon: 'bg-rose-100',
    },
  }
  const theme = accents[accent] || accents.sky
  const valueClass =
    valueTone === 'profit'
      ? 'text-profit'
      : valueTone === 'loss'
        ? 'text-loss'
        : 'text-gray-900'

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br px-3 py-3.5 sm:p-5 shadow-md h-full ${theme.card}`}
    >
      <div className={`absolute inset-y-0 right-0 w-1 ${theme.bar}`} />
      <div className="flex items-center gap-2.5 sm:gap-3 pr-1.5 sm:pr-2 h-full">
        <div
          className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg text-lg sm:text-2xl ${theme.icon}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-start">
          <p className="text-[11px] sm:text-sm text-gray-600 leading-tight truncate">{title}</p>
          <p
            className={`mt-0.5 sm:mt-1 text-base sm:text-2xl font-bold tabular-nums leading-none tracking-tight ${valueClass}`}
          >
            <span dir="ltr" className="inline-block">
              {value}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
