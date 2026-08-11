'use client'

function RankBadge({ rank }) {
  const cls =
    rank === 1
      ? 'bg-yellow-500 text-white'
      : rank === 2
        ? 'bg-gray-400 text-white'
        : rank === 3
          ? 'bg-orange-600 text-white'
          : 'bg-white/10 text-gray-300'
  return (
    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${cls}`}>
      {rank}
    </span>
  )
}

function formatMoney(n) {
  const v = Number(n) || 0
  const sign = v > 0 ? '+' : v < 0 ? '-' : ''
  return `${sign}$${Math.abs(v).toFixed(2)}`
}

function InsightCard({ title, subtitle, children, loading }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 md:p-6 border border-white/20">
      <h3 className="text-lg md:text-xl font-bold text-white mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg" />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="text-center text-gray-400 text-sm py-8">{text}</p>
}

/**
 * Geographic + setup insights for leaderboards page
 */
export default function LeaderboardInsights({ report, loading }) {
  const citiesByTraders = report?.cities?.byTraders || []
  const citiesByProfit = report?.cities?.byProfit || []
  const setupsByProfit = report?.setups?.byProfit || []
  const setupsByWinRate = report?.setups?.byWinRate || []
  const minSetupTrades = report?.setups?.minTrades || report?.notes?.setupMinTrades || 10

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">گزارش‌های تحلیلی</h2>
        <p className="text-sm text-gray-400">
          بر اساس شهر پروفایل کاربران و ستاپ‌های ثبت‌شده روی معاملات — کش روزانه
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <InsightCard
          title="🏙️ شهرهای با بیشترین معامله‌گر"
          subtitle="تعداد کاربران فعال دارای شهر در پروفایل"
          loading={loading}
        >
          {citiesByTraders.length === 0 ? (
            <EmptyState text="هنوز داده شهری کافی ثبت نشده است" />
          ) : (
            <div className="space-y-2">
              {citiesByTraders.map((row) => (
                <div
                  key={`t-${row.label}`}
                  className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RankBadge rank={row.rank} />
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{row.city}</p>
                      {row.province && (
                        <p className="text-xs text-gray-500 truncate">{row.province}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-emerald-400 font-bold">{row.traderCount} نفر</p>
                    <p className="text-xs text-gray-500">{row.tradeCount} معامله</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InsightCard>

        <InsightCard
          title="💰 سودده‌ترین شهرها"
          subtitle="مجموع سود معامله‌گران هر شهر"
          loading={loading}
        >
          {citiesByProfit.length === 0 ? (
            <EmptyState text="هنوز داده سود شهری موجود نیست" />
          ) : (
            <div className="space-y-2">
              {citiesByProfit.map((row) => (
                <div
                  key={`p-${row.label}`}
                  className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RankBadge rank={row.rank} />
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{row.city}</p>
                      <p className="text-xs text-gray-500">
                        {row.traderCount} معامله‌گر · WR {row.winRate}%
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className={`font-bold ${row.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatMoney(row.totalProfit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InsightCard>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <InsightCard
          title="🎯 ستاپ‌های با بیشترین بازدهی"
          subtitle={`مجموع سود دلاری · حداقل ${minSetupTrades} معامله`}
          loading={loading}
        >
          {setupsByProfit.length === 0 ? (
            <EmptyState text={`ستاپی با حداقل ${minSetupTrades} معامله یافت نشد`} />
          ) : (
            <div className="space-y-2">
              {setupsByProfit.map((row) => (
                <div
                  key={`sp-${row.setupId}`}
                  className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RankBadge rank={row.rank} />
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{row.title}</p>
                      <p className="text-xs text-gray-500">
                        {row.tradeCount} معامله · {row.traderCount} نفر · WR {row.winRate}%
                        {row.setupType === 'custom' ? ' · شخصی' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className={`font-bold ${row.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatMoney(row.totalProfit)}
                    </p>
                    <p className="text-xs text-gray-500">میانگین {formatMoney(row.avgProfit)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InsightCard>

        <InsightCard
          title="📈 ستاپ‌های با بالاترین وین‌ریت"
          subtitle={`درصد موفقیت · حداقل ${minSetupTrades} معامله`}
          loading={loading}
        >
          {setupsByWinRate.length === 0 ? (
            <EmptyState text={`ستاپی با حداقل ${minSetupTrades} معامله یافت نشد`} />
          ) : (
            <div className="space-y-2">
              {setupsByWinRate.map((row) => (
                <div
                  key={`sw-${row.setupId}`}
                  className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RankBadge rank={row.rank} />
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{row.title}</p>
                      <p className="text-xs text-gray-500">
                        {row.wins}W / {row.losses}L · {row.tradeCount} معامله
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-bold text-emerald-400">{row.winRate}%</p>
                    <p className={`text-xs ${row.totalProfit >= 0 ? 'text-emerald-500/80' : 'text-red-400'}`}>
                      {formatMoney(row.totalProfit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InsightCard>
      </div>
    </div>
  )
}
