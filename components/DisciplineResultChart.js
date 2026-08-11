'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  ReferenceLine,
  Cell,
} from 'recharts'
import { checkPlanCompliance, getPlanForDate } from '@/utils/planCompliance'

export default function DisciplineResultChart({ trades, currentMonth, userId }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!userId) return
    const fetchPlans = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/plans?userId=${userId}`)
        const data = await response.json()
        if (data.success) setPlans(data.plans || [])
      } catch (error) {
        console.error('Error fetching plans for discipline chart:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [userId, currentMonth])

  const { categories, hasData } = useMemo(() => {
    const monthTrades = (trades || []).filter((t) => {
      const d = new Date(t.closeTime)
      return d.getMonth() === month && d.getFullYear() === year
    })

    const buckets = {
      disciplined: { trades: [], profit: 0, wins: 0, losses: 0, days: 0 },
      undisciplined: { trades: [], profit: 0, wins: 0, losses: 0, days: 0 },
      noPlan: { trades: [], profit: 0, wins: 0, losses: 0, days: 0 },
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (date.getDay() === 0 || date.getDay() === 6) continue

      const dayTrades = monthTrades.filter((t) => new Date(t.closeTime).getDate() === day)
      if (dayTrades.length === 0) continue

      const plan = getPlanForDate(plans, date)
      const compliance = checkPlanCompliance(dayTrades, plan)
      const dayProfit = dayTrades.reduce((s, t) => s + t.profit, 0)

      let key = 'noPlan'
      if (plan) {
        key = compliance.undisciplined.length === 0 ? 'disciplined' : 'undisciplined'
      }

      buckets[key].days += 1
      buckets[key].profit += dayProfit
      buckets[key].trades.push(...dayTrades)
      buckets[key].wins += dayTrades.filter((t) => t.profit > 0).length
      buckets[key].losses += dayTrades.filter((t) => t.profit < 0).length
    }

    const makeCategory = (key, name, color, bucket) => ({
      key,
      name,
      days: bucket.days,
      trades: bucket.trades.length,
      wins: bucket.wins,
      losses: bucket.losses,
      profit: Number(bucket.profit.toFixed(2)),
      avgProfit: bucket.days > 0 ? Number((bucket.profit / bucket.days).toFixed(2)) : 0,
      winRate:
        bucket.trades.length > 0
          ? Number(((bucket.wins / bucket.trades.length) * 100).toFixed(1))
          : 0,
      color,
    })

    const categories = [
      makeCategory('disciplined', 'منظم', '#3b82f6', buckets.disciplined),
      makeCategory('undisciplined', 'نامنظم', '#f97316', buckets.undisciplined),
      makeCategory('noPlan', 'بدون پلن', '#9ca3af', buckets.noPlan),
    ]

    return {
      categories,
      hasData: monthTrades.length > 0,
    }
  }, [trades, plans, year, month])

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1.5 max-w-[260px]" dir="rtl">
        <p className="font-bold text-gray-800">روزهای «{data.name}»</p>
        <p className="text-gray-600">
          {data.days} روز معاملاتی · {data.trades} معامله
        </p>
        <p className="text-green-600">معاملات موفق: {data.wins}</p>
        <p className="text-red-600">معاملات ناموفق: {data.losses}</p>
        <p className="text-indigo-600">درصد موفقیت این دسته: {data.winRate}%</p>
        <div className="pt-1.5 border-t border-gray-100">
          <p className={`font-bold ${data.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            مجموع سود/زیان: ${data.profit.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            میانگین هر روز: ${data.avgProfit.toFixed(2)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="mb-3">
        <h3 className="text-lg md:text-xl font-bold text-gray-800">انضباط در برابر نتیجه</h3>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          {monthName} — آیا روزهایی که طبق پلن معامله کردید نتیجه بهتری داشته‌اند؟
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4 text-xs md:text-sm text-slate-700 space-y-2" dir="rtl">
        <p>
          <strong className="text-blue-600">منظم:</strong> آن روز پلن داشته‌اید و همه معاملات در محدوده پلن
          (مثل Max Trades و Max Loss) بوده‌اند.
        </p>
        <p>
          <strong className="text-orange-600">نامنظم:</strong> پلن داشته‌اید ولی حداقل یک معامله از قوانین پلن خارج شده.
        </p>
        <p>
          <strong className="text-gray-500">بدون پلن:</strong> معامله کرده‌اید ولی برای آن روز/هفته/ماه پلنی ثبت نشده.
        </p>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
        >
          {showHelp ? 'بستن توضیح بیشتر' : 'توضیح بیشتر و نحوه خواندن نمودار'}
        </button>
        {showHelp && (
          <div className="pt-2 border-t border-slate-200 space-y-2 text-slate-600">
            <p>
              <strong>ارتفاع ستون چیست؟</strong> مجموع سود یا زیان دلاری همان دسته در کل ماه.
              ستون بالاتر یعنی آن سبک معامله پول بیشتری ساخته (یا از دست داده).
            </p>
            <p>
              <strong>عدد بالای ستون:</strong> تعداد کل معاملات آن دسته.
            </p>
            <p>
              <strong>کارت‌های بالا:</strong> چند روز در هر دسته بوده‌اید و برایند دلاری همان دسته چقدر است.
            </p>
            <p className="bg-white rounded px-2 py-1.5 border border-slate-100">
              <strong>چطور استفاده کنید؟</strong> اگر برایند «منظم» بهتر از «نامنظم» است، یعنی رعایت پلن واقعاً به نفع شماست.
              اگر برعکس است، یا پلن خیلی سخت است یا باید قوانین پلن را بازبینی کنید.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {categories.map((c) => (
          <div
            key={c.key}
            className="rounded-lg border px-2 py-2 text-center"
            style={{ borderColor: `${c.color}55`, backgroundColor: `${c.color}12` }}
          >
            <div className="text-xs text-gray-600">{c.name}</div>
            <div className="text-lg font-bold" style={{ color: c.color }}>
              {c.days} روز
            </div>
            <div className={`text-xs font-semibold ${c.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${c.profit.toFixed(0)}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{c.trades} معامله</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
          در حال بارگذاری...
        </div>
      ) : !hasData ? (
        <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm text-center px-4">
          معامله‌ای برای مقایسه نیست. بعد از ثبت معامله و پلن، اینجا مقایسه می‌شود.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categories} margin={{ top: 24, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              yAxisId="pnl"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={28}
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
              formatter={() => 'مجموع سود یا زیان این دسته ($)'}
            />
            <ReferenceLine yAxisId="pnl" y={0} stroke="#9ca3af" strokeDasharray="4 4" />
            <Bar
              yAxisId="pnl"
              dataKey="profit"
              name="profit"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
            >
              {categories.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.profit >= 0 ? entry.color : '#ef4444'}
                  fillOpacity={entry.profit >= 0 ? 0.85 : 0.75}
                />
              ))}
              <LabelList
                dataKey="trades"
                position="top"
                formatter={(v) => (v > 0 ? `${v} معامله` : '')}
                style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {hasData && !loading && <InsightLine categories={categories} />}
    </div>
  )
}

function InsightLine({ categories }) {
  const disciplined = categories.find((c) => c.key === 'disciplined')
  const undisciplined = categories.find((c) => c.key === 'undisciplined')
  const noPlan = categories.find((c) => c.key === 'noPlan')

  if (!disciplined?.days && !undisciplined?.days) {
    if (noPlan?.days > 0) {
      return (
        <p className="text-xs text-center text-amber-800 bg-amber-50 rounded-lg px-3 py-2.5 mt-3" dir="rtl">
          همه روزهای معاملاتی این ماه <strong>بدون پلن</strong> بوده‌اند.
          با ثبت پلن روزانه/هفتگی می‌توانید ببینید رعایت قوانین چقدر روی نتیجه اثر دارد.
        </p>
      )
    }
    return null
  }

  if (disciplined?.days > 0 && undisciplined?.days > 0) {
    const disciplinedBetter = disciplined.avgProfit >= undisciplined.avgProfit
    return (
      <p className="text-xs text-center text-slate-700 bg-slate-50 rounded-lg px-3 py-2.5 mt-3" dir="rtl">
        {disciplinedBetter ? (
          <>
            روزهای <strong className="text-blue-600">منظم</strong> میانگین بهتری داشته‌اند
            (${disciplined.avgProfit.toFixed(2)} در روز) نسبت به روزهای نامنظم (${undisciplined.avgProfit.toFixed(2)}).
            رعایت پلن ظاهراً به نفع شماست.
          </>
        ) : (
          <>
            روزهای <strong className="text-orange-600">نامنظم</strong> میانگین بهتری نشان داده‌اند
            (${undisciplined.avgProfit.toFixed(2)} در برابر ${disciplined.avgProfit.toFixed(2)}).
            شاید پلن خیلی سخت باشد یا نیاز به بازبینی داشته باشد.
          </>
        )}
        {' '}
        درصد موفقیت: منظم {disciplined.winRate}% · نامنظم {undisciplined.winRate}%
      </p>
    )
  }

  return null
}
