'use client'

import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function tradeNet(trade) {
  return (
    (Number(trade.profit) || 0) +
    (Number(trade.commission) || 0) +
    (Number(trade.swap) || 0)
  )
}

function drawdownFloor(maxDrawdown) {
  const drop = Math.abs(Number(maxDrawdown) || 0)
  if (drop === 0) return -1
  const step = drop > 1000 ? 200 : drop > 200 ? 100 : drop > 50 ? 20 : 10
  return -Math.ceil(drop / step) * step
}

function money(value) {
  const amount = Number(value || 0)
  return `${amount >= 0 ? '+' : ''}$${amount.toFixed(2)}`
}

function formatDay(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
}

function buildCurve(trades) {
  const sorted = [...(trades || [])]
    .filter((trade) => trade?.closeTime)
    .sort((a, b) => new Date(a.closeTime) - new Date(b.closeTime))

  let equity = 0
  let peak = 0
  let maxDrawdown = 0
  const points = []

  sorted.forEach((trade) => {
    const net = tradeNet(trade)
    equity += net
    if (equity > peak) peak = equity
    const drawdown = equity - peak
    const drop = peak - equity
    if (drop > maxDrawdown) maxDrawdown = drop

    const closeTime = new Date(trade.closeTime)
    points.push({
      key: String(trade._id || closeTime.getTime()),
      label: formatDay(closeTime),
      fullDate: closeTime.toLocaleDateString('fa-IR'),
      symbol: trade.symbol || '',
      net: Number(net.toFixed(2)),
      equity: Number(equity.toFixed(2)),
      peak: Number(peak.toFixed(2)),
      drawdown: Number(drawdown.toFixed(2)),
    })
  })

  const ending = points.length ? points[points.length - 1].equity : 0
  const peakEquity = points.reduce((best, point) => Math.max(best, point.peak), 0)

  return {
    points: points.length > 400 ? toDailyPoints(points) : points,
    ending: Number(ending.toFixed(2)),
    peakEquity: Number(peakEquity.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    tradeCount: sorted.length,
  }
}

function toDailyPoints(points) {
  const days = []
  let current = null

  points.forEach((point) => {
    if (!current || current.fullDate !== point.fullDate) {
      current = { ...point, trades: 1, dayNet: point.net }
      days.push(current)
      return
    }
    current.trades += 1
    current.dayNet = Number((current.dayNet + point.net).toFixed(2))
    current.equity = point.equity
    current.peak = point.peak
    current.net = point.net
    current.symbol = point.symbol
    if (point.drawdown < current.drawdown) current.drawdown = point.drawdown
  })

  return days
}

function CurveTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1">
      <p className="font-bold">{data.fullDate}</p>
      {data.symbol ? <p className="text-gray-500">{data.symbol}</p> : null}
      <p className={data.equity >= 0 ? 'text-emerald-700' : 'text-red-700'}>
        سرمایه تجمعی: {money(data.equity)}
      </p>
      <p className="text-gray-600">سقف تا اینجا: {money(data.peak)}</p>
      <p className="text-red-600 font-semibold">افت از سقف: {money(data.drawdown)}</p>
      <p className="text-gray-500">نتیجه معامله: {money(data.net)}</p>
    </div>
  )
}

export default function EquityDrawdownChart({ trades, currentMonth }) {
  const year = currentMonth.getFullYear()
  const { points, ending, peakEquity, maxDrawdown, tradeCount } = buildCurve(trades)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800">منحنی سرمایه و افت از سقف</h3>
          <p className="text-xs md:text-sm text-gray-500">
            {year} · جمع سود، کمیسیون و سواپ بعد از هر معامله بسته‌شده
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
          <span className={ending >= 0 ? 'text-emerald-700' : 'text-red-700'}>
            پایان: {money(ending)}
          </span>
          <span className="text-red-600">
            بیشترین افت: {money(-maxDrawdown)}
            {peakEquity > 0 ? ` از سقف ${money(peakEquity)}` : ''}
          </span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4 text-xs md:text-sm text-slate-700 space-y-2" dir="rtl">
        <p>
          <strong className="text-emerald-700">منحنی سبز:</strong>{' '}
          موجودی سود و زیان از ابتدای سال است. بعد از هر معامله، سود یا زیان به‌علاوه کمیسیون و سواپ به جمع قبلی اضافه می‌شود.
          بالای صفر یعنی از ابتدای سال در سود هستید و زیر صفر یعنی در زیان.
        </p>
        <p>
          <strong className="text-red-600">نمودار قرمز:</strong>{' '}
          فاصله تا آخرین سقف را نشان می‌دهد. روی صفر یعنی الان در بالاترین نقطه هستید.
          هرچه پایین‌تر برود، سرمایه بیشتر از سقف قبلی عقب افتاده است.
        </p>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2"
        >
          {showHelp ? 'بستن توضیح بیشتر' : 'توضیح بیشتر و مثال'}
        </button>
        {showHelp && (
          <div className="pt-2 border-t border-slate-200 space-y-2 text-slate-600">
            <p>
              <strong>سقف چیست؟</strong> بالاترین عددی است که منحنی سبز تا آن لحظه به آن رسیده.
              اگر بعد از آن چند معامله منفی شود، سقف همان‌جا می‌ماند تا دوباره از آن عبور کنید.
            </p>
            <p>
              <strong>بیشترین افت</strong> عمیق‌ترین فاصله منحنی با سقف قبلی در کل سال است، نه فقط وضعیت امروز.
              ممکن است الان کمی بالا آمده باشید، ولی هنوز افت بزرگ‌تری را پشت سر گذاشته باشید.
            </p>
            <p className="bg-white rounded px-2 py-1.5 border border-slate-100">
              <strong>مثال:</strong> از صفر شروع می‌کنید و به +۱۵۰ دلار می‌رسید؛ این سقف شماست و نمودار قرمز روی صفر است.
              بعد ۸۰ دلار ضرر می‌کنید: منحنی سبز می‌شود +۷۰ و افت از سقف −۸۰.
              اگر ۸۰ دلار دیگر هم از دست بدهید، سرمایه −۱۰ و افت از همان سقف ۱۵۰ دلاری می‌شود −۱۶۰.
            </p>
          </div>
        )}
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-gray-400 py-16 text-center">در این سال معامله بسته‌شده‌ای نیست.</p>
      ) : (
        <>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={points} syncId="equity-drawdown" margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CurveTooltip />} />
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="equity"
                  name="سرمایه"
                  stroke="#059669"
                  fill="#d1fae5"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={points} syncId="equity-drawdown" margin={{ top: 4, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  minTickGap={28}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  domain={[drawdownFloor(maxDrawdown), 0]}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CurveTooltip />} />
                <ReferenceLine y={0} stroke="#9ca3af" />
                <Area
                  type="stepAfter"
                  dataKey="drawdown"
                  name="افت از سقف"
                  stroke="#ef4444"
                  fill="#fecaca"
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            منحنی بالا سرمایه تجمعی است. نمودار پایین فاصله تا آخرین سقف را نشان می‌دهد
            {tradeCount ? ` · ${tradeCount} معامله` : ''}
          </p>
        </>
      )}
    </div>
  )
}
