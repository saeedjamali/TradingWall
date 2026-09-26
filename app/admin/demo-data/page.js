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
        ? 'دیتای دمو کاربران پاک و دوباره ساخته می‌شود. پست‌های بلاگ دست نمی‌خورند. ادامه؟'
        : '۱۰ کاربر دمو با معاملات از ابتدای سال تا امروز ساخته می‌شود. ستاپ و بلاگ جدا ساخته می‌شوند. ادامه؟'
      if (!confirm(msg)) return
    }
    if (action === 'clear') {
      if (
        !confirm(
          'کاربران دمو، معاملات، پلن‌ها و فعالیت‌ها حذف می‌شوند. ستاپ‌ها و پست‌های بلاگ باقی می‌مانند. ادامه؟',
        )
      ) {
        return
      }
    }
    if (action === 'seed-blog') {
      if (
        !confirm(
          'پست‌های آموزشی بلاگ همگام می‌شوند. پست‌های موجود فقط محتوایشان به‌روز می‌شود؛ بازدید، امتیاز و تاریخ انتشار ریست نمی‌شود. ادامه؟',
        )
      ) {
        return
      }
    }
    if (action === 'seed-setup') {
      if (
        !confirm(
          'ستاپ‌های استاندارد سایت و ستاپ اختصاصی کاربران دمو همگام می‌شوند. کاربران و بلاگ دست نمی‌خورند. ادامه؟',
        )
      ) {
        return
      }
    }
    if (action === 'clear-setup') {
      if (
        !confirm(
          'فقط ستاپ‌های اختصاصی کاربران دمو حذف می‌شود. ستاپ‌های استاندارد، کاربران و بلاگ باقی می‌مانند. ادامه؟',
        )
      ) {
        return
      }
    }
    if (action === 'clear-blog') {
      if (
        !confirm(
          'همه پست‌های بلاگ دمو و نظر/امتیاز آن‌ها حذف می‌شوند. دیتای کاربران دمو باقی می‌ماند. ادامه؟',
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
  const hasBlogs = (status?.blogCount || 0) > 0
  const expectedBlogs = status?.expectedBlogCount || 0
  const blogsOutOfDate = hasBlogs && status.blogCount < expectedBlogs
  const hasUserSetups = (status?.setupCount || 0) > 0
  const expectedUserSetups = status?.expectedSetupCount || 0
  const standardSetups = status?.standardSetupCount || 0
  const expectedStandard = status?.expectedStandardSetupCount || 0
  const setupsReady =
    standardSetups >= expectedStandard &&
    (hasDemo ? status.setupCount >= expectedUserSetups : true)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">دیتای دمو</h2>
          <p className="text-gray-600 mt-1 text-sm leading-relaxed">
            کاربران دمو، ستاپ‌ها و پست‌های بلاگ جدا از هم ساخته و پاک می‌شوند.
            همگام‌سازی بلاگ بازدید و امتیاز را نگه می‌دارد.
          </p>
        </div>

        {lastResult && <LastResultCard result={lastResult} />}

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-gray-900">کاربران دمو</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                ۱۰ کاربر واقعی‌نما با معاملات از ابتدای سال جاری تا امروز، دیوار
                عمومی و فعالیت. ستاپ‌ها در بخش جدا ساخته می‌شوند.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Stat label="کاربران دمو" value={status?.userCount ?? '—'} />
            <Stat label="معاملات" value={status?.tradeCount ?? '—'} />
            <Stat label="پلن‌ها" value={status?.planCount ?? '—'} />
            <Stat label="فعالیت‌ها" value={status?.activityCount ?? '—'} />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              type="button"
              disabled={busy || hasDemo}
              onClick={() => runAction('seed', false)}
            >
              {busy ? 'در حال اجرا...' : 'ایجاد کاربران دمو'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy || !hasDemo}
              onClick={() => runAction('seed', true)}
            >
              جایگزینی مجدد کاربران
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busy || !hasDemo}
              onClick={() => runAction('clear')}
            >
              خالی کردن کاربران دمو
            </Button>
          </div>
          {hasDemo && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-4">
              کاربران دمو فعال‌اند. جایگزینی فقط رکوردهای با پرچم دمو را پاک
              می‌کند؛ کاربران واقعی، ستاپ‌ها و پست‌های بلاگ دست نخورده می‌مانند.
            </p>
          )}
          {demoPassword && (
            <p className="text-sm text-gray-600 mt-4">
              رمز ورود کاربران دمو:{' '}
              <code className="bg-gray-100 px-2 py-0.5 rounded" dir="ltr">
                {demoPassword}
              </code>
              <span className="text-gray-400 mr-2">
                (شماره: 09000000001 تا 09000000010)
              </span>
            </p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900">ستاپ‌ها</h3>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              ستاپ‌های استاندارد سایت و ستاپ اختصاصی کاربران دمو جدا از ساخت
              کاربر همگام می‌شوند. اگر کاربری از قبل ستاپ داشته باشد، دوباره
              ساخته نمی‌شود.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Stat label="ستاپ استاندارد" value={standardSetups} />
            <Stat label="استاندارد تعریف‌شده" value={expectedStandard || '—'} />
            <Stat label="ستاپ کاربران دمو" value={status?.setupCount ?? '—'} />
            <Stat
              label="وضعیت"
              value={!setupsReady ? 'ناقص' : 'همگام'}
            />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              type="button"
              disabled={busy}
              onClick={() => runAction('seed-setup')}
            >
              {busy ? 'در حال اجرا...' : 'همگام‌سازی ستاپ‌ها'}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busy || !hasUserSetups}
              onClick={() => runAction('clear-setup')}
            >
              حذف ستاپ کاربران دمو
            </Button>
          </div>
          <p className="text-xs text-violet-800 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 mt-4">
            حذف این بخش فقط ستاپ اختصاصی کاربران دمو را پاک می‌کند. ستاپ‌های
            استاندارد از صفحه «ستاپ‌ها» در ادمین مدیریت می‌شوند.
          </p>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900">پست‌های بلاگ دمو</h3>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              پست‌های آموزشی آماده (از جمله مقایسه دلاری بازارها) را جدا از
              کاربران می‌سازد. اگر پستی از قبل باشد، فقط متن و تصویر به‌روز
              می‌شود؛ بازدید و امتیاز ریست نمی‌شود.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            <Stat label="پست موجود" value={status?.blogCount ?? '—'} />
            <Stat label="پست تعریف‌شده" value={expectedBlogs || '—'} />
            <Stat
              label="وضعیت"
              value={
                !hasBlogs
                  ? 'خالی'
                  : blogsOutOfDate
                    ? 'ناقص'
                    : 'همگام'
              }
            />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              type="button"
              disabled={busy}
              onClick={() => runAction('seed-blog')}
            >
              {busy
                ? 'در حال اجرا...'
                : hasBlogs
                  ? 'همگام‌سازی پست‌های بلاگ'
                  : 'ایجاد پست‌های بلاگ'}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busy || !hasBlogs}
              onClick={() => runAction('clear-blog')}
            >
              حذف پست‌های بلاگ دمو
            </Button>
          </div>
          {hasBlogs && (
            <p className="text-xs text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 mt-4">
              همگام‌سازی محتوا را با فایل دمو یکی می‌کند و بازدید/امتیاز قبلی را
              نگه می‌دارد. حذف بلاگ، کاربران دمو را پاک نمی‌کند.
            </p>
          )}
        </section>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
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
              هنوز کاربر دمو نیست. از بخش بالا «ایجاد کاربران دمو» را بزنید.
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

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">پست‌های بلاگ دمو</h3>
            <Link
              href="/blog"
              className="text-sm text-blue-600 hover:underline"
              target="_blank"
            >
              مشاهده بلاگ
            </Link>
          </div>
          {!hasBlogs ? (
            <p className="text-center py-10 text-gray-500 text-sm">
              هنوز پست بلاگ دمو نیست. از بخش بالا «ایجاد پست‌های بلاگ» را بزنید.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {status.blogs.map((post) => (
                <li
                  key={post.id}
                  className="px-5 py-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-medium text-gray-900 hover:text-blue-700"
                      target="_blank"
                    >
                      {post.title}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">
                      بازدید {post.views}
                      {post.ratingCount > 0
                        ? ` · امتیاز ${post.ratingAvg} از ${post.ratingCount} رأی`
                        : ' · هنوز امتیازی ندارد'}
                    </div>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shrink-0"
                    target="_blank"
                  >
                    مشاهده
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function LastResultCard({ result }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-emerald-900">
      {result.action === 'seed' && result.skipped && <p>{result.message}</p>}
      {result.action === 'seed' && !result.skipped && (
        <ul className="space-y-1 list-disc list-inside">
          <li>کاربر: {result.createdUsers}</li>
          <li>معامله: {result.createdTrades}</li>
          <li>پلن: {result.createdPlans}</li>
          <li>فعالیت: {result.createdActivities}</li>
        </ul>
      )}
      {result.action === 'clear' && (
        <ul className="space-y-1 list-disc list-inside">
          <li>حذف کاربر: {result.deletedUsers}</li>
          <li>حذف معامله: {result.deletedTrades}</li>
          <li>حذف پلن: {result.deletedPlans}</li>
          <li>حذف فعالیت: {result.deletedActivities}</li>
        </ul>
      )}
      {result.action === 'seed-blog' && (
        <div className="space-y-1">
          <p>{result.message}</p>
          <p>
            ساخته‌شده: {result.createdBlogPosts ?? 0} · به‌روزشده:{' '}
            {result.updatedBlogPosts ?? 0} · کل: {result.totalBlogPosts ?? 0}
          </p>
        </div>
      )}
      {result.action === 'seed-setup' && (
        <div className="space-y-1">
          <p>{result.message}</p>
          <p>
            ستاپ کاربر: {result.createdSetups ?? 0} · کاربر ردشده:{' '}
            {result.skippedUsers ?? 0} · استاندارد اضافه‌شده:{' '}
            {result.standardInserted ?? 0}
          </p>
        </div>
      )}
      {result.action === 'clear-setup' && (
        <p>حذف ستاپ کاربران دمو: {result.deletedSetups ?? 0}</p>
      )}
      {result.action === 'clear-blog' && (
        <ul className="space-y-1 list-disc list-inside">
          <li>حذف پست: {result.deletedBlogPosts ?? 0}</li>
          <li>حذف نظر: {result.deletedBlogComments ?? 0}</li>
          <li>حذف امتیاز: {result.deletedBlogRatings ?? 0}</li>
        </ul>
      )}
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
