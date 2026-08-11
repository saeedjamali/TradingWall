'use client'

import { useMemo } from 'react'

function formatMoney(n) {
  const v = Number(n) || 0
  const sign = v > 0 ? '+' : v < 0 ? '-' : ''
  return `${sign}$${Math.abs(v).toFixed(2)}`
}

/**
 * Monthly setup performance: wins / losses / WR per setup
 */
export default function SetupPerformanceChart({ trades, currentMonth }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const { rows, totals, withSetupCount, withoutSetupCount } = useMemo(() => {
    const monthTrades = (trades || []).filter((t) => {
      const d = new Date(t.closeTime)
      return d.getMonth() === month && d.getFullYear() === year
    })

    const map = new Map()
    let noSetup = 0

    const bump = (key, title, trade, isCustom) => {
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          title,
          isCustom: !!isCustom,
          wins: 0,
          losses: 0,
          breakeven: 0,
          profit: 0,
          trades: 0,
        })
      }
      const row = map.get(key)
      row.trades += 1
      row.profit += Number(trade.profit) || 0
      if (trade.profit > 0) row.wins += 1
      else if (trade.profit < 0) row.losses += 1
      else row.breakeven += 1
    }

    monthTrades.forEach((trade) => {
      const setups = Array.isArray(trade.setupIds) ? trade.setupIds : []
      if (setups.length === 0) {
        noSetup += 1
        bump('__none__', 'بدون ستاپ', trade, false)
        return
      }
      setups.forEach((s) => {
        if (!s) return
        const id = typeof s === 'object' ? String(s._id || s.id) : String(s)
        const title =
          typeof s === 'object' && s.title
            ? s.title
            : 'ستاپ ناشناس'
        const isCustom = typeof s === 'object' && s.type === 'custom'
        bump(id, title, trade, isCustom)
      })
    })

    const list = Array.from(map.values())
      .map((r) => {
        const decided = r.wins + r.losses
        return {
          ...r,
          winRate: decided > 0 ? Number(((r.wins / decided) * 100).toFixed(1)) : 0,
        }
      })
      .sort((a, b) => b.trades - a.trades || b.winRate - a.winRate)

    const totals = {
      trades: monthTrades.length,
      wins: monthTrades.filter((t) => t.profit > 0).length,
      losses: monthTrades.filter((t) => t.profit < 0).length,
      winRate: 0,
    }
    const decidedTotal = totals.wins + totals.losses
    totals.winRate =
      decidedTotal > 0 ? Number(((totals.wins / decidedTotal) * 100).toFixed(1)) : 0

    return {
      rows: list,
      totals,
      withSetupCount: monthTrades.filter((t) => Array.isArray(t.setupIds) && t.setupIds.length > 0).length,
      withoutSetupCount: noSetup,
    }
  }, [trades, year, month])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800">گزارش ستاپ‌های معاملاتی</h3>
          <p className="text-xs md:text-sm text-gray-500">
            {monthName} · تعداد Win / Loss و وین‌ریت هر ستاپ
          </p>
        </div>
        {totals.trades > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              {totals.trades} معامله
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              {totals.wins} Win
            </span>
            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700">
              {totals.losses} Loss
            </span>
            <span className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 font-semibold">
              WR {totals.winRate}%
            </span>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          معامله‌ای در این ماه ثبت نشده
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header — desktop */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-3 text-xs font-medium text-gray-500">
            <div className="col-span-4">ستاپ</div>
            <div className="col-span-4">نسبت Win / Loss</div>
            <div className="col-span-1 text-center">Win</div>
            <div className="col-span-1 text-center">Loss</div>
            <div className="col-span-1 text-center">WR</div>
            <div className="col-span-1 text-left">P/L</div>
          </div>

          {rows.map((row) => {
            const decided = row.wins + row.losses
            const winPct = decided > 0 ? (row.wins / decided) * 100 : 0
            const lossPct = decided > 0 ? (row.losses / decided) * 100 : 0
            const isNone = row.id === '__none__'

            return (
              <div
                key={row.id}
                className={`rounded-xl border p-3 md:p-3.5 ${
                  isNone ? 'border-dashed border-gray-300 bg-gray-50/80' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-3 items-center">
                  <div className="md:col-span-4 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{row.title}</h4>
                      {row.isCustom && (
                        <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                          شخصی
                        </span>
                      )}
                      {isNone && (
                        <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                          بدون تگ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{row.trades} معامله</p>
                  </div>

                  <div className="md:col-span-4">
                    {decided === 0 ? (
                      <div className="h-3 rounded-full bg-gray-100" title="فقط بریک‌ایون" />
                    ) : (
                      <div className="space-y-1">
                        <div className="h-3 rounded-full overflow-hidden flex bg-gray-100">
                          <div
                            className="bg-emerald-500 transition-all"
                            style={{ width: `${winPct}%` }}
                            title={`Win ${row.wins}`}
                          />
                          <div
                            className="bg-red-500 transition-all"
                            style={{ width: `${lossPct}%` }}
                            title={`Loss ${row.losses}`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 md:hidden">
                          <span className="text-emerald-600">{row.wins} Win</span>
                          <span className="text-red-600">{row.losses} Loss</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="hidden md:block md:col-span-1 text-center">
                    <span className="inline-flex min-w-[2rem] justify-center font-bold text-emerald-600">
                      {row.wins}
                    </span>
                  </div>
                  <div className="hidden md:block md:col-span-1 text-center">
                    <span className="inline-flex min-w-[2rem] justify-center font-bold text-red-600">
                      {row.losses}
                    </span>
                  </div>
                  <div className="md:col-span-1 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        row.winRate >= 50
                          ? 'bg-emerald-50 text-emerald-700'
                          : row.trades > 0
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {row.winRate}%
                    </span>
                  </div>
                  <div className="md:col-span-1 md:text-left">
                    <span
                      className={`text-sm font-semibold ${
                        row.profit > 0
                          ? 'text-emerald-700'
                          : row.profit < 0
                            ? 'text-red-700'
                            : 'text-gray-500'
                      }`}
                    >
                      {formatMoney(row.profit)}
                    </span>
                    {row.breakeven > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5 hidden md:block">
                        {row.breakeven} BE
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {(withSetupCount > 0 || withoutSetupCount > 0) && (
            <p className="text-xs text-gray-400 pt-2 text-center md:text-right">
              {withSetupCount} معامله با ستاپ
              {withoutSetupCount > 0 ? ` · ${withoutSetupCount} بدون ستاپ` : ''}
              {' '}· اگر معامله چند ستاپ داشته باشد در همه آن‌ها شمرده می‌شود
            </p>
          )}
        </div>
      )}
    </div>
  )
}
