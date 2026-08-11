'use client'

import { useState } from 'react'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'

function formatValue(metric, value) {
  if (metric === 'winrate') return `${Number(value).toFixed(1)}%`
  const n = Number(value)
  const sign = n >= 0 ? '' : '-'
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

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
    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0 ${cls}`}>
      {rank}
    </span>
  )
}

function TraderRow({ entry, metric }) {
  const name = entry.publicName || entry.name || 'کاربر'
  const userId = entry.userId?._id || entry.userId

  return (
    <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <RankBadge rank={entry.rank} />
        <div className="flex items-center gap-1 min-w-0">
          {userId ? (
            <Link
              href={`/wall/${userId}`}
              className="text-white truncate hover:text-primary-300 hover:underline transition-colors"
              title={entry.wallPublic === false ? 'دیوار خصوصی — وضعیت را ببینید' : 'مشاهده دیوار کاربر'}
            >
              {name}
            </Link>
          ) : (
            <span className="text-white truncate">{name}</span>
          )}
          {entry.verified && <VerifiedBadge className="w-4 h-4 text-blue-400" />}
        </div>
      </div>
      <div className="text-left shrink-0">
        <span className={`font-bold ${metric === 'profit' && Number(entry.value) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatValue(metric, entry.value)}
        </span>
        {entry.tradeCount != null && (
          <p className="text-xs text-gray-500 mt-0.5">{entry.tradeCount} معامله</p>
        )}
      </div>
    </div>
  )
}

/**
 * Board with top 3 visible + expandable ranks 4–10
 */
export default function LeaderboardBoard({
  title,
  description,
  periodLabel,
  minTrades,
  metric = 'winrate',
  entries = [],
  loading = false,
  compact = false,
}) {
  const [expanded, setExpanded] = useState(false)
  const list = Array.isArray(entries) ? entries : []
  const top3 = list.slice(0, 3)
  const rest = list.slice(3, 10)

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 md:p-6 border border-white/20 flex flex-col">
      <h3 className={`font-bold text-white mb-1 ${compact ? 'text-lg' : 'text-xl'}`}>{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-1">{description}</p>}
      {periodLabel && <p className="text-xs text-primary-300 mb-2">{periodLabel}</p>}
      {minTrades != null && (
        <p className="text-xs text-gray-500 mb-4">حداقل {minTrades} معامله</p>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg" />
          ))}
        </div>
      ) : top3.length === 0 ? (
        <p className="text-gray-400 text-center text-sm py-6">
          هنوز معامله‌گری با حداقل معاملات لازم در این دوره نیست
        </p>
      ) : (
        <div className="space-y-2.5 flex-1">
          {top3.map((entry) => (
            <TraderRow key={`${entry.rank}-${entry.userId || entry.publicName}`} entry={entry} metric={metric} />
          ))}

          {rest.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full text-sm text-primary-300 hover:text-primary-200 py-2 flex items-center justify-center gap-1 transition-colors"
              >
                {expanded ? 'بستن لیست' : `مشاهده ${rest.length} نفر بعدی`}
                <svg
                  className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded && (
                <div className="space-y-2.5 mt-1">
                  {rest.map((entry) => (
                    <TraderRow key={`${entry.rank}-${entry.userId || entry.publicName}`} entry={entry} metric={metric} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { formatValue }
