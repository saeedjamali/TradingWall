'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  ReferenceLine,
} from 'recharts'

export default function MonthlyChart({ trades, currentMonth }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const chartData = []
  let monthWins = 0
  let monthLosses = 0
  let monthProfit = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6

    const dayTrades = (trades || []).filter((trade) => {
      const tradeDate = new Date(trade.closeTime)
      return (
        tradeDate.getDate() === day &&
        tradeDate.getMonth() === month &&
        tradeDate.getFullYear() === year
      )
    })

    const wins = dayTrades.filter((t) => t.profit > 0).length
    const losses = dayTrades.filter((t) => t.profit < 0).length
    const breakeven = dayTrades.filter((t) => t.profit === 0).length
    const profit = dayTrades.reduce((sum, t) => sum + t.profit, 0)
    const total = dayTrades.length

    monthWins += wins
    monthLosses += losses
    monthProfit += profit

    chartData.push({
      day,
      wins,
      losses,
      breakeven,
      profit: Number(profit.toFixed(2)),
      total,
      isWeekend,
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      // Only show count label when there are trades
      countLabel: total > 0 ? String(total) : '',
    })
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    if (data.total === 0 && data.isWeekend) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-bold">{data.dateLabel}</p>
          <p className="text-gray-500 text-xs">Weekend</p>
        </div>
      )
    }
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1">
        <p className="font-bold">{data.dateLabel}</p>
        <p className="text-green-600">✓ موفق: {data.wins}</p>
        <p className="text-red-600">✗ ناموفق: {data.losses}</p>
        {data.breakeven > 0 && (
          <p className="text-yellow-600">= سر به سر: {data.breakeven}</p>
        )}
        <p className="text-gray-700 font-medium">تعداد: {data.total}</p>
        <p className={`font-bold ${data.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
          برایند: ${data.profit.toFixed(2)}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4 shrink-0">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800">عملکرد روزانه ماه</h3>
          <p className="text-xs md:text-sm text-gray-500">{monthName} · موفق / ناموفق + برایند</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs md:text-sm">
          <span className="text-green-700 font-medium">✓ {monthWins} موفق</span>
          <span className="text-red-600 font-medium">✗ {monthLosses} ناموفق</span>
          <span className={`font-bold ${monthProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            ${monthProfit.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 8, left: 0, bottom: 8 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="count"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <YAxis
              yAxisId="pnl"
              orientation="right"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={28}
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
            />
            <ReferenceLine yAxisId="pnl" y={0} stroke="#9ca3af" strokeDasharray="4 4" />
            <Bar
              yAxisId="count"
              dataKey="wins"
              name="موفق"
              stackId="trades"
              fill="#10b981"
              radius={[0, 0, 0, 0]}
              maxBarSize={18}
            />
            <Bar
              yAxisId="count"
              dataKey="losses"
              name="ناموفق"
              stackId="trades"
              fill="#ef4444"
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            >
              <LabelList
                dataKey="countLabel"
                position="top"
                style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
              />
            </Bar>
            <Line
              yAxisId="pnl"
              type="monotone"
              dataKey="profit"
              name="برایند ($)"
              stroke="#1e3a8a"
              strokeWidth={2}
              dot={{ r: 3, fill: '#1e3a8a', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-center text-xs text-gray-400 mt-2 shrink-0">
        ستون = تعداد معاملات موفق/ناموفق · خط = برایند دلاری روز · عدد بالای ستون = کل معاملات
      </p>
    </div>
  )
}
