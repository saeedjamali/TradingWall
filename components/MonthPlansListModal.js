'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'

const PERIOD_LABELS = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
}

const MOOD_LABELS = {
  calm: { label: 'آرام', emoji: '😌' },
  stressed: { label: 'استرس', emoji: '😰' },
  confident: { label: 'مطمئن', emoji: '😎' },
  anxious: { label: 'نگران', emoji: '😟' },
  focused: { label: 'متمرکز', emoji: '🎯' },
  tired: { label: 'خسته', emoji: '😴' },
  neutral: { label: 'عادی', emoji: '😐' },
}

function planOverlapsMonth(plan, year, monthIndex) {
  const planDate = new Date(plan.date)
  const monthStart = new Date(year, monthIndex, 1)
  monthStart.setHours(0, 0, 0, 0)
  const monthEnd = new Date(year, monthIndex + 1, 0)
  monthEnd.setHours(23, 59, 59, 999)

  if (plan.period === 'daily') {
    return (
      planDate.getFullYear() === year && planDate.getMonth() === monthIndex
    )
  }

  if (plan.period === 'monthly') {
    return (
      planDate.getFullYear() === year && planDate.getMonth() === monthIndex
    )
  }

  if (plan.period === 'weekly') {
    const weekStart = new Date(planDate)
    const dayOfWeek = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return weekStart <= monthEnd && weekEnd >= monthStart
  }

  return false
}

function formatPlanDate(plan) {
  const date = new Date(plan.date)
  const dateText = date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (plan.period === 'weekly') {
    const weekStart = new Date(date)
    const dayOfWeek = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - dayOfWeek)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return `${weekStart.toLocaleDateString('fa-IR')} تا ${weekEnd.toLocaleDateString('fa-IR')}`
  }

  if (plan.period === 'monthly') {
    return date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' })
  }

  return dateText
}

function periodBadgeClass(period) {
  if (period === 'daily') return 'bg-primary-100 text-primary-700'
  if (period === 'weekly') return 'bg-teal-100 text-teal-700'
  return 'bg-indigo-100 text-indigo-700'
}

export default function MonthPlansListModal({
  isOpen,
  onClose,
  userId,
  currentMonth,
}) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewImage, setPreviewImage] = useState(null)

  const year = currentMonth.getFullYear()
  const monthIndex = currentMonth.getMonth()
  const monthTitle = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    if (!isOpen || !userId) return

    const fetchPlans = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/plans?userId=${userId}`)
        const data = await response.json()
        if (data.success) {
          setPlans(data.plans || [])
        } else {
          setError(data.error || 'خطا در دریافت پلن‌ها')
          setPlans([])
        }
      } catch (err) {
        console.error('Error fetching month plans:', err)
        setError('خطا در دریافت پلن‌ها')
        setPlans([])
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [isOpen, userId, year, monthIndex])

  const monthPlans = useMemo(() => {
    return (plans || [])
      .filter((plan) => planOverlapsMonth(plan, year, monthIndex))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [plans, year, monthIndex])

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`پلن‌های معاملاتی ${monthTitle}`}
        size="lg"
      >
        <div>
          <p className="text-sm text-gray-500 mb-4">
            لیست پلن‌های ثبت‌شده برای این ماه — توضیحات، حال‌وهوا و تصویر هر پلن
          </p>

          {loading && (
            <div className="py-10 text-center text-gray-500">
              در حال بارگذاری پلن‌ها...
            </div>
          )}

          {!loading && error && (
            <div className="py-6 text-center text-rose-600">{error}</div>
          )}

          {!loading && !error && monthPlans.length === 0 && (
            <div className="py-10 text-center text-gray-500">
              برای این ماه هنوز پلنی ثبت نشده است.
              <div className="text-xs mt-2 text-gray-400">
                روی روزهای تقویم کلیک کنید تا پلن بسازید.
              </div>
            </div>
          )}

          {!loading && !error && monthPlans.length > 0 && (
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {monthPlans.map((plan) => {
                const mood = MOOD_LABELS[plan.mood] || MOOD_LABELS.neutral
                return (
                  <article
                    key={plan._id}
                    className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="font-bold text-gray-800">
                          {formatPlanDate(plan)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(plan.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${periodBadgeClass(plan.period)}`}
                      >
                        {PERIOD_LABELS[plan.period] || plan.period}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                      {plan.maxTrades != null && (
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">
                          حداکثر معامله: {plan.maxTrades}
                        </span>
                      )}
                      {plan.maxLoss != null && (
                        <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700">
                          حداکثر ضرر: ${plan.maxLoss}
                        </span>
                      )}
                      {plan.maxLossPercent != null && (
                        <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700">
                          حداکثر ضرر: {plan.maxLossPercent}%
                        </span>
                      )}
                      {plan.targetProfit != null && (
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
                          هدف سود: ${plan.targetProfit}
                        </span>
                      )}
                      <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-800">
                        {mood.emoji} {mood.label}
                      </span>
                    </div>

                    {plan.notes ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6 mb-3">
                        {plan.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 mb-3">بدون توضیحات</p>
                    )}

                    {plan.tradeImage && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(plan.tradeImage)}
                        className="relative block w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={plan.tradeImage}
                          alt="تصویر پلن معاملاتی"
                          className="h-40 w-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
                          بزرگ‌نمایی تصویر
                        </span>
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </Modal>

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 left-4 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
            onClick={() => setPreviewImage(null)}
          >
            بستن
          </button>
          <img
            src={previewImage}
            alt="پیش‌نمایش تصویر پلن"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
