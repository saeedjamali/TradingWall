'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  TIMEZONES,
  SESSIONS,
  NY_BANK_HOURS,
  getZoneOffsetHours,
  getDstInfo,
  getSessionInZone,
  getSessionUtcRange,
  sessionSegmentsUtc,
  isSessionOpenNow,
  formatHour,
  formatUtcOffset,
  hourToPercent,
  getForexHolidays,
  getNyBankHolidays,
  getHolidayAlerts,
  formatFaDate,
  sameUtcDay,
  isNyBankOpenNow,
} from '@/utils/marketSessions'

export default function MarketClockTool() {
  const [now, setNow] = useState(() => new Date())
  const [displayZone, setDisplayZone] = useState('tehran')
  const [convertHour, setConvertHour] = useState(12)
  const [convertFrom, setConvertFrom] = useState('london')
  const [convertTo, setConvertTo] = useState('tehran')
  const year = now.getUTCFullYear()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dstBadges = useMemo(
    () =>
      TIMEZONES.filter((z) => z.dstRegion).map((z) => ({
        ...z,
        info: getDstInfo(z.id, now),
        offset: getZoneOffsetHours(z.id, now),
      })),
    [now],
  )

  const nowUtcHour =
    now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600

  const converted = useMemo(() => {
    const fromOff = getZoneOffsetHours(convertFrom, now)
    const toOff = getZoneOffsetHours(convertTo, now)
    let utc = convertHour - fromOff
    while (utc < 0) utc += 24
    while (utc >= 24) utc -= 24
    let local = utc + toOff
    while (local < 0) local += 24
    while (local >= 24) local -= 24
    return { utc, local }
  }, [convertHour, convertFrom, convertTo, now])

  const forexHolidays = useMemo(() => getForexHolidays(year), [year])
  const bankHolidays = useMemo(() => getNyBankHolidays(year), [year])
  const alerts = useMemo(() => getHolidayAlerts(now), [now])

  const upcomingForex = forexHolidays
    .filter(
      (h) =>
        h.date.getTime() >=
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
    .slice(0, 6)
  const upcomingBank = bankHolidays
    .filter(
      (h) =>
        h.date.getTime() >=
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
    .slice(0, 8)

  const bankRange = getSessionInZone(NY_BANK_HOURS, displayZone, now)
  const bankUtc = getSessionUtcRange(NY_BANK_HOURS, now)
  const bankOpen = isNyBankOpenNow(now)
  const bankDst = getDstInfo('newyork', now)

  return (
    <div className="space-y-8" dir="rtl">
      {/* Holiday alerts */}
      <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 md:p-5">
        <h2 className="text-lg font-bold text-amber-100 mb-3">اعلان تعطیلات</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <AlertColumn
            title="امروز"
            empty="امروز تعطیلی ثبت‌شده‌ای نیست"
            items={alerts.today}
            tone="today"
          />
          <AlertColumn
            title="این هفته"
            empty="تا پایان هفته تعطیلی نیست"
            items={alerts.week}
          />
          <AlertColumn
            title="این ماه"
            empty="تا پایان ماه تعطیلی نیست"
            items={alerts.month}
          />
        </div>
      </section>

      {/* Live clocks */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">ساعت زنده مراکز</h2>
            <p className="text-sm text-white/60 mt-1">
              شامل تهران — وضعیت تابستانه/زمستانه و اختلاف با GMT
            </p>
          </div>
          <div
            className="text-left font-mono text-sm text-primary-300 tabular-nums"
            dir="ltr"
          >
            UTC{' '}
            {String(now.getUTCHours()).padStart(2, '0')}:
            {String(now.getUTCMinutes()).padStart(2, '0')}:
            {String(now.getUTCSeconds()).padStart(2, '0')}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {TIMEZONES.map((z) => {
            const offset = getZoneOffsetHours(z.id, now)
            const dst = getDstInfo(z.id, now)
            let localH =
              now.getUTCHours() + now.getUTCMinutes() / 60 + offset
            while (localH < 0) localH += 24
            while (localH >= 24) localH -= 24
            const highlight = z.id === 'tehran'
            return (
              <div
                key={z.id}
                className={`rounded-xl border p-3 ${
                  highlight
                    ? 'border-cyan-400/40 bg-cyan-500/10'
                    : 'border-white/10 bg-black/20'
                }`}
              >
                <div className="text-xs text-white/50 mb-1 truncate">{z.label}</div>
                <div
                  className="text-2xl font-bold text-white tabular-nums font-mono"
                  dir="ltr"
                >
                  {formatHour(localH)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                    {formatUtcOffset(offset)}
                  </span>
                  {z.dstRegion && (
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        dst.active
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {dst.label}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {dstBadges.map((z) => (
            <div
              key={z.id}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                z.info.active
                  ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
                  : 'border-white/10 bg-white/5 text-white/60'
              }`}
            >
              {z.label}: {z.info.label}
              {z.info.active ? ' — ساعت رسمی +۱ نسبت به زمستانه' : ''}
            </div>
          ))}
          <div className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60">
            تهران: بدون DST (ثابت UTC+3:30)
          </div>
        </div>
      </section>

      {/* NY Bank hours */}
      <section
        id="ny-bank"
        className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 md:p-6 scroll-mt-24"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">ساعت بانک نیویورک</h2>
            <p className="text-sm text-white/60 mt-1">{NY_BANK_HOURS.note}</p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full ${
              bankOpen
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-white/10 text-white/50'
            }`}
          >
            {bankOpen ? 'الان باز است' : 'الان بسته است'}
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-black/25 border border-white/10 p-4">
            <div className="text-xs text-white/50 mb-1">محلی (Eastern)</div>
            <div className="text-2xl font-mono font-bold text-white" dir="ltr">
              09:00–17:00
            </div>
            {bankDst.active && (
              <div className="text-[11px] text-amber-300 mt-1">امروز EDT تابستانه (+1)</div>
            )}
          </div>
          <div className="rounded-xl bg-black/25 border border-white/10 p-4">
            <div className="text-xs text-white/50 mb-1">
              به وقت {TIMEZONES.find((z) => z.id === displayZone)?.label}
            </div>
            <div className="text-2xl font-mono font-bold text-white" dir="ltr">
              {formatHour(bankRange.open)}–{formatHour(bankRange.close)}
            </div>
          </div>
          <div className="rounded-xl bg-black/25 border border-white/10 p-4">
            <div className="text-xs text-white/50 mb-1">UTC</div>
            <div className="text-2xl font-mono font-bold text-white" dir="ltr">
              {formatHour(bankUtc.openUtc)}–{formatHour(bankUtc.closeUtc)}
            </div>
          </div>
        </div>
      </section>

      {/* Session timeline */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">سشن‌های بازار فارکس</h2>
            <p className="text-sm text-white/60 mt-1">
              بازه باز بودن هر مرکز روی محور ۲۴ ساعته (بر اساس DST امروز)
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/80">
            <span>نمایش به وقت:</span>
            <select
              value={displayZone}
              onChange={(e) => setDisplayZone(e.target.value)}
              className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            >
              {TIMEZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-6" dir="ltr">
          <div className="relative h-6 mb-1 text-[10px] text-white/40">
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
              <span
                key={h}
                className="absolute -translate-x-1/2"
                style={{ left: `${(h / 24) * 100}%` }}
              >
                {String(h).padStart(2, '0')}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {[...SESSIONS, NY_BANK_HOURS].map((session) => {
              const range = getSessionInZone(session, displayZone, now)
              const utcRange = getSessionUtcRange(session, now)
              const segs = sessionSegmentsUtc(range.open, range.close)
              const open =
                session.id === 'ny-bank'
                  ? bankOpen
                  : isSessionOpenNow(session, now)
              const homeDst = getDstInfo(session.homeZone, now)

              return (
                <div key={session.id}>
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: session.color }}
                      />
                      <span className="font-semibold text-white truncate">
                        {session.name}
                        <span className="text-white/40 font-normal ml-1">
                          {session.nameEn}
                        </span>
                      </span>
                      {open && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 animate-pulse">
                          باز
                        </span>
                      )}
                      {homeDst.active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                          DST +1
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/70 tabular-nums shrink-0 font-mono">
                      {formatHour(range.open)} – {formatHour(range.close)}
                      <span className="text-white/40 mr-2">
                        (UTC {formatHour(utcRange.openUtc)}–
                        {formatHour(utcRange.closeUtc)})
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden">
                    {segs.map((seg, i) => (
                      <div
                        key={i}
                        className="absolute top-1 bottom-1 rounded-md opacity-90"
                        style={{
                          left: `${seg.startPct}%`,
                          width: `${Math.max(seg.endPct - seg.startPct, 0.5)}%`,
                          background: `linear-gradient(90deg, ${session.color}cc, ${session.color})`,
                        }}
                      />
                    ))}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                      style={{
                        left: `${hourToPercent(
                          (() => {
                            let h =
                              nowUtcHour + getZoneOffsetHours(displayZone, now)
                            while (h < 0) h += 24
                            while (h >= 24) h -= 24
                            return h
                          })(),
                        )}%`,
                      }}
                      title="الان"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SESSIONS.map((session) => {
            const range = getSessionInZone(session, displayZone, now)
            const open = isSessionOpenNow(session, now)
            const homeDst = getDstInfo(session.homeZone, now)
            return (
              <div
                key={session.id}
                className={`rounded-xl border p-4 ${
                  open
                    ? 'border-emerald-400/40 bg-emerald-500/10'
                    : 'border-white/10 bg-black/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">{session.name}</span>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: session.color }}
                  />
                </div>
                <div
                  className="text-2xl font-mono font-bold text-white tabular-nums"
                  dir="ltr"
                >
                  {formatHour(range.open)}–{formatHour(range.close)}
                </div>
                <p className="text-xs text-white/50 mt-2">
                  ساعت محلی مرکز: {formatHour(session.localOpen)}–
                  {formatHour(session.localClose)}
                  {homeDst.active ? ' · امروز تابستانه (+1)' : ''}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Converter */}
      <section
        id="converter"
        className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 scroll-mt-24"
      >
        <h2 className="text-xl font-bold text-white mb-1">تبدیل ساعت</h2>
        <p className="text-sm text-white/60 mb-4">
          تبدیل بین مناطق زمانی (شامل تهران) با در نظر گرفتن DST روز جاری
        </p>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-white/50 mb-1">ساعت مبدأ</label>
            <input
              type="number"
              min={0}
              max={23}
              step={0.5}
              value={convertHour}
              onChange={(e) =>
                setConvertHour(
                  Math.min(23.5, Math.max(0, Number(e.target.value) || 0)),
                )
              }
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">از</label>
            <select
              value={convertFrom}
              onChange={(e) => setConvertFrom(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white"
            >
              {TIMEZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">به</label>
            <select
              value={convertTo}
              onChange={(e) => setConvertTo(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white"
            >
              {TIMEZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-primary-600/20 border border-primary-400/30 p-4 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <div className="text-xs text-primary-200/80">نتیجه</div>
            <div
              className="text-3xl font-bold text-white font-mono tabular-nums"
              dir="ltr"
            >
              {formatHour(converted.local)}
            </div>
          </div>
          <div className="text-sm text-white/70">
            معادل UTC:{' '}
            <span className="font-mono text-white" dir="ltr">
              {formatHour(converted.utc)}
            </span>
          </div>
        </div>
      </section>

      {/* Holidays lists */}
      <div id="holidays" className="grid lg:grid-cols-2 gap-4 scroll-mt-24">
        <HolidayList
          title={`تعطیلات بازار فارکس ${year}`}
          subtitle="روزهایی که نقدینگی معمولاً بسیار پایین یا بازار بسته است"
          items={upcomingForex.length ? upcomingForex : forexHolidays.slice(0, 6)}
          now={now}
          accent="rose"
        />
        <HolidayList
          title={`تعطیلات بانک نیویورک ${year}`}
          subtitle="تعطیلات فدرال آمریکا — روی سشن NY و نقدینگی دلار اثر می‌گذارد"
          items={upcomingBank.length ? upcomingBank : bankHolidays.slice(0, 8)}
          now={now}
          accent="violet"
        />
      </div>
    </div>
  )
}

function AlertColumn({ title, empty, items, tone }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === 'today' && items.length
          ? 'border-rose-400/40 bg-rose-500/15'
          : 'border-white/10 bg-black/20'
      }`}
    >
      <div className="text-sm font-semibold text-white mb-2">{title}</div>
      {items.length === 0 ? (
        <p className="text-xs text-white/45">{empty}</p>
      ) : (
        <ul className="space-y-1.5 max-h-36 overflow-y-auto">
          {items.map((h) => (
            <li key={h.kind + h.name + h.date.toISOString()} className="text-xs">
              <span className="text-white font-medium">{h.name}</span>
              <span className="text-white/45"> · {h.kind}</span>
              <div className="text-white/40">{formatFaDate(h.date)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function HolidayList({ title, subtitle, items, now, accent }) {
  const border =
    accent === 'rose' ? 'border-rose-400/50 bg-rose-500/15' : 'border-violet-400/50 bg-violet-500/15'
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
      <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
      <p className="text-sm text-white/60 mb-4">{subtitle}</p>
      <ul className="space-y-2 max-h-80 overflow-y-auto">
        {items.map((h) => {
          const isToday = sameUtcDay(h.date, now)
          return (
            <li
              key={h.name + h.date.toISOString()}
              className={`rounded-lg border px-3 py-2.5 ${
                isToday ? border : 'border-white/10 bg-black/20'
              }`}
            >
              <div className="font-medium text-white text-sm">{h.name}</div>
              <div className="text-xs text-white/55 mt-0.5">
                {formatFaDate(h.date)}
                {isToday ? ' · امروز' : ''}
              </div>
              <div className="text-[11px] text-white/40 mt-1">{h.note}</div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
