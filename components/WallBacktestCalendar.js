'use client'

import { useMemo, useState } from 'react'
import Modal from '@/components/Modal'
import { sameLocalDay, sessionLabel, buildBacktestReports } from '@/utils/backtest'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Read-only backtest calendar for public user wall
 */
export default function WallBacktestCalendar({ year, month, backtests = [] }) {
  const [selectedDay, setSelectedDay] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  const { weeks, stats } = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendarDays = []
    for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null)
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day)

    const weeksArr = []
    let currentWeek = []
    calendarDays.forEach((day, index) => {
      currentWeek.push(day)
      if ((index + 1) % 7 === 0) {
        weeksArr.push(currentWeek)
        currentWeek = []
      }
    })
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null)
      weeksArr.push(currentWeek)
    }

    return {
      weeks: weeksArr,
      stats: buildBacktestReports(backtests),
    }
  }, [year, month, backtests])

  const getDayItems = (day) => {
    const date = new Date(year, month - 1, day)
    return backtests.filter((b) => sameLocalDay(b.date, date))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-sm text-gray-600">
          فقط مشاهده — {stats.count} بک‌تست
          {stats.hitRate != null ? ` · Hit Rate ${stats.hitRate.toFixed(1)}%` : ''}
        </div>
        <div
          className={`font-bold tabular-nums ${
            stats.unitNet > 0
              ? 'text-emerald-600'
              : stats.unitNet < 0
                ? 'text-red-600'
                : 'text-gray-600'
          }`}
        >
          {stats.unitNet >= 0 ? '+' : ''}
          {stats.unitNet} (TP−SL)
          {stats.withRisk > 0 && (
            <span className="mr-2 text-sm">
              · {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div dir="ltr" className="overflow-x-auto -mx-1 px-1 pb-2">
        <div className="min-w-[480px]">
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className={`text-center font-bold py-1 text-xs md:text-sm ${
                  day === 'Sat' || day === 'Sun' ? 'text-red-500' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
              {week.map((day, di) => {
                if (day == null) {
                  return <div key={`${wi}-${di}`} className="min-h-[56px] md:min-h-[80px]" />
                }

                const items = getDayItems(day)
                const hasItems = items.length > 0
                const dayTp = items.reduce((s, b) => s + (b.tpHits || 0), 0)
                const daySl = items.reduce((s, b) => s + (b.slHits || 0), 0)
                const dayNet = dayTp - daySl
                const dow = new Date(year, month - 1, day).getDay()
                const isWeekend = dow === 0 || dow === 6

                let cellCls = 'bg-gray-50 border-gray-100'
                if (isWeekend) cellCls = 'bg-red-50/50 border-red-100'
                else if (hasItems && dayNet > 0) cellCls = 'bg-emerald-50 border-emerald-200'
                else if (hasItems && dayNet < 0) cellCls = 'bg-red-50 border-red-200'
                else if (hasItems) cellCls = 'bg-gray-100 border-gray-200'

                return (
                  <button
                    key={`${wi}-${di}`}
                    type="button"
                    disabled={!hasItems}
                    onClick={() =>
                      hasItems &&
                      setSelectedDay({
                        day,
                        items,
                        dayTp,
                        daySl,
                      })
                    }
                    className={`min-h-[56px] md:min-h-[80px] rounded-lg border p-1.5 text-left transition-colors ${cellCls} ${
                      hasItems
                        ? 'hover:ring-2 hover:ring-indigo-300 cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-700">{day}</span>
                    {hasItems && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[10px] text-gray-500">{items.length} BT</p>
                        <p className="text-[10px] md:text-xs font-bold">
                          <span className="text-emerald-700">T{dayTp}</span>
                          <span className="text-gray-400 mx-0.5">/</span>
                          <span className="text-rose-700">S{daySl}</span>
                        </p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={
          selectedDay
            ? `بک‌تست‌های ${new Date(year, month - 1, selectedDay.day).toLocaleDateString('fa-IR')}`
            : 'بک‌تست‌های روز'
        }
        size="lg"
      >
        {selectedDay && (
          <div className="space-y-3" dir="rtl">
            <div className="text-sm text-gray-600">
              {selectedDay.items.length} بک‌تست · TP {selectedDay.dayTp} · SL {selectedDay.daySl}
            </div>
            <ul className="space-y-3 max-h-[55vh] overflow-y-auto">
              {selectedDay.items.map((b) => (
                <li
                  key={b._id}
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-gray-900">
                        {b.symbol}{' '}
                        <span
                          className={
                            b.direction === 'buy' ? 'text-emerald-600' : 'text-rose-600'
                          }
                        >
                          {b.direction?.toUpperCase()}
                        </span>
                        <span className="text-gray-500 font-normal text-sm mr-2">
                          · {b.timeframe} · {sessionLabel(b.session)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        TP {b.tpHits || 0} · SL {b.slHits || 0}
                        {b.resultPnL != null && (
                          <span
                            className={`mr-2 font-bold ${
                              b.resultPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {b.resultPnL >= 0 ? '+' : ''}${b.resultPnL}
                          </span>
                        )}
                      </div>
                      {b.setupIds?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {b.setupIds.map((s) => (
                            <span
                              key={s._id || s}
                              className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]"
                            >
                              {s.title || s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {b.tradeImage && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(b.tradeImage)}
                        className="relative shrink-0 group"
                        title="بزرگ‌نمایی تصویر"
                      >
                        <img
                          src={b.tradeImage}
                          alt=""
                          className="w-16 h-16 object-cover rounded border group-hover:ring-2 group-hover:ring-primary-400"
                        />
                        <span className="absolute inset-0 flex items-center justify-center rounded bg-black/0 group-hover:bg-black/35 transition-colors">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-medium">
                            بزرگ
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="تصویر بک‌تست"
        size="xl"
        zIndexClass="z-[120]"
      >
        {previewImage && (
          <div className="flex justify-center bg-gray-950/5 rounded-lg p-2">
            <img
              src={previewImage}
              alt="تصویر بک‌تست"
              className="max-w-full max-h-[75vh] object-contain rounded"
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
