'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  TIMEZONES,
  SESSIONS,
  getZoneOffsetHours,
  getAllSessionOverlaps,
  intervalsToSegments,
  isUtcInIntervals,
  formatHour,
  hourToPercent,
} from '@/utils/marketSessions'

function shiftIntervals(intervals, offset) {
  const out = []
  for (const [start, end] of intervals) {
    let s = start + offset
    let e = end + offset
    while (s < 0) {
      s += 24
      e += 24
    }
    while (s >= 24) {
      s -= 24
      e -= 24
    }
    if (e <= 24) {
      out.push([s, e])
    } else {
      out.push([s, 24])
      if (e - 24 > 0) out.push([0, e - 24])
    }
  }
  return out.filter(([a, b]) => b > a + 1e-9)
}

export default function SessionOverlapTool() {
  const [now, setNow] = useState(() => new Date())
  const [zone, setZone] = useState('tehran')
  const [focusId, setFocusId] = useState(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])

  const nowUtc = now.getUTCHours() + now.getUTCMinutes() / 60
  const zoneOffset = getZoneOffsetHours(zone, now)

  const overlaps = useMemo(() => {
    return getAllSessionOverlaps(now).map((o) => {
      const localIntervals = shiftIntervals(o.intervals, zoneOffset)
      const active = isUtcInIntervals(nowUtc, o.intervals)
      return {
        ...o,
        localIntervals,
        active,
        segs: intervalsToSegments(localIntervals),
        openLabel: formatHour(localIntervals[0]?.[0] ?? 0),
        closeLabel: formatHour(
          localIntervals[localIntervals.length - 1]?.[1] ?? 0,
        ),
        utcLabel: o.intervals
          .map(([a, b]) => `${formatHour(a)}–${formatHour(b)}`)
          .join(' · '),
        localLabel: localIntervals
          .map(([a, b]) => `${formatHour(a)}–${formatHour(b)}`)
          .join(' · '),
      }
    })
  }, [now, nowUtc, zoneOffset])

  const activeOnes = overlaps.filter((o) => o.active)
  const selected =
    overlaps.find((o) => o.id === focusId) ||
    activeOnes[0] ||
    overlaps[0] ||
    null

  const nowMarkerPct = hourToPercent(
    (() => {
      let h = nowUtc + zoneOffset
      while (h < 0) h += 24
      while (h >= 24) h -= 24
      return h
    })(),
  )

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">همپوشانی همه سشن‌ها</h2>
            <p className="text-sm text-white/55 mt-1">
              تقاطع سیدنی، توکیو، لندن و نیویورک — با احتساب DST امروز
            </p>
          </div>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          >
            {TIMEZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </div>

        {/* Live status */}
        <div
          className={`rounded-xl border px-3 py-2.5 mb-4 text-sm ${
            activeOnes.length
              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
              : 'border-white/10 bg-black/20 text-white/55'
          }`}
        >
          {activeOnes.length ? (
            <>
              الان فعال:{' '}
              <strong>{activeOnes.map((o) => o.label).join(' · ')}</strong>
            </>
          ) : (
            'الان هیچ همپوشانی سشنی فعال نیست'
          )}
        </div>

        {/* Legend sessions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SESSIONS.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 text-[11px] text-white/70 px-2 py-1 rounded-full bg-black/25 border border-white/10"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>

        {/* All pairs list */}
        <div className="space-y-2 mb-5">
          {overlaps.length === 0 ? (
            <p className="text-sm text-white/45">همپوشانی‌ای یافت نشد</p>
          ) : (
            overlaps.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setFocusId(o.id)}
                className={`w-full text-right rounded-xl border px-3 py-2.5 transition-colors ${
                  selected?.id === o.id
                    ? 'border-primary-400/50 bg-primary-500/15'
                    : o.active
                      ? 'border-emerald-400/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                      : 'border-white/10 bg-black/20 hover:bg-black/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: o.colorA }}
                    />
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: o.colorB }}
                    />
                    <span className="font-semibold text-white text-sm truncate">
                      {o.label}
                    </span>
                    {o.active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 animate-pulse">
                        الان
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/45 shrink-0 tabular-nums">
                    {o.hours.toFixed(1)} ساعت
                  </span>
                </div>
                <div className="relative h-6 rounded-md bg-black/40 overflow-hidden mb-1" dir="ltr">
                  {o.segs.map((seg, i) => (
                    <div
                      key={i}
                      className="absolute top-0.5 bottom-0.5 rounded"
                      style={{
                        left: `${seg.startPct}%`,
                        width: `${Math.max(seg.endPct - seg.startPct, 0.6)}%`,
                        background: `linear-gradient(90deg, ${o.colorA}cc, ${o.colorB})`,
                      }}
                    />
                  ))}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-white/90"
                    style={{ left: `${nowMarkerPct}%` }}
                  />
                </div>
                <div className="text-[11px] text-white/50 font-mono" dir="ltr">
                  {o.localLabel}
                  <span className="text-white/30"> · UTC {o.utcLabel}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Focus detail */}
        {selected && (
          <div className="rounded-xl border border-white/15 bg-black/25 p-4">
            <div className="text-sm font-bold text-white mb-1">
              جزئیات: {selected.label}
            </div>
            <p className="text-xs text-white/45 mb-3" dir="ltr">
              {selected.labelEn}
            </p>
            <div className="grid sm:grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                <div className="text-[10px] text-white/40 mb-0.5">به وقت انتخابی</div>
                <div className="font-mono text-white" dir="ltr">
                  {selected.localLabel}
                </div>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                <div className="text-[10px] text-white/40 mb-0.5">UTC</div>
                <div className="font-mono text-white" dir="ltr">
                  {selected.utcLabel}
                </div>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                <div className="text-[10px] text-white/40 mb-0.5">مدت</div>
                <div className="font-bold text-white tabular-nums">
                  {selected.hours.toFixed(1)} ساعت
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-[11px] text-white/35 mt-3">
          همه جفت‌سشن‌های ممکن نمایش داده می‌شوند. خط سفید روی نوار = زمان فعلی.
        </p>
      </section>
    </div>
  )
}
