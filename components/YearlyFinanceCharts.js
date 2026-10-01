'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function buildYearRows(trades, currentMonth) {
  const year = currentMonth.getFullYear()
  const selectedMonth = currentMonth.getMonth()
  const rows = []
  let yearProfit = 0
  let yearWins = 0
  let yearTotal = 0

  for (let month = 0; month < 12; month++) {
    const monthTrades = (trades || []).filter((trade) => {
      const tradeDate = new Date(trade.closeTime)
      return tradeDate.getMonth() === month && tradeDate.getFullYear() === year
    })
    const wins = monthTrades.filter((trade) => trade.profit > 0).length
    const losses = monthTrades.filter((trade) => trade.profit < 0).length
    const breakeven = monthTrades.filter((trade) => trade.profit === 0).length
    const grossProfit = monthTrades
      .filter((trade) => trade.profit > 0)
      .reduce((sum, trade) => sum + trade.profit, 0)
    const grossLoss = monthTrades
      .filter((trade) => trade.profit < 0)
      .reduce((sum, trade) => sum + trade.profit, 0)
    const net = monthTrades.reduce((sum, trade) => sum + trade.profit, 0)
    const total = monthTrades.length

    yearProfit += net
    yearWins += wins
    yearTotal += total

    rows.push({
      label: MONTH_LABELS[month],
      isCurrent: month === selectedMonth,
      wins,
      losses,
      breakeven,
      total,
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      net: Number(net.toFixed(2)),
      winRate: total > 0 ? Number(((wins / total) * 100).toFixed(1)) : null,
    })
  }

  return {
    year,
    rows,
    yearProfit: Number(yearProfit.toFixed(2)),
    yearWinRate: yearTotal > 0 ? Number(((yearWins / yearTotal) * 100).toFixed(1)) : 0,
    yearWins,
    yearTotal,
  }
}

function money(value) {
  const amount = Number(value || 0)
  return `${amount >= 0 ? '+' : ''}$${amount.toFixed(2)}`
}

function PnlTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1">
      <p className="font-bold">
        {data.label}
        {data.isCurrent ? ' · ماه انتخاب‌شده' : ''}
      </p>
      <p className="text-emerald-700">سود معاملات برنده: {money(data.grossProfit)}</p>
      <p className="text-red-600">زیان معاملات بازنده: {money(data.grossLoss)}</p>
      <p className={`font-bold ${data.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
        برایند: {money(data.net)}
      </p>
      <p className="text-gray-500">تعداد معاملات: {data.total}</p>
    </div>
  )
}

function WinRateTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1">
      <p className="font-bold">
        {data.label}
        {data.isCurrent ? ' · ماه انتخاب‌شده' : ''}
      </p>
      <p className="text-violet-700 font-bold">
        وین‌ریت: {data.winRate == null ? 'بدون معامله' : `${data.winRate}%`}
      </p>
      <p className="text-green-600">موفق: {data.wins}</p>
      <p className="text-red-600">ناموفق: {data.losses}</p>
      {data.breakeven > 0 && <p className="text-yellow-600">سر به سر: {data.breakeven}</p>}
      <p className="text-gray-500">کل: {data.total}</p>
    </div>
  )
}

export default function YearlyFinanceCharts({ trades, currentMonth, part }) {
  const { year, rows, yearProfit, yearWinRate, yearWins, yearTotal } = buildYearRows(
    trades,
    currentMonth,
  )
  const showPnl = part !== 'winrate'
  const showWinRate = part !== 'pnl'

  return (
    <div className={showPnl && showWinRate ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : ''}>
      {showPnl ? <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800">سود و زیان دلاری سال</h3>
            <p className="text-xs md:text-sm text-gray-500">{year} · برایند هر ماه به دلار</p>
          </div>
          <span className={`text-sm font-bold ${yearProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            سال: {money(yearProfit)}
          </span>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<PnlTooltip />} />
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
              <Bar dataKey="net" name="برایند ($)" maxBarSize={36} radius={[4, 4, 0, 0]}>
                {rows.map((row) => (
                  <Cell
                    key={row.label}
                    fill={row.net >= 0 ? '#10b981' : '#ef4444'}
                    stroke={row.isCurrent ? '#1e3a8a' : 'transparent'}
                    strokeWidth={row.isCurrent ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">ستون سبز = سود ماه · ستون قرمز = زیان ماه · حاشیه آبی = ماه انتخاب‌شده</p>
      </div> : null}

      {showWinRate ? <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800">وین‌ریت ماهانه سال</h3>
            <p className="text-xs md:text-sm text-gray-500">{year} · درصد معاملات موفق هر ماه</p>
          </div>
          <span className="text-sm font-bold text-violet-700">
            سال: {yearWinRate}% · {yearWins}/{yearTotal}
          </span>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={rows} margin={{ top: 24, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={36} tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<WinRateTooltip />} />
              <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={50} stroke="#9ca3af" strokeDasharray="4 4" />
              <Bar dataKey="winRate" name="وین‌ریت ماه" fill="#c4b5fd" maxBarSize={28} radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="winRate"
                name="روند وین‌ریت"
                stroke="#6d28d9"
                strokeWidth={2}
                connectNulls={false}
                dot={{ r: 3, fill: '#6d28d9', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">وین‌ریت = تعداد موفق ÷ کل معاملات ماه · خط چین = ۵۰٪ · ماه بدون معامله خالی می‌ماند</p>
      </div> : null}
    </div>
  )
}
