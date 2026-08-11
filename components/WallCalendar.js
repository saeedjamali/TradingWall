'use client'

import { useMemo, useState } from 'react'
import Modal from '@/components/Modal'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatMoney(n) {
  const v = Number(n) || 0
  const sign = v > 0 ? '+' : v < 0 ? '-' : ''
  return `${sign}$${Math.abs(v).toFixed(2)}`
}

/**
 * Read-only trading calendar for public user wall
 */
export default function WallCalendar({ year, month, trades = [], plans = [] }) {
  const [selectedDay, setSelectedDay] = useState(null)

  const currentMonth = useMemo(() => new Date(year, month - 1, 1), [year, month])

  const { weeks, monthProfit, monthTradeCount, monthWinRate } = useMemo(() => {
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

    const monthProfitVal = trades.reduce((s, t) => s + (t.profit || 0), 0)
    const wins = trades.filter((t) => t.profit > 0).length
    const winRate = trades.length ? ((wins / trades.length) * 100).toFixed(1) : 0

    return {
      weeks: weeksArr,
      monthProfit: monthProfitVal,
      monthTradeCount: trades.length,
      monthWinRate: winRate,
    }
  }, [year, month, trades])

  const getDayTrades = (day) =>
    trades.filter((trade) => {
      const d = new Date(trade.closeTime)
      return (
        d.getDate() === day &&
        d.getMonth() === month - 1 &&
        d.getFullYear() === year
      )
    })

  const hasPlanOnDay = (day) => {
    const date = new Date(year, month - 1, day)
    return plans.some((plan) => {
      const planDate = new Date(plan.date)
      if (plan.period === 'daily') {
        return (
          planDate.getDate() === day &&
          planDate.getMonth() === month - 1 &&
          planDate.getFullYear() === year
        )
      }
      if (plan.period === 'monthly') {
        return planDate.getMonth() === month - 1 && planDate.getFullYear() === year
      }
      if (plan.period === 'weekly') {
        const weekStart = new Date(planDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        return date >= weekStart && date <= weekEnd
      }
      return false
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-sm text-gray-600">
          فقط مشاهده — {monthTradeCount} معامله · وین‌ریت {monthWinRate}%
        </div>
        <div
          className={`font-bold ${
            monthProfit > 0 ? 'text-emerald-600' : monthProfit < 0 ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          {formatMoney(monthProfit)}
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

                const dayTrades = getDayTrades(day)
                const dayProfit = dayTrades.reduce((s, t) => s + (t.profit || 0), 0)
                const hasTrades = dayTrades.length > 0
                const dow = new Date(year, month - 1, day).getDay()
                const isWeekend = dow === 0 || dow === 6
                const planned = hasPlanOnDay(day)

                let cellCls = 'bg-gray-50 border-gray-100'
                if (isWeekend) cellCls = 'bg-red-50/50 border-red-100'
                else if (hasTrades && dayProfit > 0) cellCls = 'bg-emerald-50 border-emerald-200'
                else if (hasTrades && dayProfit < 0) cellCls = 'bg-red-50 border-red-200'
                else if (hasTrades) cellCls = 'bg-gray-100 border-gray-200'

                return (
                  <button
                    key={`${wi}-${di}`}
                    type="button"
                    disabled={!hasTrades}
                    onClick={() =>
                      hasTrades &&
                      setSelectedDay({
                        day,
                        trades: dayTrades,
                        profit: dayProfit,
                      })
                    }
                    className={`min-h-[56px] md:min-h-[80px] rounded-lg border p-1.5 text-left transition-colors ${cellCls} ${
                      hasTrades ? 'hover:ring-2 hover:ring-primary-300 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-semibold text-gray-700">{day}</span>
                      {planned && <span className="text-[10px] text-primary-500">📋</span>}
                    </div>
                    {hasTrades && (
                      <div className="mt-1">
                        <p
                          className={`text-[11px] md:text-xs font-bold ${
                            dayProfit > 0
                              ? 'text-emerald-700'
                              : dayProfit < 0
                                ? 'text-red-700'
                                : 'text-gray-600'
                          }`}
                        >
                          {formatMoney(dayProfit)}
                        </p>
                        <p className="text-[10px] text-gray-500">{dayTrades.length}t</p>
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
            ? `معاملات ${selectedDay.day}/${month}/${year}`
            : 'معاملات'
        }
      >
        {selectedDay && (
          <div className="space-y-3" dir="rtl">
            <p
              className={`font-bold ${
                selectedDay.profit > 0
                  ? 'text-emerald-600'
                  : selectedDay.profit < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              مجموع روز: {formatMoney(selectedDay.profit)}
            </p>
            {selectedDay.trades.map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {t.symbol}{' '}
                    <span className="text-xs font-normal text-gray-500 uppercase">{t.type}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.closeTime ? new Date(t.closeTime).toLocaleString('fa-IR') : ''}
                  </p>
                </div>
                <span
                  className={`font-bold ${
                    t.profit > 0 ? 'text-emerald-600' : t.profit < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {formatMoney(t.profit)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
