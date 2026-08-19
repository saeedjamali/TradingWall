'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SymbolSelect from '@/components/SymbolSelect'
import SelectedSetupNote from '@/components/SelectedSetupNote'
import { getSessionUser } from '@/utils/session'
import { BACKTEST_TIMEFRAMES } from '@/utils/backtest'
import { formatDualDate, getChallengeTypeMeta, buildDefaultChallengeTitle } from '@/utils/challenge'

function toInputDate(d) {
  const x = d instanceof Date ? d : new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthBounds(year, monthIndex) {
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 0)
  return { start, end }
}

function addDays(base, n) {
  const x = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  x.setDate(x.getDate() + n)
  return x
}

function weekFromToday() {
  const start = new Date()
  return { start, end: addDays(start, 6) }
}

function DualHint({ value }) {
  if (!value) return null
  const { fa, en } = formatDualDate(value)
  return (
    <p className="text-[10px] text-gray-500 mt-1">
      {fa} <span className="text-gray-600">·</span> {en}
    </p>
  )
}

export default function NewChallengePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [standardSetups, setStandardSetups] = useState([])
  const now = new Date()
  const defaultChart = monthBounds(now.getFullYear(), now.getMonth() - 1)
  const defaultWindow = weekFromToday()
  const nextMonth = monthBounds(now.getFullYear(), now.getMonth() + 1)

  const [form, setForm] = useState({
    type: 'backtest',
    title: buildDefaultChallengeTitle('backtest', defaultChart.start),
    description: '',
    symbol: '',
    timeframe: '',
    backtestRangeStart: toInputDate(defaultChart.start),
    backtestRangeEnd: toInputDate(defaultChart.end),
    challengeStartAt: toInputDate(defaultWindow.start),
    challengeEndAt: toInputDate(defaultWindow.end),
    maxParticipants: '20',
    unlimited: false,
    requireApproval: false,
    suggestedSetupId: '',
    rules: '',
  })

  useEffect(() => {
    const u = getSessionUser()
    if (!u) {
      router.push('/auth/login?next=/challenges/new')
      return
    }
    setUser(u)
    ;(async () => {
      try {
        const res = await fetch('/api/setups?standard=1')
        const data = await res.json()
        if (data.success) setStandardSetups(data.setups || [])
      } catch {
        // ignore
      }
    })()
  }, [router])

  const typeMeta = getChallengeTypeMeta(form.type)
  const todayMin = toInputDate(new Date())

  const applyTypeDefaults = (type) => {
    if (type === 'trade') {
      setForm((f) => ({
        ...f,
        type,
        backtestRangeStart: toInputDate(nextMonth.start),
        backtestRangeEnd: toInputDate(nextMonth.end),
        challengeStartAt: toInputDate(nextMonth.start),
        challengeEndAt: toInputDate(nextMonth.end),
        title: buildDefaultChallengeTitle('trade', nextMonth.start, f.symbol),
        suggestedSetupId: '',
      }))
    } else {
      const window = weekFromToday()
      setForm((f) => ({
        ...f,
        type,
        backtestRangeStart: toInputDate(defaultChart.start),
        backtestRangeEnd: toInputDate(defaultChart.end),
        challengeStartAt: toInputDate(window.start),
        challengeEndAt: toInputDate(window.end),
        title: buildDefaultChallengeTitle('backtest', defaultChart.start, f.symbol),
      }))
    }
  }

  const setQuickMonth = (offset) => {
    const d = new Date()
    d.setMonth(d.getMonth() + offset)
    let { start, end } = monthBounds(d.getFullYear(), d.getMonth())
    if (form.type === 'trade') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (end < today) return
      if (start < today) start = today
    }
    setForm((f) => ({
      ...f,
      backtestRangeStart: toInputDate(start),
      backtestRangeEnd: toInputDate(end),
      ...(f.type === 'trade'
        ? {
            challengeStartAt: toInputDate(start),
            challengeEndAt: toInputDate(end),
          }
        : {}),
      title: buildDefaultChallengeTitle(f.type, start, f.symbol),
    }))
  }

  const setQuickChallengeWeek = (offsetWeeks) => {
    const start = addDays(new Date(), offsetWeeks * 7)
    const end = addDays(start, 6)
    setForm((f) => ({
      ...f,
      challengeStartAt: toInputDate(start),
      challengeEndAt: toInputDate(end),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    const windowStart =
      form.type === 'trade' ? form.backtestRangeStart : form.challengeStartAt
    const windowEnd =
      form.type === 'trade' ? form.backtestRangeEnd : form.challengeEndAt
    if (windowStart < todayMin || windowEnd < todayMin) {
      alert('تاریخ شروع و پایان چالش نمی‌تواند قبل از امروز باشد')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: form.type,
          challengeType: form.type,
          title: form.title,
          description: form.description,
          symbol: form.symbol,
          timeframe: form.timeframe,
          minBacktests: 1,
          backtestRangeStart: form.backtestRangeStart,
          backtestRangeEnd: form.backtestRangeEnd,
          challengeStartAt:
            form.type === 'trade' ? form.backtestRangeStart : form.challengeStartAt,
          challengeEndAt:
            form.type === 'trade' ? form.backtestRangeEnd : form.challengeEndAt,
          maxParticipants: form.unlimited ? null : Number(form.maxParticipants) || 20,
          requireApproval: form.requireApproval,
          suggestedSetupId:
            form.type === 'backtest' ? form.suggestedSetupId || null : null,
          rules: form.rules,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ایجاد چالش')
      }
      router.push(data.invitePath || `/challenges/${data.challenge.inviteCode}`)
    } catch (err) {
      alert(err.message || 'خطا')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl" dir="rtl">
        <Link href="/challenges/browse" className="text-sm text-primary-300 hover:underline">
          ← بازگشت به همه چالش‌ها
        </Link>
        <h1 className="text-2xl font-bold mt-4 mb-2">ایجاد چالش بک‌تست / چالش معامله</h1>
        <p className="text-sm text-gray-400 mb-6">
          هدف، شناسایی نقاط ضعف و قوت و تحلیل عملکرد است — نه رتبه‌بندی. نوع چالش، نماد
          و بازه‌ها را مشخص کنید؛ لینک دعوت بعد از ساخت آماده می‌شود.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <label className="block text-xs text-gray-400 mb-2">نوع چالش</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyTypeDefaults('backtest')}
                className={`rounded-xl border px-3 py-3 text-right transition-colors ${
                  form.type === 'backtest'
                    ? 'border-emerald-400/40 bg-emerald-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="font-bold text-sm">چالش بک‌تست</div>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  تحلیل بک‌تست‌های ثبت‌شده روی روزهای تاریخی چارت — پیدا کردن ضعف و قوت ستاپ‌ها
                </p>
              </button>
              <button
                type="button"
                onClick={() => applyTypeDefaults('trade')}
                className={`rounded-xl border px-3 py-3 text-right transition-colors ${
                  form.type === 'trade'
                    ? 'border-amber-400/40 bg-amber-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="font-bold text-sm">چالش معامله</div>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  تحلیل معاملات واقعی در بازه مشخص (معمولاً آینده) با ثبت نتیجه در ژورنال
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">عنوان چالش</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
              placeholder={
                form.type === 'trade'
                  ? 'مثلاً چالش معامله US30 ماه آینده'
                  : 'مثلاً چالش بک‌تست EURUSD اکتبر'
              }
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">توضیح کوتاه</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">نماد</label>
              <div className="bg-white rounded-lg text-gray-900">
                <SymbolSelect
                  value={form.symbol}
                  onChange={(symbol) =>
                    setForm((f) => ({
                      ...f,
                      symbol,
                      title: buildDefaultChallengeTitle(f.type, f.backtestRangeStart, symbol),
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">تایم‌فریم پیشنهادی</label>
              <select
                value={form.timeframe}
                onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
              >
                <option value="">اختیاری</option>
                {BACKTEST_TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf} className="text-gray-900">
                    {tf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.type === 'backtest' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                ستاپ پیشنهادی (اختیاری)
              </label>
              <select
                value={form.suggestedSetupId}
                onChange={(e) =>
                  setForm({ ...form, suggestedSetupId: e.target.value })
                }
                className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
              >
                <option value="" className="text-gray-900">
                  بدون ستاپ مشخص — همه بک‌تست‌های نماد شمرده می‌شوند
                </option>
                {standardSetups.map((s) => (
                  <option key={s._id} value={s._id} className="text-gray-900">
                    {s.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                اگر ستاپ انتخاب شود، فقط بک‌تست‌هایی که همین ستاپ استاندارد را دارند در چالش
                حساب می‌شوند. ستاپ مدنظرتان در لیست نیست؟ از بخش{' '}
                <Link
                  href="/?category=add_setup#support"
                  className="text-primary-400 hover:text-primary-300 underline underline-offset-2"
                >
                  نظر یا پیشنهاد
                </Link>{' '}
                در صفحه اصلی، دسته «افزودن / مشکل ستاپ» پیشنهاد بدهید.
              </p>
              <SelectedSetupNote
                setups={standardSetups}
                selectedIds={form.suggestedSetupId}
                dark
              />
            </div>
          )}

          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-100/90 leading-relaxed">
            <p className="font-bold text-emerald-200 mb-1">معیار پیشرفت چالش</p>
            <p>{typeMeta.progressHint}</p>
            <p className="mt-1 text-emerald-200/70">
              درصد پیشرفت = (تعداد روزهای دارای حداقل یک ثبت) ÷ (کل روزهای{' '}
              {form.type === 'trade' ? 'بازه معاملات' : 'بازه چارت'})
            </p>
          </div>

          {/* Range guide */}
          <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-3 text-xs text-sky-100/90 space-y-2 leading-relaxed">
            <p className="font-bold text-sky-200">راهنمای بازه</p>
            {form.type === 'backtest' ? (
              <p>
                <strong className="text-white">بازه چارت</strong> روزهای تاریخی است که باید پوشش
                داده شود. <strong className="text-white">بازه چالش</strong> مهلت انجام بک‌تست است
                و می‌تواند کوتاه‌تر باشد — مثلاً یک ماه چارت را در یک هفته بک‌تست کنید. شروع و
                پایان چالش نمی‌تواند قبل از امروز باشد.
              </p>
            ) : (
              <p>
                <strong className="text-white">بازه چالش = بازه معاملات:</strong> هر معامله باید در
                همان روز خودش انجام شود؛ نمی‌توان معاملات یک ماه را در یک هفته جلو جلو بست. شروع
                و پایان نمی‌تواند قبل از امروز باشد.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                {form.type === 'trade'
                  ? 'بازه معاملات (همان بازه چالش)'
                  : 'بازه چارت'}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setQuickMonth(0)}
                  className="text-[11px] px-2 py-1 rounded bg-white/10"
                >
                  ماه جاری
                </button>
                <button
                  type="button"
                  onClick={() => setQuickMonth(form.type === 'trade' ? 1 : -1)}
                  className="text-[11px] px-2 py-1 rounded bg-white/10"
                >
                  {form.type === 'trade' ? 'ماه بعد' : 'ماه قبل'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-gray-500">از</label>
                <input
                  type="date"
                  required
                  min={form.type === 'trade' ? todayMin : undefined}
                  value={form.backtestRangeStart}
                  onChange={(e) =>
                    setForm({ ...form, backtestRangeStart: e.target.value })
                  }
                  className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
                />
                <DualHint value={form.backtestRangeStart} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500">تا</label>
                <input
                  type="date"
                  required
                  min={form.type === 'trade' ? todayMin : undefined}
                  value={form.backtestRangeEnd}
                  onChange={(e) =>
                    setForm({ ...form, backtestRangeEnd: e.target.value })
                  }
                  className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
                />
                <DualHint value={form.backtestRangeEnd} />
              </div>
            </div>
          </div>

          {form.type === 'backtest' && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">بازه چالش (مهلت انجام)</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setQuickChallengeWeek(0)}
                    className="text-[11px] px-2 py-1 rounded bg-white/10"
                  >
                    این هفته
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickChallengeWeek(1)}
                    className="text-[11px] px-2 py-1 rounded bg-white/10"
                  >
                    هفته بعد
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-500">شروع چالش</label>
                  <input
                    type="date"
                    required
                    min={todayMin}
                    value={form.challengeStartAt}
                    onChange={(e) =>
                      setForm({ ...form, challengeStartAt: e.target.value })
                    }
                    className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
                  />
                  <DualHint value={form.challengeStartAt} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500">پایان چالش</label>
                  <input
                    type="date"
                    required
                    min={todayMin}
                    value={form.challengeEndAt}
                    onChange={(e) =>
                      setForm({ ...form, challengeEndAt: e.target.value })
                    }
                    className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
                  />
                  <DualHint value={form.challengeEndAt} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input
                type="checkbox"
                checked={form.unlimited}
                onChange={(e) => setForm({ ...form, unlimited: e.target.checked })}
              />
              بدون سقف تعداد شرکت‌کننده
            </label>
            {!form.unlimited && (
              <input
                type="number"
                min="2"
                value={form.maxParticipants}
                onChange={(e) =>
                  setForm({ ...form, maxParticipants: e.target.value })
                }
                className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
                placeholder="حداکثر افراد"
              />
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">دسترسی</label>
            <select
              value={form.requireApproval ? 'private' : 'public'}
              onChange={(e) =>
                setForm({ ...form, requireApproval: e.target.value === 'private' })
              }
              className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
            >
              <option value="public" className="text-gray-900">
                عمومی — پیوستن بدون تایید سازنده
              </option>
              <option value="private" className="text-gray-900">
                خصوصی — پیوستن فقط با تایید سازنده
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">قوانین / نکات</label>
            <textarea
              value={form.rules}
              onChange={(e) => setForm({ ...form, rules: e.target.value })}
              rows={3}
              className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm"
              placeholder="مثلاً فقط ستاپ‌های مشخص، بدون اسکالپ زیر خبر..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 font-bold disabled:opacity-50"
          >
            {saving ? 'در حال ایجاد…' : `ایجاد ${typeMeta.label} و دریافت لینک`}
          </button>
        </form>
      </div>
    </main>
  )
}
