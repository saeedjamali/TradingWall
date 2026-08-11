'use client'

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
} from 'recharts'

export default function BuySellChart({ trades, currentMonth }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const monthTrades = (trades || []).filter((trade) => {
    const d = new Date(trade.closeTime)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const buyWins = monthTrades.filter((t) => t.type === 'buy' && t.profit > 0).length
  const buyLosses = monthTrades.filter((t) => t.type === 'buy' && t.profit < 0).length
  const buyBreakeven = monthTrades.filter((t) => t.type === 'buy' && t.profit === 0).length
  const sellWins = monthTrades.filter((t) => t.type === 'sell' && t.profit > 0).length
  const sellLosses = monthTrades.filter((t) => t.type === 'sell' && t.profit < 0).length
  const sellBreakeven = monthTrades.filter((t) => t.type === 'sell' && t.profit === 0).length

  const buyTotal = buyWins + buyLosses + buyBreakeven
  const sellTotal = sellWins + sellLosses + sellBreakeven
  const buyProfit = monthTrades
    .filter((t) => t.type === 'buy')
    .reduce((s, t) => s + t.profit, 0)
  const sellProfit = monthTrades
    .filter((t) => t.type === 'sell')
    .reduce((s, t) => s + t.profit, 0)

  const chartData = [
    {
      name: 'Buy',
      label: 'خرید',
      wins: buyWins,
      losses: buyLosses,
      total: buyTotal,
      profit: buyProfit,
      countLabel: buyTotal > 0 ? String(buyTotal) : '',
    },
    {
      name: 'Sell',
      label: 'فروش',
      wins: sellWins,
      losses: sellLosses,
      total: sellTotal,
      profit: sellProfit,
      countLabel: sellTotal > 0 ? String(sellTotal) : '',
    },
  ]

  // Compact summary cards data
  const summary = [
    { title: 'Buy موفق', value: buyWins, color: 'bg-green-50 text-green-700 border-green-200' },
    { title: 'Buy ناموفق', value: buyLosses, color: 'bg-red-50 text-red-700 border-red-200' },
    { title: 'Sell موفق', value: sellWins, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { title: 'Sell ناموفق', value: sellLosses, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1">
        <p className="font-bold">{data.label} ({data.name})</p>
        <p className="text-green-600">✓ موفق: {data.wins}</p>
        <p className="text-red-600">✗ ناموفق: {data.losses}</p>
        <p className="text-gray-700">تعداد کل: {data.total}</p>
        <p className={`font-bold ${data.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
          برایند: ${data.profit.toFixed(2)}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 h-full flex flex-col">
      <div className="mb-4 shrink-0">
        <h3 className="text-lg md:text-xl font-bold text-gray-800">خرید و فروش</h3>
        <p className="text-xs md:text-sm text-gray-500">{monthName} · Buy / Sell · موفق و ناموفق</p>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 shrink-0">
        {summary.map((item) => (
          <div
            key={item.title}
            className={`border rounded-lg px-3 py-2 text-center ${item.color}`}
          >
            <div className="text-xs opacity-80">{item.title}</div>
            <div className="text-xl font-bold">{item.value}</div>
          </div>
        ))}
      </div>

      {monthTrades.length === 0 ? (
        <div className="flex-1 min-h-[280px] flex items-center justify-center text-gray-400 text-sm">
          معامله‌ای در این ماه ثبت نشده
        </div>
      ) : (
        <div className="flex-1 min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
              barCategoryGap="35%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 13, fill: '#374151', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="wins"
                name="موفق"
                stackId="side"
                fill="#10b981"
                maxBarSize={64}
              />
              <Bar
                dataKey="losses"
                name="ناموفق"
                stackId="side"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
                maxBarSize={64}
              >
                <LabelList
                  dataKey="countLabel"
                  position="top"
                  style={{ fontSize: 13, fill: '#1f2937', fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-gray-500 shrink-0">
        <span>
          Buy برایند:{' '}
          <strong className={buyProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${buyProfit.toFixed(2)}
          </strong>
        </span>
        <span>
          Sell برایند:{' '}
          <strong className={sellProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${sellProfit.toFixed(2)}
          </strong>
        </span>
      </div>
    </div>
  )
}
