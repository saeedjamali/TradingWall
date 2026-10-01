'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { capReport } from '@/utils/tradeCap'
import { captureElement } from '@/utils/captureElement'

function money(value) {
  const amount = Number(value) || 0
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
  return `${sign}$${Math.abs(amount).toFixed(2)}`
}

function signed(value, digits = 0) {
  const amount = Number(value) || 0
  const sign = amount > 0 ? '+' : ''
  return `${sign}${digits ? amount.toFixed(digits) : amount}`
}

const METRICS = ['معاملات', 'وین‌ریت', 'برایند', 'میانگین']

function CompareBand({
  label,
  dot,
  className,
  labelClass = 'text-slate-600',
  stats,
  values,
  emphasize = false,
  profitUp = false,
  profitDown = false,
}) {
  const cells = values || [
    String(stats.totalTrades),
    `${stats.winRate}%`,
    money(stats.totalProfitLoss),
    money(stats.averageProfit),
  ]
  return (
    <div className={`grid grid-cols-[4.6rem_minmax(0,1fr)] items-center gap-2 rounded-xl border px-2.5 py-2 ${className}`}>
      <div className={`flex items-center gap-1.5 text-xs font-bold ${labelClass}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        {METRICS.map((name, index) => (
          <div key={name} className="flex min-w-0 flex-col items-start">
            <div className="text-[10px] font-medium leading-4 text-slate-400">{name}</div>
            <div
              dir="ltr"
              className={`text-sm font-bold leading-5 tabular-nums text-slate-800 ${
                emphasize && index === 2
                  ? profitUp
                    ? 'text-emerald-700'
                    : profitDown
                      ? 'text-rose-700'
                      : ''
                  : ''
              }`}
            >
              {cells[index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Amount({ value, className = '' }) {
  return (
    <span dir="ltr" className={`inline-block rounded bg-white px-1 font-bold tabular-nums ring-1 ring-black/5 ${className}`}>
      {money(value)}
    </span>
  )
}

function Note({ tone = 'slate', children }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50',
    emerald: 'border-emerald-200 bg-emerald-50/80',
    rose: 'border-rose-200 bg-rose-50/80',
  }
  const bars = {
    slate: 'bg-slate-300',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
  }
  return (
    <div className={`flex gap-2 rounded-lg border px-2.5 py-2 text-[11px] leading-5 text-slate-600 ${tones[tone]}`}>
      <span className={`mt-0.5 w-1 shrink-0 self-stretch rounded-full ${bars[tone]}`} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function Count({ children }) {
  return (
    <span className="mx-0.5 inline-flex rounded-md bg-white px-1.5 py-0.5 font-bold text-slate-800 ring-1 ring-slate-200">
      {children}
    </span>
  )
}

function scopeName(period) {
  if (period === 'year') return 'این سال'
  if (period === 'all') return 'در کل'
  return 'این ماه'
}

function reportTitle(period, monthLabel, yearLabel) {
  if (period === 'year') return `گزارش سالانه · ${yearLabel}`
  if (period === 'all') return 'گزارش کلی'
  return `گزارش ماهانه · ${monthLabel} ${yearLabel}`
}

const PERIODS = [
  { id: 'month', label: 'ماهانه' },
  { id: 'year', label: 'سالانه' },
  { id: 'all', label: 'کلی' },
]

function Verdict({ report, limit, period }) {
  const scope = scopeName(period)
  if (report.actual.totalTrades === 0) {
    return <Note>{scope} معامله‌ای برای مقایسه نیست.</Note>
  }
  if (report.excluded === 0) {
    return <Note>{scope} هیچ روزی بیشتر از {limit} معامله نداشته؛ نتیجه با واقعیت یکی است.</Note>
  }
  const extra = report.excludedProfit
  const helped = extra < -0.005
  const hurt = extra > 0.005
  const tone = helped ? 'emerald' : hurt ? 'rose' : 'slate'
  const moneyTone = helped ? 'text-emerald-700 ring-emerald-200' : hurt ? 'text-rose-700 ring-rose-200' : 'text-slate-800'
  return (
    <Note tone={tone}>
      <Count>{report.daysOver} روز</Count>
      بیشتر از {limit} معامله ثبت شده
      <Count>{report.excluded} معامله اضافه</Count>
      {helped ? (
        <>
          . معاملات اضافه <Amount value={extra} className={moneyTone} /> بوده‌اند، پس توقف بعد از معامله {limit}ام{' '}
          <span className="font-bold text-emerald-800">نتیجه را بهتر می‌کند</span>.
        </>
      ) : hurt ? (
        <>
          . معاملات اضافه <Amount value={extra} className={moneyTone} /> سود داشته‌اند، پس این سقف{' '}
          <span className="font-bold text-rose-800">آن سود را کنار می‌گذارد</span>.
        </>
      ) : (
        <span className="font-bold text-slate-700">. معاملات اضافه تقریباً سر به سر بوده‌اند.</span>
      )}
    </Note>
  )
}

function YearLine({ report, yearLabel }) {
  if (report.actual.totalTrades === 0 || report.excluded === 0) return null
  const up = report.deltaProfit > 0.005
  const down = report.deltaProfit < -0.005
  return (
    <Note tone={up ? 'emerald' : down ? 'rose' : 'slate'}>
      <span className="font-bold text-slate-800">سال {yearLabel}</span>
      <span className="mx-1 text-slate-300">·</span>
      واقعی <Amount value={report.actual.totalProfitLoss} className="text-slate-700" />
      <span className="mx-1 text-slate-300">←</span>
      با سقف <Amount value={report.limited.totalProfitLoss} className="text-amber-800 ring-amber-200" />
      <span className="mx-1 text-slate-300">·</span>
      اختلاف{' '}
      <Amount
        value={report.deltaProfit}
        className={up ? 'text-emerald-700 ring-emerald-200' : down ? 'text-rose-700 ring-rose-200' : 'text-slate-700'}
      />
    </Note>
  )
}

export default function DailyTradeCap({
  enabled,
  limit,
  onChange,
  monthTrades,
  yearTrades,
  allTrades = [],
  scopeLoading = false,
  period = 'month',
  onPeriodChange,
  onShiftDate,
  monthLabel = '',
  yearLabel,
  exportName = 'tradingwall-daily-cap.png',
}) {
  const exportRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const scopeTrades = period === 'all' ? allTrades : period === 'year' ? yearTrades : monthTrades
  const report = capReport(scopeTrades, limit)
  const year = capReport(yearTrades, limit)
  const showAnnual = period === 'month' && year.actual.totalTrades !== report.actual.totalTrades

  const setLimit = (value) => {
    const next = Math.round(Number(value))
    if (!Number.isFinite(next)) return
    onChange(enabled, Math.min(20, Math.max(1, next)))
  }

  const exportImage = async () => {
    const node = exportRef.current
    if (!node || exporting) return
    setExporting(true)
    try {
      const canvas = await captureElement(node, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        onclone: (_doc, el) => {
          el.querySelectorAll('[data-export-ignore]').forEach((node) => node.remove())
          const input = el.querySelector('input[type="number"]')
          if (input) {
            const value = el.ownerDocument.createElement('span')
            value.textContent = input.value
            value.className = input.className
            input.replaceWith(value)
          }
          const mark = el.querySelector('[data-export-watermark]')
          if (mark) mark.classList.remove('hidden')
          el.style.paddingBottom = '2.5rem'
        },
      })
      const link = document.createElement('a')
      link.download = exportName
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error(error)
      alert('خطا در دانلود تصویر')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div ref={exportRef} className="relative mb-3 rounded-lg bg-white shadow-sm px-3 py-2" dir="rtl">
      <div className="mb-2 flex items-start gap-2">
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-base"
          aria-hidden="true"
        >
          ✋
        </span>
        <div className="min-w-0">
        <p className="text-sm font-bold text-gray-800">اورترید و دست بی‌قرار</p>
        <p className="mt-0.5 text-[11px] leading-5 text-gray-500">
          معامله زیاد معمولاً سود نمی‌آورد و گاهی نتیجه را برعکس می‌کند. سقف روزانه همین را روی معاملات خودتان نشان می‌دهد.{' '}
          <Link href="/blog/overtrade-va-dast-bi-gharar" className="font-bold text-primary-700 hover:underline">
            آموزش
          </Link>
        </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-800">سقف روزانه</span>
        <span className="text-[11px] text-gray-500">فقط</span>
        <input
          type="number"
          min={1}
          max={20}
          value={limit}
          aria-label="تعداد معامله اول هر روز"
          onChange={(event) => setLimit(event.target.value)}
          className="w-12 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-center text-sm font-bold text-slate-800"
        />
        <span className="text-[11px] text-gray-500">معامله اول هر روز در تقویم و نمودارها</span>
        <div className="mr-auto flex flex-wrap items-center justify-end gap-1.5" data-export-ignore="true">
          {enabled && (
            <>
              <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5">
                {PERIODS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onPeriodChange?.(item.id)}
                    className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                      period === item.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {period !== 'all' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onShiftDate?.(1)}
                    className="rounded-md bg-slate-800 px-1.5 py-1 text-white hover:bg-slate-700"
                    title={period === 'year' ? 'سال بعد' : 'ماه بعد'}
                    aria-label={period === 'year' ? 'سال بعد' : 'ماه بعد'}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <span className="min-w-[7.5rem] text-center text-xs font-bold text-slate-800">
                    {period === 'year' ? `سال ${yearLabel}` : `${monthLabel} ${yearLabel}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onShiftDate?.(-1)}
                    className="rounded-md bg-slate-800 px-1.5 py-1 text-white hover:bg-slate-700"
                    title={period === 'year' ? 'سال قبل' : 'ماه قبل'}
                    aria-label={period === 'year' ? 'سال قبل' : 'ماه قبل'}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={exportImage}
                disabled={exporting}
                className="rounded-md bg-primary-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary-700 disabled:opacity-50"
                title="دانلود تصویر همین گزارش"
              >
                {exporting ? '...' : 'تصویر'}
              </button>
            </>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => onChange(!enabled, limit)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
              enabled ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {enabled ? 'فعال' : 'خاموش'}
          </button>
        </div>
      </div>

      {enabled && (
        <div className="relative mt-2 space-y-1.5 border-t border-slate-100 px-1 pt-2">
          <p className="text-sm font-bold text-slate-800">{reportTitle(period, monthLabel, yearLabel)}</p>
          {scopeLoading ? (
            <p className="text-[11px] text-slate-500">در حال آماده‌سازی گزارش...</p>
          ) : (
            <>
          <CompareBand
            label="واقعی"
            dot="bg-slate-400"
            className="border-slate-200 bg-slate-50"
            stats={report.actual}
          />
          <CompareBand
            label={`سقف ${limit}`}
            dot="bg-amber-500"
            className="border-amber-200 bg-amber-50"
            labelClass="text-amber-800"
            stats={report.limited}
          />
          <CompareBand
            label="اختلاف"
            dot={report.deltaProfit > 0 ? 'bg-emerald-500' : report.deltaProfit < 0 ? 'bg-rose-500' : 'bg-slate-400'}
            className={
              report.deltaProfit > 0
                ? 'border-emerald-200 bg-emerald-50'
                : report.deltaProfit < 0
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-slate-200 bg-white'
            }
            labelClass="text-slate-800"
            values={[
              signed(report.limited.totalTrades - report.actual.totalTrades),
              `${signed(report.deltaWinRate, 1)}%`,
              money(report.deltaProfit),
              money(report.limited.averageProfit - report.actual.averageProfit),
            ]}
            emphasize
            profitUp={report.deltaProfit > 0}
            profitDown={report.deltaProfit < 0}
          />
          <div className="mt-1.5 space-y-1.5">
            <Verdict report={report} limit={limit} period={period} />
            {showAnnual && year.excluded > 0 ? <YearLine report={year} yearLabel={yearLabel} /> : null}
          </div>
            </>
          )}
        </div>
      )}
      <span className="blog-watermark hidden" data-export-watermark="true" aria-hidden="true">
        tradingwall.ir
      </span>
    </div>
  )
}
