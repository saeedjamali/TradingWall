'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Loading from '@/components/Loading'
import AppTopNav from '@/components/AppTopNav'
import { UserName } from '@/components/VerifiedBadge'
import { getSessionUser } from '@/utils/session'
import { BACKTEST_TIMEFRAMES } from '@/utils/backtest'
import {
  formatDualDateRange,
  getChallengeTypeMeta,
  resolveChallengeType,
} from '@/utils/challenge'

const PHASE_META = {
  upcoming: {
    label: 'به‌زودی',
    chip: 'bg-sky-500/15 text-sky-300 border-sky-400/25',
  },
  active: {
    label: 'در حال برگزاری',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  },
  ended: {
    label: 'پایان‌یافته',
    chip: 'bg-white/10 text-gray-400 border-white/10',
  },
}

const emptyFilters = {
  q: '',
  type: '',
  symbol: '',
  timeframe: '',
  phase: '',
  access: '',
}

function filtersFromParams(searchParams) {
  return {
    q: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    symbol: (searchParams.get('symbol') || '').toUpperCase(),
    timeframe: searchParams.get('timeframe') || '',
    phase: searchParams.get('phase') || '',
    access: searchParams.get('access') || '',
  }
}

function BrowseChallengesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams))
  const [applied, setApplied] = useState(() => filtersFromParams(searchParams))
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState(null)

  useEffect(() => {
    setUser(getSessionUser())
  }, [])

  useEffect(() => {
    const next = filtersFromParams(searchParams)
    setFilters(next)
    setApplied(next)
  }, [searchParams])

  const syncUrl = (next) => {
    const params = new URLSearchParams()
    if (next.q.trim()) params.set('q', next.q.trim())
    if (next.type) params.set('type', next.type)
    if (next.symbol.trim()) params.set('symbol', next.symbol.trim())
    if (next.timeframe) params.set('timeframe', next.timeframe)
    if (next.phase) params.set('phase', next.phase)
    if (next.access) params.set('access', next.access)
    const qs = params.toString()
    router.replace(`/challenges/browse${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ scope: 'public', limit: '80' })
      if (applied.q.trim()) params.set('q', applied.q.trim())
      if (applied.type) params.set('type', applied.type)
      if (applied.symbol.trim()) params.set('symbol', applied.symbol.trim())
      if (applied.timeframe) params.set('timeframe', applied.timeframe)
      if (applied.phase) params.set('phase', applied.phase)
      if (applied.access) params.set('access', applied.access)
      const session = getSessionUser()
      if (session?.id) params.set('viewerId', session.id)

      const res = await fetch(`/api/challenges?${params}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در دریافت چالش‌ها')
      }
      setChallenges(data.challenges || [])
    } catch (err) {
      console.error(err)
      setChallenges([])
    } finally {
      setLoading(false)
    }
  }, [applied])

  useEffect(() => {
    load()
  }, [load])

  const applyFilters = (next) => {
    setFilters(next)
    setApplied(next)
    syncUrl(next)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    applyFilters({ ...filters })
  }

  const handleJoin = async (c) => {
    const code = c.inviteCode
    if (!user?.id) {
      router.push(`/auth/login?next=/challenges/${code}`)
      return
    }
    setJoiningId(c._id)
    try {
      const res = await fetch(`/api/challenges/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا در عضویت')
      router.push(`/challenges/${code}`)
    } catch (err) {
      alert(err.message || 'خطا')
    } finally {
      setJoiningId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    setUser(null)
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="border-b border-white/10 bg-black/25 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity">
              <Image
                src="/logo/tradinggwall-logo-horizontal.svg"
                alt="Trading Wall"
                width={519}
                height={163}
                priority
                className="h-8 md:h-10 w-auto max-w-[150px] md:max-w-[200px]"
              />
            </Link>
            {user && (
              <>
                <span className="text-white/25 hidden sm:inline">|</span>
                <UserName
                  name={user.publicName}
                  verified={user.verified}
                  className="hidden sm:inline text-white/75 text-sm max-w-[130px]"
                  badgeClassName="w-4 h-4 text-blue-400"
                />
              </>
            )}
          </div>
          {user ? (
            <AppTopNav isAdmin={user.role === 'admin'} onLogout={handleLogout} />
          ) : (
            <Link
              href="/auth/login?next=/challenges/browse"
              className="text-sm px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 font-semibold"
            >
              ورود
            </Link>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.18),_transparent_55%)]" />
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl relative" dir="rtl">
          <p className="text-emerald-400/90 text-xs font-semibold tracking-wide mb-2">
            کشف چالش‌ها
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                همه چالش‌ها
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-300 leading-relaxed">
                چالش‌های عمومی (پیوستن بدون تایید) و خصوصی (نیاز به تایید سازنده) را جستجو کنید و درخواست پیوستن بدهید.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              {user && (
                <Link
                  href="/challenges"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                >
                  چالش‌های من
                </Link>
              )}
              <Link
                href={user ? '/challenges/new' : '/auth/login?next=/challenges/new'}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold"
              >
                ایجاد چالش
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl" dir="rtl">
        <form
          onSubmit={handleSearch}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5 mb-6 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-[11px] text-gray-500 mb-1">جستجو</label>
              <input
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                placeholder="عنوان، توضیح یا نماد…"
                className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">نوع</label>
              <select
                value={filters.type}
                onChange={(e) => applyFilters({ ...filters, type: e.target.value })}
                className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm"
              >
                <option value="" className="text-gray-900">
                  همه
                </option>
                <option value="backtest" className="text-gray-900">
                  چالش بک‌تست
                </option>
                <option value="trade" className="text-gray-900">
                  چالش معامله
                </option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">دسترسی</label>
              <select
                value={filters.access}
                onChange={(e) => applyFilters({ ...filters, access: e.target.value })}
                className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm"
              >
                <option value="" className="text-gray-900">
                  همه
                </option>
                <option value="public" className="text-gray-900">
                  عمومی (بدون تایید)
                </option>
                <option value="private" className="text-gray-900">
                  خصوصی (با تایید سازنده)
                </option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">وضعیت</label>
              <select
                value={filters.phase}
                onChange={(e) => applyFilters({ ...filters, phase: e.target.value })}
                className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm"
              >
                <option value="" className="text-gray-900">
                  همه
                </option>
                <option value="upcoming" className="text-gray-900">
                  به‌زودی
                </option>
                <option value="active" className="text-gray-900">
                  در حال برگزاری
                </option>
                <option value="ended" className="text-gray-900">
                  پایان‌یافته
                </option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">نماد</label>
              <input
                value={filters.symbol}
                onChange={(e) =>
                  setFilters({ ...filters, symbol: e.target.value.toUpperCase() })
                }
                placeholder="مثلاً US30"
                className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">تایم‌فریم</label>
              <select
                value={filters.timeframe}
                onChange={(e) =>
                  applyFilters({ ...filters, timeframe: e.target.value })
                }
                className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm"
              >
                <option value="" className="text-gray-900">
                  همه
                </option>
                {BACKTEST_TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf} className="text-gray-900">
                    {tf}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-sm font-bold"
              >
                اعمال فیلتر
              </button>
              <button
                type="button"
                onClick={() => applyFilters(emptyFilters)}
                className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
              >
                پاک کردن
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loading text="در حال بارگذاری چالش‌ها..." />
          </div>
        ) : challenges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-14 text-center">
            <p className="text-sm text-gray-500">چالشی با این فیلترها پیدا نشد.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {challenges.map((c) => {
              const resolvedType = resolveChallengeType(c)
              const typeMeta = getChallengeTypeMeta(resolvedType)
              const phase = PHASE_META[c.phase] || PHASE_META.active
              const range = formatDualDateRange(
                c.backtestRangeStart,
                c.backtestRangeEnd,
              )
              const myStatus = c.myStatus
              const canRequestJoin =
                c.phase !== 'ended' &&
                !myStatus &&
                String(c.creatorId) !== String(user?.id)

              return (
                <article
                  key={c._id}
                  className="rounded-2xl border border-white/10 bg-gradient-to-bl from-white/[0.07] to-white/[0.02] p-4 md:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            resolvedType === 'trade'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-400/25'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25'
                          }`}
                        >
                          {typeMeta.label}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${phase.chip}`}
                        >
                          {phase.label}
                        </span>
                        {c.requireApproval ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-200 border border-amber-400/20">
                            خصوصی
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">
                            عمومی
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/challenges/${c.inviteCode}`}
                        className="font-bold text-white text-base md:text-lg hover:text-emerald-100 transition-colors"
                      >
                        {c.title}
                      </Link>
                      {c.description ? (
                        <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                          {c.description}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span className="inline-flex items-center rounded-lg bg-emerald-500/15 border border-emerald-400/20 px-2.5 py-1 font-bold text-emerald-300">
                          {c.symbol}
                        </span>
                        {c.timeframe ? <span>{c.timeframe}</span> : null}
                        {c.suggestedSetup?.title ? (
                          <span className="text-amber-200">ستاپ {c.suggestedSetup.title}</span>
                        ) : null}
                        <span>
                          {resolvedType === 'trade' ? (
                            <>
                              بازه معاملات / چالش:{' '}
                              <span className="text-gray-300">{range.text}</span>
                            </>
                          ) : (
                            <>
                              چارت:{' '}
                              <span className="text-gray-300">{range.text}</span>
                              {' · '}مهلت:{' '}
                              <span className="text-gray-300">
                                {
                                  formatDualDateRange(
                                    c.challengeStartAt,
                                    c.challengeEndAt,
                                  ).text
                                }
                              </span>
                            </>
                          )}
                        </span>
                        {c.approvedCount != null && (
                          <span>{c.approvedCount} شرکت‌کننده</span>
                        )}
                        {c.creator?.publicName && (
                          <span>
                            سازنده:{' '}
                            <span className="text-gray-300">{c.creator.publicName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                      <Link
                        href={`/challenges/${c.inviteCode}`}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                      >
                        جزئیات
                      </Link>
                      {canRequestJoin && (
                        <button
                          type="button"
                          disabled={joiningId === c._id}
                          onClick={() => handleJoin(c)}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-sm font-bold disabled:opacity-50"
                        >
                          {!user
                            ? 'ورود و پیوستن'
                            : joiningId === c._id
                              ? '…'
                              : c.requireApproval
                                ? 'درخواست پیوستن'
                                : 'پیوستن'}
                        </button>
                      )}
                      {myStatus === 'pending' && (
                        <p className="text-[11px] text-amber-200 text-center">
                          در انتظار تایید
                        </p>
                      )}
                      {myStatus === 'approved' && (
                        <p className="text-[11px] text-emerald-300 text-center">عضو هستید</p>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

export default function BrowseChallengesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <Loading text="در حال بارگذاری چالش‌ها..." />
        </div>
      }
    >
      <BrowseChallengesInner />
    </Suspense>
  )
}
