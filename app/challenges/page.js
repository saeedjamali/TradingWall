'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import AppTopNav from '@/components/AppTopNav'
import { UserName } from '@/components/VerifiedBadge'
import { getSessionUser } from '@/utils/session'
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
  cancelled: {
    label: 'لغو شده',
    chip: 'bg-rose-500/15 text-rose-300 border-rose-400/25',
  },
}

function ChallengeCard({ c, badge }) {
  const phase = PHASE_META[c.phase] || PHASE_META.active
  const resolvedType = resolveChallengeType(c)
  const typeMeta = getChallengeTypeMeta(resolvedType)
  const activityRange = formatDualDateRange(c.backtestRangeStart, c.backtestRangeEnd)
  return (
    <Link
      href={`/challenges/${c.inviteCode}`}
      className="group block rounded-2xl border border-white/10 bg-gradient-to-bl from-white/[0.07] to-white/[0.02] hover:border-emerald-400/30 hover:from-emerald-500/10 hover:to-white/[0.04] p-4 md:p-5 transition-all duration-300"
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
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
            {badge && (
              <span className="text-[10px] font-semibold tracking-wide text-amber-300/90">
                {badge}
              </span>
            )}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                c.requireApproval
                  ? 'bg-amber-500/15 text-amber-200 border-amber-400/25'
                  : 'bg-white/10 text-gray-300 border-white/15'
              }`}
            >
              {c.requireApproval ? 'خصوصی' : 'عمومی'}
            </span>
          </div>
          <h3 className="font-bold text-white text-base md:text-lg leading-snug group-hover:text-emerald-100 transition-colors">
            {c.title}
          </h3>
        </div>
        <span
          className={`shrink-0 text-[10px] md:text-xs px-2.5 py-1 rounded-full border font-medium ${phase.chip}`}
        >
          {phase.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center rounded-lg bg-emerald-500/15 border border-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
          {c.symbol}
        </span>
        {c.timeframe ? (
          <span className="text-xs text-gray-400">{c.timeframe}</span>
        ) : null}
        <span className="text-xs text-gray-500">
          هر روز ≥ ۱ {resolvedType === 'trade' ? 'معامله' : 'بک‌تست'}
        </span>
      </div>

      <p className="text-[11px] md:text-xs text-gray-400 space-y-0.5">
        {resolvedType === 'trade' ? (
          <>
            بازه معاملات / چالش:{' '}
            <span className="text-gray-300">{activityRange.text}</span>
          </>
        ) : (
          <>
            بازه چارت: <span className="text-gray-300">{activityRange.text}</span>
            <br />
            بازه چالش:{' '}
            <span className="text-gray-300">
              {formatDualDateRange(c.challengeStartAt, c.challengeEndAt).text}
            </span>
          </>
        )}
      </p>

      <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        {c.approvedCount != null && (
          <span>{c.approvedCount} شرکت‌کننده</span>
        )}
        {c.creator?.publicName && (
          <span>
            سازنده:{' '}
            <span className="text-gray-300">{c.creator.publicName}</span>
          </span>
        )}
        <span className="mr-auto text-emerald-400/80 group-hover:text-emerald-300 text-[11px] font-medium">
          مشاهده چالش ←
        </span>
      </div>
    </Link>
  )
}

function SectionBlock({ title, subtitle, count, children, empty }) {
  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4" dir="rtl">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            {title}
            {typeof count === 'number' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-gray-300">
                {count}
              </span>
            )}
          </h2>
          {subtitle && (
            <p className="text-xs md:text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {empty ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
          <p className="text-sm text-gray-500">{empty}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4">{children}</div>
      )}
    </section>
  )
}

export default function ChallengesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [created, setCreated] = useState([])
  const [joined, setJoined] = useState([])
  const [openList, setOpenList] = useState([])

  useEffect(() => {
    const u = getSessionUser()
    if (!u) {
      router.push('/auth/login?next=/challenges')
      return
    }
    setUser(u)
  }, [router])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [mineRes, openRes] = await Promise.all([
          fetch(`/api/challenges?userId=${user.id}&scope=mine`),
          fetch(`/api/challenges?userId=${user.id}&scope=open`),
        ])
        const mine = await mineRes.json()
        const open = await openRes.json()
        if (!cancelled) {
          if (mine.success) {
            setCreated(mine.created || [])
            setJoined(mine.joined || [])
          }
          if (open.success) setOpenList(open.challenges || [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const joinedOnly = useMemo(
    () =>
      joined.filter((c) => String(c.creatorId) !== String(user?.id)),
    [joined, user?.id],
  )

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    router.push('/')
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loading text="در حال بارگذاری چالش‌ها..." />
      </div>
    )
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
            <span className="text-white/25 hidden sm:inline">|</span>
            <UserName
              name={user.publicName}
              verified={user.verified}
              className="hidden sm:inline text-white/75 text-sm max-w-[130px]"
              badgeClassName="w-4 h-4 text-blue-400"
            />
          </div>
          <AppTopNav
            isAdmin={user.role === 'admin'}
            onLogout={handleLogout}
          />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.18),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(245,158,11,0.08),_transparent_50%)]" />
        <div className="container mx-auto px-4 py-10 md:py-14 max-w-5xl relative" dir="rtl">
          <p className="text-emerald-400/90 text-xs md:text-sm font-semibold tracking-wide mb-2">
            تحلیل گروهی بک‌تست و معامله
          </p>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                چالش بک‌تست / چالش معامله
              </h1>
              <p className="mt-3 text-sm md:text-base text-gray-300 leading-relaxed">
                هدف چالش‌ها رتبه‌بندی نیست — شناسایی نقاط ضعف و قوت و تحلیل آن‌هاست.
                با هم‌نگاهی به داده‌های بک‌تست یا معاملات واقعی روی یک نماد، الگوهای
                عملکرد را ببینید و با لینک یا پیامک دیگران را به این تحلیل دعوت کنید.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Link
                href="/challenges/browse"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 font-semibold text-sm text-emerald-200 transition-colors"
              >
                همه چالش‌ها
              </Link>
              <Link
                href="/challenges/new"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm shadow-[0_8px_24px_-8px_rgba(16,185,129,0.55)] transition-colors"
              >
                ایجاد چالش جدید
              </Link>
              <Link
                href="/backtest"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold text-white/85 transition-colors"
              >
                ثبت بک‌تست
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 max-w-lg">
            <StatChip label="ساخته‌شده" value={created.length} />
            <StatChip label="شرکت‌کرده" value={joinedOnly.length} />
            <StatChip label="چالش باز" value={openList.length} accent />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-10 max-w-5xl">
        <SectionBlock
          title="چالش‌های من"
          subtitle="چالش‌هایی که خودتان ساخته‌اید و مدیریت می‌کنید"
          count={created.length}
          empty={created.length === 0 ? 'هنوز چالشی نساخته‌اید — اولین چالش را بسازید.' : null}
        >
          {created.map((c) => (
            <ChallengeCard key={c._id} c={c} badge="سازنده" />
          ))}
        </SectionBlock>

        <SectionBlock
          title="شرکت‌کرده‌ام"
          subtitle="چالش‌هایی که به آن‌ها پیوسته‌اید"
          count={joinedOnly.length}
          empty={
            joinedOnly.length === 0
              ? 'هنوز در چالشی شرکت نکرده‌اید — از بخش چالش‌های باز یکی را انتخاب کنید.'
              : null
          }
        >
          {joinedOnly.map((c) => (
            <ChallengeCard
              key={c._id}
              c={c}
              badge={
                c.participationStatus === 'pending'
                  ? 'در انتظار تایید'
                  : 'عضو'
              }
            />
          ))}
        </SectionBlock>

        <SectionBlock
          title="چالش‌های باز"
          subtitle="چالش‌های فعال که می‌توانید به آن‌ها بپیوندید"
          count={openList.length}
          empty={
            openList.length === 0
              ? 'در حال حاضر چالش بازی وجود ندارد.'
              : null
          }
        >
          {openList.map((c) => (
            <ChallengeCard key={c._id} c={c} />
          ))}
        </SectionBlock>
      </div>
    </main>
  )
}

function StatChip({ label, value, accent }) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 text-center ${
        accent
          ? 'border-emerald-400/25 bg-emerald-500/10'
          : 'border-white/10 bg-white/[0.04]'
      }`}
    >
      <div
        className={`text-xl md:text-2xl font-black tabular-nums ${
          accent ? 'text-emerald-300' : 'text-white'
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] md:text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}
