'use client'

import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import Modal from '@/components/Modal'
import {
  BACKTEST_EXPORT_HEADERS,
  flattenBacktestForExport,
  sessionLabel,
} from '@/utils/backtest'

function downloadWorkbook(backtests, scope) {
  const rows = (backtests || []).map(flattenBacktestForExport)
  const data = rows.map((r) => {
    const obj = {}
    for (const h of BACKTEST_EXPORT_HEADERS) obj[h.label] = r[h.key]
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Backtests')
  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `backtests-${scope}-${stamp}.xlsx`)
}

function downloadCsv(backtests, scope) {
  const rows = (backtests || []).map(flattenBacktestForExport)
  const headers = BACKTEST_EXPORT_HEADERS
  const sheetRows = [
    headers.map((h) => h.label),
    ...rows.map((r) => headers.map((h) => r[h.key])),
  ]
  const csv = sheetRows
    .map((line) =>
      line
        .map((cell) => {
          const s = String(cell ?? '')
          if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
          return s
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backtests-${scope}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Full backtest list viewer + month/all export
 */
export default function BacktestListModal({
  isOpen,
  onClose,
  userId,
  monthBacktests = [],
  currentMonth,
  onEdit,
  onDelete,
}) {
  const [scope, setScope] = useState('month') // month | all
  const [allItems, setAllItems] = useState(null)
  const [loadingAll, setLoadingAll] = useState(false)
  const [query, setQuery] = useState('')

  const monthTitle = currentMonth
    ? currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  const loadAll = async () => {
    if (!userId) return
    setLoadingAll(true)
    try {
      const res = await fetch(`/api/backtests?userId=${userId}`)
      const data = await res.json()
      if (data.success) setAllItems(data.backtests || [])
      else alert(data.error || 'خطا در دریافت لیست')
    } catch {
      alert('خطا در دریافت لیست')
    } finally {
      setLoadingAll(false)
    }
  }

  const handleScope = async (next) => {
    setScope(next)
    if (next === 'all' && allItems == null) await loadAll()
  }

  const items = scope === 'all' ? allItems || [] : monthBacktests

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((b) => {
      const setups = (b.setupIds || []).map((s) => s.title || '').join(' ')
      const hay = `${b.symbol} ${b.timeframe} ${b.direction} ${b.session} ${setups} ${b.lesson || ''} ${b.notes || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, query])

  const exportRows = filtered

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="لیست کامل بک‌تست‌ها"
      size="xl"
    >
      <div className="space-y-4" dir="rtl">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => handleScope('month')}
              className={`px-3 py-2 font-medium ${
                scope === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              این ماه ({monthBacktests.length})
            </button>
            <button
              type="button"
              onClick={() => handleScope('all')}
              className={`px-3 py-2 font-medium border-r border-gray-200 ${
                scope === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              همه{allItems ? ` (${allItems.length})` : ''}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={exportRows.length === 0}
              onClick={() => downloadCsv(exportRows, scope)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              خروجی CSV
            </button>
            <button
              type="button"
              disabled={exportRows.length === 0}
              onClick={() => downloadWorkbook(exportRows, scope)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              خروجی Excel
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          {scope === 'month'
            ? `نمایش بک‌تست‌های ${monthTitle}`
            : 'نمایش همه بک‌تست‌های ثبت‌شده'}
          {' · '}خروجی شامل تمام فیلدها (نماد، تایم‌فریم، ستاپ، TP/SL، درس و …) است.
        </p>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو: نماد، ستاپ، جهت…"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />

        {loadingAll ? (
          <p className="text-center text-sm text-gray-500 py-8">در حال بارگذاری…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">موردی یافت نشد</p>
        ) : (
          <div className="overflow-x-auto max-h-[55vh] border border-gray-100 rounded-xl">
            <table className="min-w-[900px] w-full text-sm text-right">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-xs text-gray-600">
                  <th className="px-3 py-2 font-semibold">تاریخ</th>
                  <th className="px-3 py-2 font-semibold">نماد</th>
                  <th className="px-3 py-2 font-semibold">TF</th>
                  <th className="px-3 py-2 font-semibold">جهت</th>
                  <th className="px-3 py-2 font-semibold">سشن</th>
                  <th className="px-3 py-2 font-semibold">ستاپ</th>
                  <th className="px-3 py-2 font-semibold">TP</th>
                  <th className="px-3 py-2 font-semibold">SL</th>
                  <th className="px-3 py-2 font-semibold">برایند</th>
                  <th className="px-3 py-2 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const flat = flattenBacktestForExport(b)
                  return (
                    <tr key={b._id} className="border-t border-gray-100 hover:bg-gray-50/80">
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                        {flat.date}
                      </td>
                      <td className="px-3 py-2 font-medium">{flat.symbol}</td>
                      <td className="px-3 py-2">{flat.timeframe}</td>
                      <td
                        className={`px-3 py-2 font-semibold ${
                          b.direction === 'buy' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {flat.direction?.toUpperCase()}
                      </td>
                      <td className="px-3 py-2 text-xs">{sessionLabel(b.session)}</td>
                      <td className="px-3 py-2 text-xs max-w-[140px] truncate" title={flat.setups}>
                        {flat.setups || '—'}
                      </td>
                      <td className="px-3 py-2 text-emerald-700 tabular-nums">{flat.tpHits}</td>
                      <td className="px-3 py-2 text-rose-700 tabular-nums">{flat.slHits}</td>
                      <td
                        className={`px-3 py-2 font-bold tabular-nums ${
                          Number(flat.resultPnL) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {flat.resultPnL === ''
                          ? '—'
                          : `${Number(flat.resultPnL) >= 0 ? '+' : ''}${flat.resultPnL}`}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(b)}
                            className="text-xs text-blue-600 hover:underline ml-2"
                          >
                            ویرایش
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(b)}
                            className="text-xs text-rose-600 hover:underline"
                          >
                            حذف
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}
