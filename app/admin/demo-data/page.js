'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import Button from '@/components/Button'
import { UserName } from '@/components/VerifiedBadge'

export default function AdminDemoDataPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(null)
  const [demoPassword, setDemoPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const fetchStatus = useCallback(async (adminUserId) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/demo-data?adminUserId=${adminUserId}`,
      )
      const data = await res.json()
      if (data.success) {
        setStatus(data.status)
        setDemoPassword(data.demoPassword || '')
      } else {
        alert(data.error || 'خطا در دریافت وضعیت')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در دریافت وضعیت دیتای دمو')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const tokenExpiry = localStorage.getItem('tokenExpiry')

    if (!userData || !tokenExpiry || Date.now() >= parseInt(tokenExpiry)) {
      localStorage.removeItem('user')
      localStorage.removeItem('tokenExpiry')
      router.push('/auth/login')
      return
    }

    const parsed = JSON.parse(userData)
    if (parsed.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setUser(parsed)
    fetchStatus(parsed.id)
  }, [router, fetchStatus])

  const runAction = async (action, replace = false) => {
    if (!user) return

    if (action === 'seed') {
      const msg = replace
        ? 'دیتای دمو فعلی پاک و دوباره ساخته می‌شود. ادامه؟'
        : '۱۰ کاربر دمو با معاملات از ابتدای سال تا امروز ساخته می‌شود. ادامه؟'
      if (!confirm(msg)) return
    }
    if (action === 'clear') {
      if (
        !confirm(
          'همه کاربران دمو، معاملات، پلن‌ها، ستاپ‌ها و فعالیت‌های مرتبط حذف می‌شوند. ادامه؟',
        )
      ) {
        return
      }
    }

    setBusy(true)
    setLastResult(null)
    try {
      const res = await fetch('/api/admin/demo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          action,
          replace,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'عملیات ناموفق بود')
      }
      setLastResult(data)
      await fetchStatus(user.id)
    } catch (error) {
      console.error(error)
      alert(error.message || 'خطا در انجام عملیات')
    } finally {
      setBusy(false)
    }
  }

  if (!user || (loading && !status)) {
    return <Loading text="در حال بارگذاری..." />
  }

  const hasDemo = (status?.userCount || 0) > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">دیتای دمو</h2>
          <p className="text-gray-600 mt-1 text-sm leading-relaxed">
            ۱۰ کاربر واقعی‌نما با معاملات از ابتدای سال جاری تا امروز (حدود یک
            معامله در هر روز کاری، سود و حد ضرر حداکثر حدود ۹۰–۱۰۰ دلار)، دیوار
            عمومی، ستاپ و فعالیت — برای پر کردن لیدربورد و دیوار معاملاتی.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Stat label="کاربران دمو" value={status?.userCount ?? '—'} />
          <Stat label="معاملات" value={status?.tradeCount ?? '—'} />
          <Stat label="پلن‌ها" value={status?.planCount ?? '—'} />
          <Stat label="ستاپ‌ها" value={status?.setupCount ?? '—'} />
          <Stat label="فعالیت‌ها" value={status?.activityCount ?? '—'} />
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6 space-y-4">
          <h3 className="font-bold text-gray-800">عملیات</h3>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              type="button"
              disabled={busy || hasDemo}
              onClick={() => runAction('seed', false)}
            >
              {busy ? 'در حال اجرا...' : 'ایجاد دیتای دمو'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy || !hasDemo}
              onClick={() => runAction('seed', true)}
            >
              جایگزینی مجدد
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busy || !hasDemo}
              onClick={() => runAction('clear')}
            >
              خالی کردن دیتای دمو
            </Button>
          </div>
          {hasDemo && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              دیتای دمو فعال است. برای ساخت دوباره از «جایگزینی مجدد» استفاده
              کنید. فقط رکوردهای با پرچم دمو حذف می‌شوند؛ کاربران واقعی دست
              نخورده می‌مانند.
            </p>
          )}
          {demoPassword && (
            <p className="text-sm text-gray-600">
              رمز ورود کاربران دمو:{' '}
              <code className="bg-gray-100 px-2 py-0.5 rounded" dir="ltr">
                {demoPassword}
              </code>
              <span className="text-gray-400 mr-2">
                (شماره: 09000000001 تا 09000000010)
              </span>
            </p>
          )}
        </div>

        {/* Last result */}
        {lastResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-emerald-900">
            {lastResult.action === 'seed' && lastResult.skipped && (
              <p>{lastResult.message}</p>
            )}
            {lastResult.action === 'seed' && !lastResult.skipped && (
              <ul className="space-y-1 list-disc list-inside">
                <li>کاربر: {lastResult.createdUsers}</li>
                <li>معامله: {lastResult.createdTrades}</li>
                <li>پلن: {lastResult.createdPlans}</li>
                <li>ستاپ: {lastResult.createdSetups}</li>
                <li>فعالیت: {lastResult.createdActivities}</li>
              </ul>
            )}
            {lastResult.action === 'clear' && (
              <ul className="space-y-1 list-disc list-inside">
                <li>حذف کاربر: {lastResult.deletedUsers}</li>
                <li>حذف معامله: {lastResult.deletedTrades}</li>
                <li>حذف پلن: {lastResult.deletedPlans}</li>
                <li>حذف ستاپ: {lastResult.deletedSetups}</li>
                <li>حذف فعالیت: {lastResult.deletedActivities}</li>
              </ul>
            )}
          </div>
        )}

        {/* User list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">کاربران دمو</h3>
            <button
              type="button"
              onClick={() => fetchStatus(user.id)}
              className="text-sm text-blue-600 hover:underline"
              disabled={busy}
            >
              تازه‌سازی
            </button>
          </div>
          {!hasDemo ? (
            <p className="text-center py-10 text-gray-500 text-sm">
              هنوز دیتای دموی نیست. روی «ایجاد دیتای دمو» بزنید.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {status.users.map((u) => (
                <li
                  key={u.id}
                  className="px-5 py-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <UserName
                      name={u.publicName}
                      verified={u.verified}
                      className="font-medium text-gray-900"
                    />
                    <div className="text-xs text-gray-500" dir="ltr">
                      {u.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.wallPublic && (
                      <Link
                        href={`/wall/${u.id}`}
                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                        target="_blank"
                      >
                        دیوار
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
      <div className="text-xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
