'use client'

import { useMemo, useState } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'

export default function WinRateTrendChart({ trades, currentMonth }) {
  const [showHelp, setShowHelp] = useState(false)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const { chartData, finalWR, totalTrades, wins, losses } = useMemo(() => {
    const sorted = [...(trades || [])]
      .filter((t) => {
        const d = new Date(t.closeTime)
        return d.getMonth() === month && d.getFullYear() === year
      })
      .sort((a, b) => new Date(a.closeTime) - new Date(b.closeTime))

    let cumWins = 0
    let cumTotal = 0
    const byDay = {}

    sorted.forEach((t) => {
      const d = new Date(t.closeTime).getDate()
      if (!byDay[d]) byDay[d] = { wins: 0, total: 0 }
      byDay[d].total += 1
      if (t.profit > 0) byDay[d].wins += 1
    })

    const data = []
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStats = byDay[day]
      let dailyWR = null

      if (dayStats && dayStats.total > 0) {
        cumWins += dayStats.wins
        cumTotal += dayStats.total
        dailyWR = Number(((dayStats.wins / dayStats.total) * 100).toFixed(1))
      }

      const cumulativeWR =
        cumTotal > 0 ? Number(((cumWins / cumTotal) * 100).toFixed(1)) : null

      data.push({
        day,
        dailyWR,
        cumulativeWR,
        dayTrades: dayStats?.total || 0,
        dayWins: dayStats?.wins || 0,
        cumWinsSoFar: cumWins,
        cumTotalSoFar: cumTotal,
      })
    }

    let last = null
    data.forEach((row) => {
      if (row.cumulativeWR != null) last = row.cumulativeWR
      else if (last != null && cumTotal > 0) row.cumulativeWR = last
    })

    return {
      chartData: data,
      finalWR: cumTotal > 0 ? Number(((cumWins / cumTotal) * 100).toFixed(1)) : 0,
      totalTrades: cumTotal,
      wins: cumWins,
      losses: cumTotal - cumWins,
    }
  }, [trades, year, month, daysInMonth])

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1.5 max-w-[240px]" dir="rtl">
        <p className="font-bold text-gray-800">روز {data.day} ماه</p>
        {data.dayTrades > 0 ? (
          <>
            <p className="text-gray-700">
              در این روز: <strong>{data.dayWins}</strong> موفق از <strong>{data.dayTrades}</strong> معامله
            </p>
            <p className="text-sky-600">
              درصد موفقیت همین روز: <strong>{data.dailyWR}%</strong>
            </p>
          </>
        ) : (
          <p className="text-gray-400 text-xs">در این روز معامله‌ای ثبت نشده</p>
        )}
        {data.cumulativeWR != null && data.cumTotalSoFar > 0 && (
          <div className="pt-1.5 border-t border-gray-100 text-indigo-700">
            <p className="font-bold">از اول ماه تا اینجا: {data.cumulativeWR}%</p>
            <p className="text-xs text-indigo-500 mt-0.5">
              یعنی {data.cumWinsSoFar} موفق از مجموع {data.cumTotalSoFar} معامله تا این روز
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800">روند درصد موفقیت (Win Rate)</h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {monthName} — نشان می‌دهد در طول ماه چقدر معاملاتتان سودده بوده
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0 bg-indigo-50 rounded-lg px-3 py-2">
          <div className="text-[11px] text-indigo-500 mb-0.5">درصد موفقیت کل ماه</div>
          <div className="text-2xl font-bold text-indigo-700">{finalWR}%</div>
          <div className="text-xs text-gray-500">
            {wins} موفق · {losses} ناموفق
          </div>
        </div>
      </div>

      {/* Always-visible short guide */}
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4 text-xs md:text-sm text-slate-700 space-y-2" dir="rtl">
        <p>
          <strong className="text-indigo-700">خط بنفش (تجمعی):</strong>{' '}
          از اول ماه تا هر روز، چند درصد کل معاملاتتان موفق بوده.
          مثلاً اگر تا روز ۱۰، از ۲۰ معامله ۱۲ تا سود کرده باشند، عدد ۶۰٪ است.
        </p>
        <p>
          <strong className="text-sky-600">نقطه آبی (روزانه):</strong>{' '}
          فقط همان روز را نشان می‌دهد — چند درصد معاملات همان روز موفق بوده.
        </p>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
        >
          {showHelp ? 'بستن توضیح بیشتر' : 'توضیح بیشتر و مثال'}
        </button>
        {showHelp && (
          <div className="pt-2 border-t border-slate-200 space-y-2 text-slate-600">
            <p>
              <strong>Win Rate چیست؟</strong> نسبت معاملات سودده به کل معاملات.
              فرمول ساده: (تعداد موفق ÷ کل معاملات) × ۱۰۰
            </p>
            <p>
              <strong>چرا تجمعی مهم است؟</strong> یک روز بد یا خوب ممکن است تصادفی باشد؛
              خط بنفش روند واقعی ماه را نشان می‌دهد — آیا به مرور بهتر می‌شوید یا افت می‌کنید.
            </p>
            <p>
              <strong>خط چین ۵۰٪:</strong> اگر بالای این خط باشید، بیش از نصف معاملاتتان موفق بوده؛
              زیر آن یعنی اکثر معاملات ضرر بوده است.
            </p>
            <p className="bg-white rounded px-2 py-1.5 border border-slate-100">
              <strong>مثال:</strong> روز ۱: ۲ موفق از ۲ → روزانه ۱۰۰٪، تجمعی ۱۰۰٪.
              روز ۲: ۰ موفق از ۲ → روزانه ۰٪، تجمعی ۵۰٪ (۲ از ۴).
              یعنی با وجود روز بد، هنوز نصف معاملات ماه موفق‌اند.
            </p>
          </div>
        )}
      </div>

      {totalTrades === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
          هنوز معامله‌ای برای محاسبه درصد موفقیت ثبت نشده
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval="preserveStartEnd"
              label={{ value: 'روز ماه', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={32}
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => {
                if (value === 'cumulativeWR') return 'از اول ماه تا اینجا (%)'
                if (value === 'dailyWR') return 'فقط همان روز (%)'
                return value
              }}
            />
            <ReferenceLine y={50} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: '۵۰٪', position: 'right', fontSize: 10, fill: '#9ca3af' }} />
            <Area
              type="monotone"
              dataKey="cumulativeWR"
              name="cumulativeWR"
              stroke="#4f46e5"
              fill="#e0e7ff"
              strokeWidth={2.5}
              connectNulls
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="dailyWR"
              name="dailyWR"
              stroke="#0ea5e9"
              strokeWidth={0}
              connectNulls={false}
              dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
