'use client'

import { useEffect, useMemo, useState } from 'react'
import SymbolSelect from '@/components/SymbolSelect'
import SelectedSetupNote from '@/components/SelectedSetupNote'
import {
  BACKTEST_TIMEFRAMES,
  loadBacktestPrefs,
} from '@/utils/backtest'

/**
 * Day panel: record chart/market reality opportunities
 * (separate from backtest entries)
 */
export default function MarketRealityDayPanel({
  userId,
  date,
  items = [],
  onChanged,
}) {
  const prefs = useMemo(() => loadBacktestPrefs(userId), [userId])
  const [setups, setSetups] = useState([])
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    symbol: prefs.symbol || '',
    timeframe: prefs.timeframe || 'M15',
    setupId: '',
    tpCount: '1',
    slCount: '0',
    notes: '',
  })

  const standardSetups = useMemo(
    () => setups.filter((s) => s.type === 'standard'),
    [setups],
  )
  const customSetups = useMemo(
    () => setups.filter((s) => s.type !== 'standard'),
    [setups],
  )

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/setups?userId=${userId}`)
        const data = await res.json()
        if (data.success) setSetups(data.setups || [])
      } catch {
        /* ignore */
      }
    })()
  }, [userId])

  useEffect(() => {
    if (editingId) return
    setForm((prev) => ({
      ...prev,
      symbol: prefs.symbol || prev.symbol,
      timeframe: prefs.timeframe || prev.timeframe,
      setupId:
        prev.setupId ||
        (Array.isArray(prefs.setupIds) && prefs.setupIds[0]
          ? String(prefs.setupIds[0])
          : ''),
    }))
  }, [prefs, editingId])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      symbol: prefs.symbol || '',
      timeframe: prefs.timeframe || 'M15',
      setupId:
        Array.isArray(prefs.setupIds) && prefs.setupIds[0]
          ? String(prefs.setupIds[0])
          : '',
      tpCount: '1',
      slCount: '0',
      notes: '',
    })
  }

  const startEdit = (item) => {
    setEditingId(item._id)
    setForm({
      symbol: item.symbol || '',
      timeframe: item.timeframe || 'M15',
      setupId: String(item.setupId?._id || item.setupId || ''),
      tpCount: String(item.tpCount ?? 0),
      slCount: String(item.slCount ?? 0),
      notes: item.notes || '',
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.symbol || !form.setupId) {
      alert('نماد و ستاپ الزامی است')
      return
    }
    setSaving(true)
    try {
      const payload = {
        userId,
        date: date.toISOString(),
        symbol: form.symbol,
        timeframe: form.timeframe,
        setupId: form.setupId,
        tpCount: Number(form.tpCount) || 0,
        slCount: Number(form.slCount) || 0,
        notes: form.notes,
      }

      const res = await fetch(
        editingId
          ? `/api/market-realities/${editingId}`
          : '/api/market-realities',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ذخیره')
      }
      resetForm()
      onChanged?.()
    } catch (err) {
      alert(err.message || 'خطا در ذخیره')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm('این فرصت بازار حذف شود؟')) return
    try {
      const res = await fetch(
        `/api/market-realities/${item._id}?userId=${userId}`,
        { method: 'DELETE' },
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حذف')
      }
      if (editingId === item._id) resetForm()
      onChanged?.()
    } catch (err) {
      alert(err.message || 'خطا در حذف')
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 md:p-4 space-y-3" dir="rtl">
      <div>
        <h4 className="font-bold text-amber-950 text-sm md:text-base">
          فرصت واقعی بازار
        </h4>
        <p className="text-[11px] md:text-xs text-amber-900/70 mt-1 leading-relaxed">
          بعد از بررسی چارت: روی کدام نماد / تایم‌فریم / ستاپ چند TP قابل گرفتن بود.
          این بخش از بک‌تست جداست.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-gray-600 mb-1">نماد</label>
            <SymbolSelect
              value={form.symbol}
              onChange={(symbol) => setForm((f) => ({ ...f, symbol }))}
              required
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-600 mb-1">تایم‌فریم</label>
            <select
              value={form.timeframe}
              onChange={(e) =>
                setForm((f) => ({ ...f, timeframe: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {BACKTEST_TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-gray-600 mb-1">
            ستاپ (استاندارد و شخصی)
          </label>
          <select
            value={form.setupId}
            onChange={(e) => setForm((f) => ({ ...f, setupId: e.target.value }))}
            required
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm mb-2"
          >
            <option value="">انتخاب ستاپ…</option>
            {standardSetups.length > 0 && (
              <optgroup label="⭐ ستاپ‌های استاندارد">
                {standardSetups.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </optgroup>
            )}
            {customSetups.length > 0 && (
              <optgroup label="👤 ستاپ‌های شخصی">
                {customSetups.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <SelectedSetupNote setups={setups} selectedIds={form.setupId} />

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto rounded-lg border border-gray-100 bg-white p-2">
            {setups.length === 0 && (
              <span className="text-[11px] text-rose-600">
                ستاپی یافت نشد — استانداردها را از ادمین یا شخصی را از پروفایل اضافه کنید
              </span>
            )}
            {standardSetups.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, setupId: String(s._id) }))}
                className={`px-2 py-1 rounded text-[11px] font-medium border ${
                  String(form.setupId) === String(s._id)
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                ⭐ {s.title}
              </button>
            ))}
            {customSetups.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, setupId: String(s._id) }))}
                className={`px-2 py-1 rounded text-[11px] font-medium border ${
                  String(form.setupId) === String(s._id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                👤 {s.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-emerald-700 mb-1 font-medium">
              تعداد TP قابل گرفتن
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.tpCount}
              onChange={(e) => setForm((f) => ({ ...f, tpCount: e.target.value }))}
              className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[11px] text-rose-700 mb-1 font-medium">
              تعداد SL (اختیاری)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.slCount}
              onChange={(e) => setForm((f) => ({ ...f, slCount: e.target.value }))}
              className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm tabular-nums"
            />
          </div>
        </div>

        <input
          type="text"
          placeholder="یادداشت کوتاه (اختیاری)"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || setups.length === 0}
            className="flex-1 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره…' : editingId ? 'بروزرسانی' : 'ثبت فرصت بازار'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white"
            >
              انصراف
            </button>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <p className="text-xs text-amber-900/60 text-center py-2">
          هنوز فرصتی برای این روز ثبت نشده
        </p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item) => {
            const hits = (item.tpCount || 0) + (item.slCount || 0)
            const rate =
              hits > 0
                ? (((item.tpCount || 0) / hits) * 100).toFixed(0)
                : null
            return (
              <li
                key={item._id}
                className="rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {item.setupId?.type === 'standard' ? '⭐ ' : '👤 '}
                      {item.setupId?.title || 'ستاپ'} · {item.symbol} ·{' '}
                      {item.timeframe}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      <span className="text-emerald-700 font-medium">
                        TP {item.tpCount || 0}
                      </span>
                      <span className="mx-1 text-gray-300">·</span>
                      <span className="text-rose-700 font-medium">
                        SL {item.slCount || 0}
                      </span>
                      {rate != null && (
                        <>
                          <span className="mx-1 text-gray-300">·</span>
                          <span className="text-amber-800 font-bold">
                            WR {rate}%
                          </span>
                        </>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="px-2 py-1 text-[11px] rounded bg-blue-50 text-blue-700"
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="px-2 py-1 text-[11px] rounded bg-red-50 text-red-700"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
