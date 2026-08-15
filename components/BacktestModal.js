'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import Input from '@/components/Input'
import SymbolSelect from '@/components/SymbolSelect'
import {
  BACKTEST_SESSIONS,
  BACKTEST_TIMEFRAMES,
  computeBacktestPnL,
  loadBacktestPrefs,
  saveBacktestPrefs,
} from '@/utils/backtest'

const emptyForm = {
  symbol: '',
  timeframe: 'M15',
  direction: 'buy',
  session: 'london',
  marketCondition: '',
  entryReason: '',
  entry: '',
  sl: '',
  tp: '',
  risk: '',
  rr: '',
  slHits: '0',
  tpHits: '0',
  weaknesses: '',
  strengths: '',
  lesson: '',
  notes: '',
  tradeImage: '',
  setupIds: [],
}

function formFromPrefs(prefs) {
  return {
    ...emptyForm,
    symbol: prefs.symbol || '',
    timeframe: prefs.timeframe || 'M15',
    direction: prefs.direction || 'buy',
    session: prefs.session || 'london',
    risk: prefs.risk ?? '',
    setupIds: Array.isArray(prefs.setupIds) ? prefs.setupIds.map(String) : [],
  }
}

export default function BacktestModal({
  isOpen,
  onClose,
  userId,
  date,
  existing,
  onSaved,
  /** 'quick' | 'full' — default for new entries */
  initialMode = 'quick',
}) {
  const [form, setForm] = useState(emptyForm)
  const [setups, setSetups] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mode, setMode] = useState(initialMode)

  const previewPnL = useMemo(
    () =>
      computeBacktestPnL(
        form.tpHits,
        form.slHits,
        form.risk === '' ? null : form.risk,
      ),
    [form.tpHits, form.slHits, form.risk],
  )

  useEffect(() => {
    if (!isOpen || !userId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/setups?userId=${userId}`)
        const data = await res.json()
        if (data.success) setSetups(data.setups || [])
      } catch (e) {
        console.error(e)
      }
    })()
  }, [isOpen, userId])

  useEffect(() => {
    if (!isOpen) return
    if (existing) {
      setMode('full')
      setForm({
        symbol: existing.symbol || '',
        timeframe: existing.timeframe || 'M15',
        direction: existing.direction || 'buy',
        session: existing.session || 'other',
        marketCondition: existing.marketCondition || '',
        entryReason: existing.entryReason || '',
        entry: existing.entry ?? '',
        sl: existing.sl ?? '',
        tp: existing.tp ?? '',
        risk: existing.risk ?? '',
        rr: existing.rr ?? '',
        slHits: String(existing.slHits ?? 0),
        tpHits: String(existing.tpHits ?? 0),
        weaknesses: existing.weaknesses || '',
        strengths: existing.strengths || '',
        lesson: existing.lesson || '',
        notes: existing.notes || '',
        tradeImage: existing.tradeImage || '',
        setupIds: (existing.setupIds || []).map((s) => String(s._id || s)),
      })
    } else {
      const prefs = loadBacktestPrefs(userId)
      setMode(initialMode || prefs.mode || 'quick')
      setForm(formFromPrefs(prefs))
    }
  }, [isOpen, existing, initialMode, userId])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const toggleSetup = (id) => {
    const sid = String(id)
    setForm((prev) => ({
      ...prev,
      setupIds: prev.setupIds.map(String).includes(sid)
        ? prev.setupIds.filter((x) => String(x) !== sid)
        : [...prev.setupIds, sid],
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const { validateImageFile } = await import('@/utils/uploadLimits')
    const check = validateImageFile(file)
    if (!check.ok) {
      alert(check.error)
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('type', 'backtest')
      const res = await fetch('/api/upload/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'خطا در آپلود')
      setField('tradeImage', data.url)
    } catch (err) {
      alert(err.message || 'خطا در آپلود تصویر')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.symbol) {
      alert('نماد الزامی است')
      return
    }
    setSaving(true)
    try {
      const payload = {
        userId,
        date: (existing?.date ? new Date(existing.date) : date).toISOString(),
        ...form,
        entry: form.entry === '' ? null : form.entry,
        sl: form.sl === '' ? null : form.sl,
        tp: form.tp === '' ? null : form.tp,
        risk: form.risk === '' ? null : form.risk,
        rr: form.rr === '' ? null : form.rr,
        slHits: form.slHits,
        tpHits: form.tpHits,
        tradeImage: form.tradeImage || null,
      }

      const url = existing
        ? `/api/backtests/${existing._id}`
        : '/api/backtests'
      const method = existing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'خطا در ذخیره')

      saveBacktestPrefs(userId, {
        symbol: form.symbol,
        timeframe: form.timeframe,
        direction: form.direction,
        session: form.session,
        risk: form.risk === '' ? '' : form.risk,
        setupIds: form.setupIds,
        mode,
      })

      onSaved?.(data.backtest)
      onClose()
    } catch (err) {
      alert(err.message || 'خطا در ذخیره بک‌تست')
    } finally {
      setSaving(false)
    }
  }

  const dateLabel = date
    ? date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  const isQuick = mode === 'quick'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        existing
          ? `ویرایش بک‌تست — ${dateLabel}`
          : isQuick
            ? `ثبت سریع — ${dateLabel}`
            : `بک‌تست کامل — ${dateLabel}`
      }
      size={isQuick ? 'md' : 'lg'}
      zIndexClass="z-[110]"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[75vh] overflow-y-auto pr-1"
        dir="rtl"
      >
        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              isQuick
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            ثبت سریع
          </button>
          <button
            type="button"
            onClick={() => setMode('full')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              !isQuick
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            فرم کامل
          </button>
        </div>

        {/* Shared essentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نماد <span className="text-red-500">*</span>
            </label>
            <SymbolSelect
              value={form.symbol}
              onChange={(code) => setField('symbol', code)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              جهت معامله <span className="text-red-500">*</span>
            </label>
            <select
              value={form.direction}
              onChange={(e) => setField('direction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تایم‌فریم
            </label>
            <select
              value={form.timeframe}
              onChange={(e) => setField('timeframe', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {BACKTEST_TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              سشن بازار
            </label>
            <select
              value={form.session}
              onChange={(e) => setField('session', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {BACKTEST_SESSIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ستاپ‌ها</label>
          <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50 max-h-28 overflow-y-auto">
            {setups.length === 0 && (
              <span className="text-xs text-gray-500">ستاپی تعریف نشده</span>
            )}
            {setups.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => toggleSetup(s._id)}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  form.setupIds.map(String).includes(String(s._id))
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                {s.type === 'standard' ? '⭐' : '👤'} {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Result block — always visible */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800 mb-2">
            نتیجه با <strong>تعداد</strong> SL/TP (حجم مهم نیست). مثال: ۴ TP و ۲ SL با
            Risk=۱۰ → +۲۰$
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تعداد SL
              </label>
              <Input
                type="number"
                min="0"
                value={form.slHits}
                onChange={(e) => setField('slHits', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تعداد TP
              </label>
              <Input
                type="number"
                min="0"
                value={form.tpHits}
                onChange={(e) => setField('tpHits', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk ($)
              </label>
              <Input
                type="number"
                step="any"
                value={form.risk}
                onChange={(e) => setField('risk', e.target.value)}
                placeholder="اختیاری"
              />
            </div>
            <div className="flex items-end">
              <div
                className={`w-full px-3 py-2 rounded-lg text-sm font-bold tabular-nums ${
                  previewPnL == null
                    ? 'bg-gray-100 text-gray-500'
                    : previewPnL >= 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                }`}
              >
                {previewPnL == null
                  ? 'برایند: —'
                  : `${previewPnL >= 0 ? '+' : ''}$${previewPnL}`}
              </div>
            </div>
          </div>
        </div>

        {/* Full-only fields */}
        {!isQuick && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  شرایط بازار
                </label>
                <Input
                  value={form.marketCondition}
                  onChange={(e) => setField('marketCondition', e.target.value)}
                  placeholder="رنج / ترند / خبری..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  دلیل ورود
                </label>
                <Input
                  value={form.entryReason}
                  onChange={(e) => setField('entryReason', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry
                </label>
                <Input
                  type="number"
                  step="any"
                  value={form.entry}
                  onChange={(e) => setField('entry', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SL
                </label>
                <Input
                  type="number"
                  step="any"
                  value={form.sl}
                  onChange={(e) => setField('sl', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TP
                </label>
                <Input
                  type="number"
                  step="any"
                  value={form.tp}
                  onChange={(e) => setField('tp', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RR
                </label>
                <Input
                  type="number"
                  step="any"
                  value={form.rr}
                  onChange={(e) => setField('rr', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اشتباهات (نقطه ضعف)
              </label>
              <textarea
                rows={2}
                value={form.weaknesses}
                onChange={(e) => setField('weaknesses', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نقطه قوت
              </label>
              <textarea
                rows={2}
                value={form.strengths}
                onChange={(e) => setField('strengths', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                درس این معامله
              </label>
              <textarea
                rows={2}
                value={form.lesson}
                onChange={(e) => setField('lesson', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                توضیحات
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تصویر معامله
              </label>
              {!form.tradeImage ? (
                <label className="flex items-center justify-center px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-sm text-gray-600 hover:border-primary-500">
                  {uploading ? 'در حال آپلود...' : '📤 آپلود تصویر'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleImageUpload}
                  />
                </label>
              ) : (
                <div className="relative border rounded-lg p-2 bg-gray-50">
                  <img
                    src={form.tradeImage}
                    alt="Backtest"
                    className="max-h-40 mx-auto rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setField('tradeImage', '')}
                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {isQuick && (
          <p className="text-xs text-gray-500">
            برای Entry/SL/TP قیمتی، درس معامله و تصویر، به «فرم کامل» بروید. نماد، سشن،
            تایم‌فریم و Risk آخرین انتخاب شما به‌صورت پیش‌فرض ذخیره می‌شود.
          </p>
        )}

        {!isQuick && (
          <p className="text-xs text-gray-500">
            نماد، سشن، تایم‌فریم، جهت، Risk و ستاپ‌ها بعد از ذخیره برای دفعات بعد پیش‌فرض
            می‌مانند.
          </p>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            انصراف
          </Button>
          <Button type="submit" disabled={saving || uploading}>
            {saving
              ? 'در حال ذخیره...'
              : existing
                ? 'به‌روزرسانی'
                : isQuick
                  ? 'ذخیره سریع'
                  : 'ذخیره بک‌تست'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
