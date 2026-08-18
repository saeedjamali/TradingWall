'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = {
  tp: '#10b981',
  sl: '#ef4444',
  buy: '#059669',
  sell: '#e11d48',
  pnl: '#1e3a8a',
  bar: '#3b82f6',
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/95 text-gray-900 p-4 md:p-5 ${className}`}
    >
      <div className="mb-3">
        <h3 className="font-bold text-lg">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function EmptyChart({ height = 220 }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-gray-400"
      style={{ minHeight: height }}
    >
      داده‌ای برای نمودار نیست
    </div>
  )
}

function DailyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1" dir="rtl">
      <p className="font-bold">روز {d.day}</p>
      <p className="text-emerald-600">TP: {d.tp}</p>
      <p className="text-rose-600">SL: {d.sl}</p>
      <p className="text-gray-700">تعداد: {d.count}</p>
      {d.withRisk > 0 && (
        <p className={`font-bold ${d.pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          برایند: {d.pnl >= 0 ? '+' : ''}${d.pnl.toFixed(2)}
        </p>
      )}
    </div>
  )
}

function SimpleTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1" dir="rtl">
      <p className="font-bold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('en-US') : p.value}
        </p>
      ))}
    </div>
  )
}

export default function BacktestCharts({ backtests = [], monthStats, currentMonth }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const dailyData = []
  for (let day = 1; day <= daysInMonth; day++) {
    const items = backtests.filter((b) => {
      const d = new Date(b.date)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })
    let tp = 0
    let sl = 0
    let pnl = 0
    let withRisk = 0
    for (const b of items) {
      tp += b.tpHits || 0
      sl += b.slHits || 0
      if (b.resultPnL != null) {
        pnl += b.resultPnL
        withRisk += 1
      }
    }
    dailyData.push({
      day,
      tp,
      sl,
      count: items.length,
      pnl: Number(pnl.toFixed(2)),
      withRisk,
      countLabel: items.length > 0 ? String(items.length) : '',
    })
  }

  const setupData = (monthStats?.setupRows || []).slice(0, 8).map((r) => {
    const hits = r.tp + r.sl
    return {
      name: r.label?.length > 14 ? `${r.label.slice(0, 14)}…` : r.label,
      fullName: r.label,
      count: r.count,
      tp: r.tp,
      sl: r.sl,
      pnl: Number((r.pnl || 0).toFixed(2)),
      hitRate: hits > 0 ? Number(((r.tp / hits) * 100).toFixed(1)) : 0,
      unitNet: r.tp - r.sl,
    }
  })

  const sessionData = (monthStats?.sessionRows || []).map((r) => ({
    name: r.label,
    count: r.count,
    tp: r.tp,
    sl: r.sl,
    pnl: Number((r.pnl || 0).toFixed(2)),
  }))

  const symbolData = (monthStats?.symbolRows || []).slice(0, 8).map((r) => ({
    name: r.label,
    count: r.count,
    tp: r.tp,
    sl: r.sl,
  }))

  const directionData = (monthStats?.directionRows || []).map((r) => {
    const hits = r.tp + r.sl
    return {
      key: r.key,
      name: r.key === 'buy' ? 'خرید (Buy)' : 'فروش (Sell)',
      tp: r.tp,
      sl: r.sl,
      count: r.count,
      pnl: Number((r.pnl || 0).toFixed(2)),
      hitRate: hits > 0 ? Number(((r.tp / hits) * 100).toFixed(1)) : 0,
      tpPct: hits > 0 ? Number(((r.tp / hits) * 100).toFixed(1)) : 0,
      slPct: hits > 0 ? Number(((r.sl / hits) * 100).toFixed(1)) : 0,
    }
  })

  // Ensure both sides always appear in order: Buy then Sell
  const directionOrdered = ['buy', 'sell'].map((key) => {
    const found = directionData.find((d) => d.key === key)
    if (found) return found
    return {
      key,
      name: key === 'buy' ? 'خرید (Buy)' : 'فروش (Sell)',
      tp: 0,
      sl: 0,
      count: 0,
      pnl: 0,
      hitRate: 0,
      tpPct: 0,
      slPct: 0,
    }
  })

  const hitPie =
    monthStats && monthStats.tp + monthStats.sl > 0
      ? [
          { name: 'TP', value: monthStats.tp, color: COLORS.tp },
          { name: 'SL', value: monthStats.sl, color: COLORS.sl },
        ]
      : []

  const hasAny = (backtests || []).length > 0

  return (
    <div className="space-y-4" dir="rtl">
      <ChartCard
        title="نمودار عملکرد روزانه"
        subtitle="ستون = TP / SL · خط = برایند دلاری روز"
      >
        {!hasAny ? (
          <EmptyChart height={260} />
        ) : (
          <div className="h-[260px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dailyData}
                margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="18%"
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
                  yAxisId="hits"
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
                  width={42}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<DailyTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <ReferenceLine yAxisId="pnl" y={0} stroke="#9ca3af" strokeDasharray="4 4" />
                <Bar
                  yAxisId="hits"
                  dataKey="tp"
                  name="TP"
                  stackId="hits"
                  fill={COLORS.tp}
                  maxBarSize={16}
                />
                <Bar
                  yAxisId="hits"
                  dataKey="sl"
                  name="SL"
                  stackId="hits"
                  fill={COLORS.sl}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={16}
                />
                <Line
                  yAxisId="pnl"
                  type="monotone"
                  dataKey="pnl"
                  name="برایند ($)"
                  stroke={COLORS.pnl}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: COLORS.pnl, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="نسبت TP / SL" subtitle="توزیع برخوردها در ماه" className="lg:col-span-1">
          {hitPie.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-[220px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hitPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {hitPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="خرید / فروش (Buy / Sell)"
          subtitle="مقایسه تعداد TP و SL + درصد Hit Rate"
          className="lg:col-span-2"
        >
          {directionOrdered.every((d) => d.count === 0) ? (
            <EmptyChart />
          ) : (
            <div className="space-y-4">
              <div className="h-[200px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={directionOrdered}
                    margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#374151', fontWeight: 700 }}
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
                    <Tooltip content={<SimpleTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="tp"
                      name="TP"
                      fill={COLORS.tp}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={44}
                    />
                    <Bar
                      dataKey="sl"
                      name="SL"
                      fill={COLORS.sl}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={44}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[160px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={directionOrdered}
                    margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#374151', fontWeight: 700 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div
                            className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1"
                            dir="rtl"
                          >
                            <p className="font-bold">{d.name}</p>
                            <p>Hit Rate: {d.hitRate}%</p>
                            <p className="text-emerald-600">سهم TP: {d.tpPct}%</p>
                            <p className="text-rose-600">سهم SL: {d.slPct}%</p>
                          </div>
                        )
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="hitRate"
                      name="Hit Rate %"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="عملکرد ستاپ‌ها"
        subtitle="مقایسه TP / SL و Hit Rate به تفکیک ستاپ"
      >
        {setupData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-[280px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={setupData}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div
                          className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1"
                          dir="rtl"
                        >
                          <p className="font-bold">{d.fullName}</p>
                          <p>تعداد: {d.count}</p>
                          <p className="text-emerald-600">TP: {d.tp}</p>
                          <p className="text-rose-600">SL: {d.sl}</p>
                          <p>Hit Rate: {d.hitRate}%</p>
                          <p className={d.pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            ${d.pnl.toFixed(2)}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="tp"
                    name="TP"
                    stackId="hits"
                    fill={COLORS.tp}
                    maxBarSize={18}
                  />
                  <Bar
                    dataKey="sl"
                    name="SL"
                    stackId="hits"
                    fill={COLORS.sl}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[280px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={setupData}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div
                          className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm space-y-1"
                          dir="rtl"
                        >
                          <p className="font-bold">{d.fullName}</p>
                          <p>Hit Rate: {d.hitRate}%</p>
                          <p>
                            برایند واحد:{' '}
                            <span
                              className={
                                d.unitNet >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }
                            >
                              {d.unitNet >= 0 ? '+' : ''}
                              {d.unitNet}
                            </span>
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="hitRate"
                    name="Hit Rate %"
                    fill="#6366f1"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="عملکرد سشن‌ها" subtitle="TP و SL در هر سشن">
          {sessionData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-[240px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sessionData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#374151' }}
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
                  <Tooltip content={<SimpleTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="tp" name="TP" fill={COLORS.tp} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="sl" name="SL" fill={COLORS.sl} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {symbolData.length > 0 ? (
          <ChartCard title="عملکرد نمادها" subtitle="تعداد بک‌تست روی هر نماد">
            <div className="h-[240px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={symbolData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#374151' }}
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
                  <Tooltip content={<SimpleTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="tp" name="TP" stackId="sym" fill={COLORS.tp} maxBarSize={36} />
                  <Bar
                    dataKey="sl"
                    name="SL"
                    stackId="sym"
                    fill={COLORS.sl}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}
