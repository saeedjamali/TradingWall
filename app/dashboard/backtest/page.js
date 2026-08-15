'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import Modal from '@/components/Modal'
import BacktestModal from '@/components/BacktestModal'
import { UserName } from '@/components/VerifiedBadge'
import { getSessionUser } from '@/utils/session'
import { sameLocalDay, buildBacktestReports, sessionLabel } from '@/utils/backtest'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function monthBounds(monthDate) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function buildWeeks(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export default function BacktestPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [backtests, setBacktests] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [dayListOpen, setDayListOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('quick')
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    const u = getSessionUser()
    if (!u) {
      router.push('/auth/login')
      return
    }
    setUser(u)
  }, [router])

  const fetchMonth = useCallback(async (userId, monthDate) => {
    const { start, end } = monthBounds(monthDate)
    const params = new URLSearchParams({
      userId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    })
    const res = await fetch(`/api/backtests?${params}`)
    const data = await res.json()
    if (data.success) setBacktests(data.backtests || [])
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        await fetchMonth(user.id, currentMonth)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, currentMonth, fetchMonth])

  const dayItems = useCallback(
    (day) => {
      if (!day) return []
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      )
      return backtests.filter((b) => sameLocalDay(b.date, date))
    },
    [backtests, currentMonth],
  )

  const monthStats = useMemo(() => buildBacktestReports(backtests), [backtests])

  const weekStats = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    const weekItems = backtests.filter((b) => {
      const d = new Date(b.date)
      return d >= start && d <= end
    })
    return buildBacktestReports(weekItems)
  }, [backtests])

  const todayStats = useMemo(() => {
    const today = new Date()
    return buildBacktestReports(
      backtests.filter((b) => sameLocalDay(b.date, today)),
    )
  }, [backtests])

  const openDay = (day) => {
    if (!day) return
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    )
    const dow = date.getDay()
    if (dow === 0 || dow === 6) return
    setSelectedDate(date)
    setDayListOpen(true)
  }

  const openCreate = (mode = 'quick') => {
    setEditing(null)
    setFormMode(mode)
    setFormOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormMode('full')
    setFormOpen(true)
  }

  const handleSaved = async () => {
    if (user?.id) await fetchMonth(user.id, currentMonth)
  }

  const handleDelete = async (item) => {
    if (!confirm('این بک‌تست حذف شود؟')) return
    const res = await fetch(
      `/api/backtests/${item._id}?userId=${user.id}`,
      { method: 'DELETE' },
    )
    const data = await res.json()
    if (!data.success) {
      alert(data.error || 'خطا در حذف')
      return
    }
    await fetchMonth(user.id, currentMonth)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    router.push('/')
  }

  if (!user || loading) {
    return <Loading text="در حال بارگذاری بک‌تست..." />
  }

  const weeks = buildWeeks(currentMonth)
  const selectedDayItems = selectedDate
    ? backtests.filter((b) => sameLocalDay(b.date, selectedDate))
    : []

  const monthTitle = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="page-shell text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo/tradinggwall-logo-horizontal.svg"
                alt="Trading Wall"
                width={160}
                height={40}
                className="h-8 md:h-10 w-auto"
              />
            </Link>
            <span className="text-white/30 hidden md:inline">|</span>
            <h1 className="text-lg md:text-xl font-bold truncate">بک‌تست</h1>
          </div>
          <nav className="flex items-center gap-1 md:gap-2 text-sm">
            <Link
              href="/dashboard"
              className="hidden md:inline text-white/70 hover:text-white px-2"
            >
              دیوار معاملاتی
            </Link>
            <Link
              href="/dashboard/backtest"
              className="hidden md:inline text-primary-300 font-semibold px-2"
            >
              بک‌تست
            </Link>
            <Link
              href="/dashboard/trades"
              className="hidden md:inline text-white/70 hover:text-white px-2"
            >
              لیست معاملات
            </Link>
            <Link
              href="/profile"
              className="hidden md:inline text-white/70 hover:text-white px-2"
            >
              پروفایل
            </Link>
            <Link
              href="/dashboard"
              title="دیوار معاملاتی"
              className="md:hidden p-2 rounded-lg text-white/70 hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </Link>
            <Link
              href="/dashboard/trades"
              title="لیست معاملات"
              className="md:hidden p-2 rounded-lg text-white/70 hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </Link>
            <UserName
              name={user.publicName}
              verified={user.verified}
              className="hidden sm:inline-flex text-white/70 text-xs max-w-[120px]"
            />
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 text-xs"
            >
              خروج
            </button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" dir="rtl">
          <StatCard
            title="بک‌تست امروز"
            value={todayStats.count}
            tp={todayStats.tp}
            sl={todayStats.sl}
            unitNet={todayStats.unitNet}
            pnl={todayStats.withRisk ? todayStats.pnl : null}
          />
          <StatCard
            title="بک‌تست این هفته"
            value={weekStats.count}
            tp={weekStats.tp}
            sl={weekStats.sl}
            unitNet={weekStats.unitNet}
            pnl={weekStats.withRisk ? weekStats.pnl : null}
          />
          <StatCard
            title="بک‌تست این ماه"
            value={monthStats.count}
            tp={monthStats.tp}
            sl={monthStats.sl}
            unitNet={monthStats.unitNet}
            pnl={monthStats.withRisk ? monthStats.pnl : null}
          />
          <StatCard
            title="برایند ماه"
            value={
              monthStats.withRisk
                ? `${monthStats.pnl >= 0 ? '+' : ''}$${monthStats.pnl.toFixed(0)}`
                : `${monthStats.unitNet >= 0 ? '+' : ''}${monthStats.unitNet} R`
            }
            tp={monthStats.tp}
            sl={monthStats.sl}
            unitNet={monthStats.unitNet}
            tone={
              (monthStats.withRisk ? monthStats.pnl : monthStats.unitNet) > 0
                ? 'good'
                : (monthStats.withRisk ? monthStats.pnl : monthStats.unitNet) < 0
                  ? 'bad'
                  : 'neutral'
            }
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white text-gray-900 shadow-lg p-3 md:p-6 mb-6">
          <div className="text-center mb-4 relative px-10" dir="rtl">
            <h2 className="text-xl md:text-2xl font-bold">تقویم بک‌تست</h2>
            <p className="text-xs text-gray-500 mt-1">
              روی هر روز کلیک کنید تا بک‌تست‌های همان روز را ببینید یا مورد جدید اضافه کنید
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
              className="p-2 rounded-lg bg-primary-600 text-white"
            >
              ‹
            </button>
            <div className="min-w-[160px] text-center font-bold text-primary-800">
              {monthTitle}
            </div>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
              className="p-2 rounded-lg bg-primary-600 text-white"
            >
              ›
            </button>
          </div>

          <div dir="ltr" className="overflow-x-auto">
            <div className="min-w-[720px] md:min-w-0">
              <div className="grid grid-cols-8 gap-1.5 mb-2">
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d}
                    className={`text-center text-xs font-bold py-1 ${
                      d === 'Sat' || d === 'Sun' ? 'text-red-500' : 'text-gray-600'
                    }`}
                  >
                    {d}
                  </div>
                ))}
                <div className="text-center text-xs font-bold py-1 text-primary-700">
                  Week
                </div>
              </div>

              {weeks.map((week, wi) => {
                const weekItems = week.flatMap((day) =>
                  day == null ? [] : dayItems(day),
                )
                const weekTp = weekItems.reduce((s, b) => s + (b.tpHits || 0), 0)
                const weekSl = weekItems.reduce((s, b) => s + (b.slHits || 0), 0)
                const weekPnl = weekItems.reduce(
                  (s, b) => s + (b.resultPnL || 0),
                  0,
                )
                const hasWeek = weekItems.length > 0
                const isWeekProfit = hasWeek && weekPnl > 0
                const isWeekLoss = hasWeek && weekPnl < 0

                return (
                  <div key={wi} className="grid grid-cols-8 gap-1.5 mb-1.5">
                    {week.map((day, di) => {
                      if (day == null) {
                        return <div key={`e-${di}`} className="min-h-[88px]" />
                      }
                      const date = new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day,
                      )
                      const isWeekend =
                        date.getDay() === 0 || date.getDay() === 6
                      const items = dayItems(day)
                      const dayTp = items.reduce(
                        (s, b) => s + (b.tpHits || 0),
                        0,
                      )
                      const daySl = items.reduce(
                        (s, b) => s + (b.slHits || 0),
                        0,
                      )
                      const dayPnl = items.reduce(
                        (s, b) => s + (b.resultPnL || 0),
                        0,
                      )
                      const has = items.length > 0
                      const isProfit = has && dayPnl > 0
                      const isLoss = has && dayPnl < 0

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isWeekend}
                          onClick={() => openDay(day)}
                          className={`
                            text-left border rounded-xl p-1.5 min-h-[88px] md:min-h-[110px] transition-all flex flex-col
                            ${isWeekend ? 'bg-slate-200/70 border-slate-300 cursor-not-allowed opacity-80' : 'cursor-pointer hover:shadow-md'}
                            ${!isWeekend && isProfit ? 'bg-emerald-100 border-emerald-300' : ''}
                            ${!isWeekend && isLoss ? 'bg-rose-100 border-rose-300' : ''}
                            ${!isWeekend && has && dayPnl === 0 ? 'bg-amber-50 border-amber-200' : ''}
                            ${!isWeekend && !has ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : ''}
                          `}
                        >
                          <div className="text-xs font-bold text-slate-700">
                            {day}
                          </div>
                          {has && (
                            <div className="mt-1 space-y-0.5 text-[10px]">
                              <div className="font-semibold text-slate-700">
                                {items.length} backtest
                              </div>
                              <div>
                                <span className="text-emerald-700">
                                  TP {dayTp}
                                </span>
                                {' · '}
                                <span className="text-rose-700">
                                  SL {daySl}
                                </span>
                              </div>
                              {items.some((b) => b.resultPnL != null) && (
                                <div
                                  className={`font-bold tabular-nums ${
                                    dayPnl >= 0
                                      ? 'text-emerald-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {dayPnl >= 0 ? '+' : ''}$
                                  {dayPnl.toFixed(0)}
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      )
                    })}

                    <div
                      className={`
                        border-2 rounded-xl p-1.5 min-h-[88px] md:min-h-[110px] text-[10px] space-y-0.5
                        ${isWeekProfit ? 'bg-emerald-100 border-emerald-400' : ''}
                        ${isWeekLoss ? 'bg-rose-100 border-rose-400' : ''}
                        ${hasWeek && weekPnl === 0 ? 'bg-amber-100 border-amber-400' : ''}
                        ${!hasWeek ? 'bg-slate-50 border-slate-300' : ''}
                      `}
                    >
                      {hasWeek ? (
                        <>
                          <div
                            className={`font-bold text-xs tabular-nums ${
                              isWeekProfit
                                ? 'text-emerald-700'
                                : isWeekLoss
                                  ? 'text-rose-700'
                                  : 'text-amber-700'
                            }`}
                          >
                            {weekItems.some((b) => b.resultPnL != null)
                              ? `${weekPnl >= 0 ? '+' : ''}$${weekPnl.toFixed(0)}`
                              : `${weekTp - weekSl >= 0 ? '+' : ''}${weekTp - weekSl} R`}
                          </div>
                          <div className="text-slate-600">
                            {weekItems.length} BT
                          </div>
                          <div>
                            <span className="text-emerald-700">TP {weekTp}</span>
                            {' · '}
                            <span className="text-rose-700">SL {weekSl}</span>
                          </div>
                          <div className="text-slate-500 tabular-nums">
                            برایند: {weekTp - weekSl >= 0 ? '+' : ''}
                            {weekTp - weekSl} (TP−SL)
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400 text-center mt-4">—</div>
                      )}
                    </div>
                  </div>
                )
              })}

              <div className="grid grid-cols-8 gap-1.5 mt-2 pt-3 border-t-2 border-slate-200">
                <div className="col-span-7 text-right font-bold text-sm text-slate-700 flex items-center justify-end pr-2">
                  Month Total:
                </div>
                <div
                  className={`
                    border-2 rounded-xl p-2 text-[10px] space-y-0.5
                    ${monthStats.pnl > 0 ? 'bg-emerald-100 border-emerald-500' : ''}
                    ${monthStats.pnl < 0 ? 'bg-rose-100 border-rose-500' : ''}
                    ${monthStats.count > 0 && monthStats.pnl === 0 ? 'bg-amber-100 border-amber-500' : ''}
                    ${monthStats.count === 0 ? 'bg-slate-50 border-slate-300' : ''}
                  `}
                >
                  {monthStats.count > 0 ? (
                    <>
                      <div
                        className={`font-bold text-xs tabular-nums ${
                          monthStats.pnl > 0 || monthStats.unitNet > 0
                            ? 'text-emerald-700'
                            : monthStats.pnl < 0 || monthStats.unitNet < 0
                              ? 'text-rose-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {monthStats.withRisk
                          ? `${monthStats.pnl >= 0 ? '+' : ''}$${monthStats.pnl.toFixed(0)}`
                          : `${monthStats.unitNet >= 0 ? '+' : ''}${monthStats.unitNet} R`}
                      </div>
                      <div className="text-slate-600">
                        {monthStats.count} BT
                      </div>
                      <div>
                        <span className="text-emerald-700">
                          TP {monthStats.tp}
                        </span>
                        {' · '}
                        <span className="text-rose-700">
                          SL {monthStats.sl}
                        </span>
                      </div>
                      <div className="text-slate-500 tabular-nums">
                        برایند: {monthStats.unitNet >= 0 ? '+' : ''}
                        {monthStats.unitNet} (TP−SL)
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 text-center">—</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports */}
        <div className="space-y-4 mb-8" dir="rtl">
          <div className="rounded-xl border border-white/10 bg-white/95 text-gray-900 p-4 md:p-5">
            <h3 className="font-bold text-lg mb-3">خلاصه عملکرد ماه</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
              <MiniStat label="بک‌تست" value={monthStats.count} color="text-gray-900" />
              <MiniStat label="TP" value={monthStats.tp} color="text-emerald-700" />
              <MiniStat label="SL" value={monthStats.sl} color="text-rose-700" />
              <MiniStat
                label="Hit Rate"
                value={
                  monthStats.hitRate != null
                    ? `${monthStats.hitRate.toFixed(1)}%`
                    : '—'
                }
                color="text-primary-700"
              />
              <MiniStat
                label="Profit Factor"
                value={
                  monthStats.profitFactor == null
                    ? '—'
                    : monthStats.profitFactor === Infinity
                      ? '∞'
                      : monthStats.profitFactor.toFixed(2)
                }
                color="text-indigo-700"
              />
              <MiniStat
                label="Expectancy"
                value={
                  monthStats.expectancy != null
                    ? `${monthStats.expectancy >= 0 ? '+' : ''}${monthStats.expectancy.toFixed(2)} R`
                    : '—'
                }
                color="text-amber-700"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <div className="text-xs text-gray-500 mb-1">برایند واحد (TP−SL)</div>
                <div className="font-bold tabular-nums">
                  {monthStats.unitNet >= 0 ? '+' : ''}
                  {monthStats.unitNet}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <div className="text-xs text-gray-500 mb-1">برایند دلاری</div>
                <div
                  className={`font-bold tabular-nums ${
                    monthStats.pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {monthStats.withRisk
                    ? `${monthStats.pnl >= 0 ? '+' : ''}$${monthStats.pnl.toFixed(2)}`
                    : '—'}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <div className="text-xs text-gray-500 mb-1">میانگین $/بک‌تست</div>
                <div className="font-bold tabular-nums">
                  {monthStats.avgPnl != null
                    ? `${monthStats.avgPnl >= 0 ? '+' : ''}$${monthStats.avgPnl.toFixed(2)}`
                    : '—'}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <div className="text-xs text-gray-500 mb-1">روز فعال / میانگین روزانه</div>
                <div className="font-bold tabular-nums">
                  {monthStats.activeDays} روز
                  {monthStats.avgPerDay != null ? ` · ${monthStats.avgPerDay} BT` : ''}
                </div>
              </div>
            </div>
            {(monthStats.bestDay || monthStats.worstDay || monthStats.avgRr != null) && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
                {monthStats.avgRr != null && (
                  <span>میانگین RR: {monthStats.avgRr.toFixed(2)}</span>
                )}
                {monthStats.bestDay && (
                  <span className="text-emerald-700">
                    بهترین روز: {monthStats.bestDay.label} (
                    {monthStats.bestDay.pnl >= 0 ? '+' : ''}$
                    {monthStats.bestDay.pnl.toFixed(0)})
                  </span>
                )}
                {monthStats.worstDay && (
                  <span className="text-rose-700">
                    ضعیف‌ترین روز: {monthStats.worstDay.label} (
                    {monthStats.worstDay.pnl >= 0 ? '+' : ''}$
                    {monthStats.worstDay.pnl.toFixed(0)})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportTable
              title="عملکرد ستاپ‌ها"
              empty="هنوز ستاپی روی بک‌تست‌ها ثبت نشده"
              rows={monthStats.setupRows}
            />
            <ReportTable
              title="عملکرد سشن‌ها"
              empty="داده‌ای برای سشن‌ها نیست"
              rows={monthStats.sessionRows}
            />
            <ReportTable
              title="عملکرد نمادها"
              empty="نماد ثبت‌شده‌ای نیست"
              rows={monthStats.symbolRows}
            />
            <ReportTable
              title="عملکرد تایم‌فریم"
              empty="تایم‌فریمی ثبت نشده"
              rows={monthStats.timeframeRows}
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/95 text-gray-900 p-4 md:p-5">
            <h3 className="font-bold text-lg mb-3">Buy / Sell</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {monthStats.directionRows.map((row) => {
                const rate =
                  row.tp + row.sl > 0
                    ? ((row.tp / (row.tp + row.sl)) * 100).toFixed(1)
                    : null
                return (
                  <div
                    key={row.key}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`font-bold ${
                          row.key === 'buy' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {row.label}
                      </span>
                      <span className="text-xs text-gray-500">{row.count} بک‌تست</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      TP {row.tp} · SL {row.sl}
                      {rate != null ? ` · HR ${rate}%` : ''}
                    </div>
                    <div
                      className={`mt-1 font-bold tabular-nums text-sm ${
                        row.pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {row.withRisk
                        ? `${row.pnl >= 0 ? '+' : ''}$${row.pnl.toFixed(2)}`
                        : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Day list modal */}
      <Modal
        isOpen={dayListOpen}
        onClose={() => {
          setDayListOpen(false)
          setSelectedDate(null)
        }}
        title={
          selectedDate
            ? `بک‌تست‌های ${selectedDate.toLocaleDateString('fa-IR')}`
            : 'بک‌تست‌های روز'
        }
        size="lg"
      >
        <div className="space-y-3" dir="rtl">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openCreate('quick')}
              className="py-2.5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
            >
              ⚡ ثبت سریع
            </button>
            <button
              type="button"
              onClick={() => openCreate('full')}
              className="py-2.5 rounded-lg border border-primary-300 text-primary-700 text-sm font-semibold hover:bg-primary-50"
            >
              ➕ فرم کامل
            </button>
          </div>

          {selectedDayItems.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">
              برای این روز بک‌تستی ثبت نشده است
            </p>
          ) : (
            <ul className="space-y-3 max-h-[55vh] overflow-y-auto">
              {selectedDayItems.map((b) => (
                <li
                  key={b._id}
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-gray-900">
                        {b.symbol}{' '}
                        <span
                          className={
                            b.direction === 'buy'
                              ? 'text-emerald-600'
                              : 'text-rose-600'
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
                        {b.risk != null ? ` · Risk $${b.risk}` : ''}
                        {b.resultPnL != null && (
                          <span
                            className={`mr-2 font-bold ${
                              b.resultPnL >= 0
                                ? 'text-emerald-700'
                                : 'text-rose-700'
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
                      {b.lesson && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          درس: {b.lesson}
                        </p>
                      )}
                    </div>
                    {b.tradeImage && (
                      <img
                        src={b.tradeImage}
                        alt=""
                        className="w-16 h-16 object-cover rounded border"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="px-3 py-1 text-xs rounded bg-blue-600 text-white"
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b)}
                      className="px-3 py-1 text-xs rounded bg-red-50 text-red-700"
                    >
                      حذف
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <BacktestModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        userId={user.id}
        date={selectedDate || new Date()}
        existing={editing}
        onSaved={handleSaved}
        initialMode={formMode}
      />
    </div>
  )
}

function StatCard({ title, value, tp, sl, unitNet, pnl, tone = 'neutral' }) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-300'
      : tone === 'bad'
        ? 'text-rose-300'
        : 'text-white'
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
      <div className="text-xs text-white/60 mb-1">{title}</div>
      <div className={`text-xl md:text-2xl font-bold tabular-nums ${toneClass}`}>
        {value}
      </div>
      {(tp != null || sl != null) && (
        <div className="text-[11px] mt-1.5">
          <span className="text-emerald-300/90">TP {tp ?? 0}</span>
          <span className="text-white/40"> · </span>
          <span className="text-rose-300/90">SL {sl ?? 0}</span>
        </div>
      )}
      {(unitNet != null || pnl != null) && (
        <div className="text-[10px] text-white/55 mt-1 tabular-nums">
          {unitNet != null && (
            <span>
              برایند: {unitNet >= 0 ? '+' : ''}
              {unitNet} (TP−SL)
            </span>
          )}
          {pnl != null && (
            <span className={pnl >= 0 ? 'text-emerald-300/80' : 'text-rose-300/80'}>
              {' '}
              · {pnl >= 0 ? '+' : ''}${Number(pnl).toFixed(0)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-2 text-center">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  )
}

function ReportTable({ title, empty, rows }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/95 text-gray-900 p-4 md:p-5">
      <h3 className="font-bold text-lg mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {rows.map((row) => {
            const rate =
              row.tp + row.sl > 0
                ? ((row.tp / (row.tp + row.sl)) * 100).toFixed(0)
                : null
            return (
              <li
                key={row.key}
                className="flex items-center justify-between gap-2 text-sm border-b border-gray-100 pb-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{row.label}</div>
                  <div className="text-xs text-gray-500">
                    {row.count} بک‌تست · TP {row.tp} · SL {row.sl}
                    {rate != null ? ` · ${rate}%` : ''}
                  </div>
                </div>
                <div
                  className={`shrink-0 font-bold tabular-nums text-xs ${
                    row.pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {row.withRisk
                    ? `${row.pnl >= 0 ? '+' : ''}$${row.pnl.toFixed(0)}`
                    : '—'}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
