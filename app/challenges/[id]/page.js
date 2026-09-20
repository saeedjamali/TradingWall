'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import SymbolSelect from '@/components/SymbolSelect'
import SelectedSetupNote from '@/components/SelectedSetupNote'
import ChallengeDiscussionPanel from '@/components/ChallengeDiscussionPanel'
import ThemeToggle from '@/components/ThemeToggle'
import { UserName } from '@/components/VerifiedBadge'
import { getSessionUser } from '@/utils/session'
import { BACKTEST_TIMEFRAMES } from '@/utils/backtest'
import {
  challengeAcceptsJoins,
  formatDualDateRange,
  formatTopSetupLabel,
  getChallengeTypeMeta,
  pickTopSetup,
  resolveChallengeType,
} from '@/utils/challenge'

const PHASE_FA = {
  upcoming: 'به‌زودی',
  active: 'در حال برگزاری',
  ended: 'پایان‌یافته',
  cancelled: 'لغو شده',
}

function toInputDate(d) {
  if (!d) return ''
  const x = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(x.getTime())) return ''
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function MetricCell({ value, good }) {
  if (value == null || value === '') {
    return <td className="px-2 py-2 text-center text-gray-400 text-xs">—</td>
  }
  const cls =
    good === true
      ? 'text-emerald-700'
      : good === false
        ? 'text-rose-700'
        : 'text-gray-800'
  return (
    <td className={`px-2 py-2 text-center text-xs font-semibold tabular-nums ${cls}`}>
      {value}
    </td>
  )
}

export default function ChallengeDetailPage() {
  const params = useParams()
  const code = params?.id
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [standardSetups, setStandardSetups] = useState([])
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editBusy, setEditBusy] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    setUser(getSessionUser())
  }, [])

  const load = useCallback(async () => {
    if (!code) return
    setLoading(true)
    setError('')
    try {
      const session = getSessionUser()
      const qs = new URLSearchParams()
      if (session?.id) qs.set('viewerId', session.id)
      const res = await fetch(`/api/challenges/${code}?${qs}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در دریافت چالش')
      }
      setData(json)
      const ch = json.challenge
      setEditForm({
        title: ch.title || '',
        description: ch.description || '',
        symbol: ch.symbol || '',
        timeframe: ch.timeframe || '',
        backtestRangeStart: toInputDate(ch.backtestRangeStart),
        backtestRangeEnd: toInputDate(ch.backtestRangeEnd),
        challengeStartAt: toInputDate(ch.challengeStartAt),
        challengeEndAt: toInputDate(ch.challengeEndAt),
        maxParticipants:
          ch.maxParticipants == null ? '' : String(ch.maxParticipants),
        unlimited: ch.maxParticipants == null,
        requireApproval: !!ch.requireApproval,
        suggestedSetupId: String(
          ch.suggestedSetup?._id || ch.suggestedSetupId || '',
        ),
        rules: ch.rules || '',
      })
    } catch (err) {
      setError(err.message || 'خطا')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/setups?standard=1')
        const json = await res.json()
        if (json.success) setStandardSetups(json.setups || [])
      } catch {
        // ignore
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const response = await fetch('/api/blog?category=challenges&limit=3')
        const json = await response.json()
        if (response.ok && json.success) {
          setRelatedPosts(json.posts || [])
        }
      } catch {
        // Related educational links are optional.
      }
    })()
  }, [])

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined' || !data?.challenge?.inviteCode) return ''
    return `${window.location.origin}/challenges/${data.challenge.inviteCode}`
  }, [data?.challenge?.inviteCode])

  const handleJoin = async () => {
    if (!user?.id) {
      router.push(`/auth/login?next=/challenges/${code}`)
      return
    }
    setJoining(true)
    try {
      const res = await fetch(`/api/challenges/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا در عضویت')
      alert(json.message || 'عضویت انجام شد')
      await load()
    } catch (err) {
      alert(err.message || 'خطا')
    } finally {
      setJoining(false)
    }
  }

  const handleModerate = async (participantId, action) => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/challenges/${code}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, participantId, action }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا')
      await load()
    } catch (err) {
      alert(err.message || 'خطا')
    }
  }

  const handleInviteSms = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    setInviteBusy(true)
    try {
      const res = await fetch(`/api/challenges/${code}/invite-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, phone: invitePhone }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'ارسال ناموفق')
      alert('پیامک دعوت ارسال شد')
      setInvitePhone('')
    } catch (err) {
      alert(err.message || 'خطا در ارسال پیامک')
    } finally {
      setInviteBusy(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(inviteUrl)
    }
  }

  const endChallenge = async () => {
    if (!user?.id || !confirm('چالش پایان یابد؟')) return
    const res = await fetch(`/api/challenges/${code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, status: 'ended' }),
    })
    const json = await res.json()
    if (!json.success) alert(json.error || 'خطا')
    else await load()
  }

  const deleteChallenge = async () => {
    if (!user?.id) return
    if (
      !confirm(
        'چالش برای همیشه حذف شود؟ این کار فقط وقتی ممکن است که هنوز کسی جز شما عضو نشده باشد.',
      )
    ) {
      return
    }
    try {
      const res = await fetch(`/api/challenges/${code}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'حذف ناموفق')
      router.push('/challenges')
    } catch (err) {
      alert(err.message || 'خطا در حذف')
    }
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!user?.id || !editForm) return
    const tradeChallenge = resolveChallengeType(data?.challenge) === 'trade'
    const todayMin = toInputDate(new Date())
    const windowStart = tradeChallenge
      ? editForm.backtestRangeStart
      : editForm.challengeStartAt
    const windowEnd = tradeChallenge
      ? editForm.backtestRangeEnd
      : editForm.challengeEndAt
    if (windowStart < todayMin || windowEnd < todayMin) {
      alert('تاریخ شروع و پایان چالش نمی‌تواند قبل از امروز باشد')
      return
    }
    setEditBusy(true)
    try {
      const res = await fetch(`/api/challenges/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: editForm.title,
          description: editForm.description,
          symbol: editForm.symbol,
          timeframe: editForm.timeframe,
          backtestRangeStart: editForm.backtestRangeStart,
          backtestRangeEnd: editForm.backtestRangeEnd,
          challengeStartAt: tradeChallenge
            ? editForm.backtestRangeStart
            : editForm.challengeStartAt,
          challengeEndAt: tradeChallenge
            ? editForm.backtestRangeEnd
            : editForm.challengeEndAt,
          maxParticipants: editForm.unlimited
            ? null
            : Number(editForm.maxParticipants) || 20,
          requireApproval: editForm.requireApproval,
          suggestedSetupId: tradeChallenge
            ? null
            : editForm.suggestedSetupId || null,
          rules: editForm.rules,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'ذخیره ناموفق')
      setEditing(false)
      await load()
    } catch (err) {
      alert(err.message || 'خطا در ذخیره')
    } finally {
      setEditBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="در حال بارگذاری چالش..." />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center">
          <p className="text-rose-600 mb-4">{error || 'چالش یافت نشد'}</p>
          <Link href="/challenges" className="text-primary-600 hover:underline">
            بازگشت
          </Link>
        </div>
      </div>
    )
  }

  const c = data.challenge
  const viewer = data.viewer
  const standings = data.standings || []
  const sortedStandings = [...standings].sort(
    (a, b) => (b.unitNet || 0) - (a.unitNet || 0),
  )
  const typeMeta = getChallengeTypeMeta(resolveChallengeType(c))
  const isTrade = resolveChallengeType(c) === 'trade'
  const hasSuggestedSetup = !!(c.suggestedSetup?._id || c.suggestedSetupId)
  const canEditOrDelete = !!(data.canEditOrDelete || viewer?.canEditOrDelete)
  const activityRange = formatDualDateRange(c.backtestRangeStart, c.backtestRangeEnd)
  const windowRange = formatDualDateRange(c.challengeStartAt, c.challengeEndAt)
  const acceptsJoins =
    c.acceptsJoins != null ? c.acceptsJoins : challengeAcceptsJoins(c)
  const canJoin =
    acceptsJoins &&
    (!viewer || (!viewer.isParticipant && viewer.participationStatus !== 'pending'))

  return (
    <main className="min-h-screen bg-gray-50 scroll-smooth">
      <div className="theme-surface text-white">
        <div className="container mx-auto px-4 py-4 md:py-5 max-w-6xl" dir="rtl">
          <div className="flex items-center justify-between gap-3">
            <Link href="/challenges/browse" className="text-xs sm:text-sm text-primary-300 hover:underline">
              ← همه چالش‌ها
            </Link>
            <div className="flex items-center gap-1.5">
              <nav
                aria-label="میانبر بخش‌های چالش"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/10 p-0.5"
              >
                <JumpLink href="#challenge-manage" label="مدیریت چالش" icon={<ManageIcon />} />
                <JumpLink href="#challenge-guides" label="راهنمای چالش‌ها" icon={<GuideIcon />} />
                <JumpLink href="#challenge-discussion" label="گفتگوی شرکت‌کنندگان" icon={<ChatIcon />} />
                <JumpLink href="#challenge-analysis" label="جدول تحلیل" icon={<TableIcon />} />
              </nav>
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    isTrade
                      ? 'bg-amber-500/15 text-amber-300 border-amber-400/25'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25'
                  }`}
                >
                  {typeMeta.label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                  {PHASE_FA[c.phase] || c.status}
                </span>
                {(data.resultsFrozen || c.resultsFrozen || c.phase === 'ended') && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/20">
                    نتایج قفل‌شده
                  </span>
                )}
                {c.requireApproval ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/20">
                    خصوصی — با تایید سازنده
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                    عمومی — بدون تایید
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-xl md:text-2xl font-bold leading-snug">{c.title}</h1>

              {c.description ? (
                <p className="mt-1.5 text-xs sm:text-sm text-gray-400 max-w-2xl line-clamp-2">
                  {c.description}
                </p>
              ) : null}

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <MetaChip>
                  <span className="text-gray-500">نماد</span>
                  <span className="text-emerald-300 font-bold" dir="ltr">
                    {c.symbol}
                    {c.timeframe ? ` · ${c.timeframe}` : ''}
                  </span>
                </MetaChip>
                <MetaChip>
                  <span className="text-gray-500">هدف روزانه</span>
                  <span className="text-white font-semibold">
                    هر روز ≥ ۱ {isTrade ? 'معامله' : 'بک‌تست'}
                    {c.activityDayCount
                      ? ` · ${c.activityDayCount} روز`
                      : ''}
                  </span>
                </MetaChip>
                <MetaChip>
                  <span className="text-gray-500">ظرفیت</span>
                  <span className="text-white font-semibold">
                    {c.maxParticipants == null
                      ? 'نامحدود'
                      : `${c.approvedCount || 0}/${c.maxParticipants}`}
                  </span>
                </MetaChip>
                {c.creator && (
                  <MetaChip>
                    <span className="text-gray-500">سازنده</span>
                    <UserName
                      name={c.creator.publicName}
                      verified={c.creator.verified}
                      className="text-white text-xs"
                      badgeClassName="w-3.5 h-3.5 text-blue-400"
                    />
                  </MetaChip>
                )}
                {!isTrade && (c.suggestedSetup?.title || c.suggestedSetupId) && (
                  <MetaChip>
                    <span className="text-gray-500">ستاپ پیشنهادی</span>
                    <span className="text-amber-200 font-semibold">
                      {c.suggestedSetup?.title || 'ستاپ انتخاب‌شده'}
                    </span>
                  </MetaChip>
                )}
              </div>
              {!isTrade && c.suggestedSetup?.description && (
                <p className="mt-2 max-w-2xl rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap line-clamp-2">
                  {c.suggestedSetup.description}
                </p>
              )}

              <div className="mt-2.5 grid grid-cols-2 gap-1.5 max-w-2xl">
                <RangeCard
                  label={isTrade ? 'بازه معاملات / چالش' : 'بازه چارت'}
                  range={activityRange}
                />
                {!isTrade && (
                  <RangeCard label="مهلت انجام" range={windowRange} />
                )}
              </div>

              {viewer?.isParticipant && (() => {
                const mine = standings.find(
                  (s) => String(s.userId) === String(viewer.id || user?.id),
                )
                if (!mine) return null
                const pct = mine.progressPct ?? 0
                return (
                  <div className="mt-2.5 max-w-2xl rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
                      <span className="text-gray-400">پیشرفت شما</span>
                      <span className="font-bold text-emerald-300 tabular-nums">
                        {pct}%
                        <span className="text-gray-500 font-normal mr-1">
                          ({mine.coveredDays ?? 0}/{mine.totalDays ?? c.activityDayCount ?? '—'} روز)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 100 ? 'bg-emerald-400' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
              {canJoin && (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 font-semibold text-sm disabled:opacity-50"
                >
                  {!user
                    ? 'ورود و پیوستن به چالش'
                    : joining
                      ? '…'
                      : c.requireApproval
                        ? 'درخواست عضویت'
                        : 'پیوستن به چالش'}
                </button>
              )}
              {!viewer?.isParticipant &&
                viewer?.participationStatus !== 'pending' &&
                !acceptsJoins &&
                (c.phase === 'ended' || c.status === 'ended') && (
                  <p className="text-xs text-gray-400 text-center sm:text-right">
                    مهلت پیوستن به این چالش تمام شده است
                  </p>
                )}
              {viewer?.participationStatus === 'pending' && (
                <p className="text-xs text-amber-200 text-center">در انتظار تایید سازنده</p>
              )}
              {viewer?.isParticipant && (
                <Link
                  href={
                    isTrade
                      ? '/dashboard'
                      : `/backtest?symbol=${encodeURIComponent(c.symbol)}${
                          c.suggestedSetup?._id || c.suggestedSetupId
                            ? `&setupId=${encodeURIComponent(
                                String(c.suggestedSetup?._id || c.suggestedSetupId),
                              )}`
                            : ''
                        }`
                  }
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-center text-sm font-semibold hover:bg-white/15"
                >
                  {isTrade ? 'تقویم معاملاتی' : 'تقویم بک‌تست'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6" dir="rtl">
        <section className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-sm text-sky-900/90 leading-relaxed space-y-2">
          <h2 className="font-bold text-sky-950">راهنمای بازه</h2>
          {isTrade ? (
            <p>
              <strong>بازه چالش = بازه معاملات:</strong> فقط معاملات واقعی بسته‌شده در این بازه
              (و روی نماد چالش) شمرده می‌شوند. هر معامله باید در روز خودش انجام شود؛ نمی‌توان
              معاملات یک ماه را در یک هفته جلو جلو بست. با پایان تاریخ یا اعلام پایان توسط
              سازنده، نتایج ثابت می‌شوند.
            </p>
          ) : (
            <p>
              <strong>بازه چارت</strong> روزهای تاریخی است که باید برای هر کدام حداقل یک بک‌تست
              ثبت شود. <strong>بازه چالش</strong> مهلت انجام است و می‌تواند کوتاه‌تر باشد —
              مثلاً یک ماه چارت را در یک هفته بک‌تست کنید. با پایان بازه چالش یا اعلام پایان
              توسط سازنده، نتایج ثابت می‌شوند.
            </p>
          )}
        </section>

        {c.rules && (
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-2">قوانین</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.rules}</p>
          </section>
        )}

        {viewer?.isCreator ? (
          <section
            id="challenge-manage"
            className="scroll-mt-24 bg-white rounded-xl border border-amber-100 p-5 space-y-4"
          >
            <h2 className="font-bold text-gray-900">مدیریت چالش (سازنده)</h2>

            <div className="flex flex-wrap gap-2 items-center">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                {copied ? 'کپی شد' : 'کپی لینک دعوت'}
              </button>
              {canEditOrDelete && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing((v) => !v)}
                    className="px-3 py-2 rounded-lg border border-sky-200 text-sky-800 text-xs font-semibold bg-sky-50"
                  >
                    {editing ? 'بستن ویرایش' : 'ویرایش چالش'}
                  </button>
                  <button
                    type="button"
                    onClick={deleteChallenge}
                    className="px-3 py-2 rounded-lg border border-rose-300 text-rose-800 text-xs font-semibold bg-rose-50"
                  >
                    حذف چالش
                  </button>
                </>
              )}
              {c.phase !== 'ended' && (
                <button
                  type="button"
                  onClick={endChallenge}
                  className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold"
                >
                  پایان چالش
                </button>
              )}
            </div>

            {canEditOrDelete && (
              <p className="text-[11px] text-gray-500">
                ویرایش و حذف فقط تا قبل از عضویت نفر بعدی ممکن است.
              </p>
            )}

            {editing && canEditOrDelete && editForm && (
              <form
                onSubmit={saveEdit}
                className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-3"
              >
                <h3 className="text-sm font-bold text-gray-900">ویرایش چالش</h3>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">عنوان</label>
                  <input
                    required
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">توضیح</label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">نماد</label>
                    <SymbolSelect
                      value={editForm.symbol}
                      onChange={(symbol) =>
                        setEditForm({ ...editForm, symbol })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">
                      تایم‌فریم پیشنهادی
                    </label>
                    <select
                      value={editForm.timeframe}
                      onChange={(e) =>
                        setEditForm({ ...editForm, timeframe: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">اختیاری</option>
                      {BACKTEST_TIMEFRAMES.map((tf) => (
                        <option key={tf} value={tf}>
                          {tf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {!isTrade && (
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">
                      ستاپ پیشنهادی (اختیاری)
                    </label>
                    <select
                      value={editForm.suggestedSetupId || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          suggestedSetupId: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">بدون ستاپ مشخص</option>
                      {standardSetups.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      فقط بک‌تست‌های همین ستاپ استاندارد در چالش شمرده می‌شوند. ستاپ مدنظرتان
                      در لیست نیست؟ از بخش{' '}
                      <Link
                        href="/?category=add_setup#support"
                        className="text-sky-700 hover:text-sky-800 underline underline-offset-2"
                      >
                        نظر یا پیشنهاد
                      </Link>{' '}
                      در صفحه اصلی پیشنهاد بدهید.
                    </p>
                    <SelectedSetupNote
                      setups={standardSetups}
                      selectedIds={editForm.suggestedSetupId}
                    />
                  </div>
                )}
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900 leading-relaxed">
                  <strong>{typeMeta.minLabel}:</strong> {typeMeta.progressHint}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-700 mb-1">
                    {isTrade ? 'بازه معاملات / بازه چالش' : 'بازه چارت'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">از</label>
                      <input
                        type="date"
                        required
                        min={isTrade ? toInputDate(new Date()) : undefined}
                        value={editForm.backtestRangeStart}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            backtestRangeStart: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">تا</label>
                      <input
                        type="date"
                        required
                        min={isTrade ? toInputDate(new Date()) : undefined}
                        value={editForm.backtestRangeEnd}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            backtestRangeEnd: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
                {!isTrade && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-700 mb-1">
                      بازه چالش (مهلت انجام بک‌تست)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1">
                          شروع چالش
                        </label>
                        <input
                          type="date"
                          required
                          min={toInputDate(new Date())}
                          value={editForm.challengeStartAt}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              challengeStartAt: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1">
                          پایان چالش
                        </label>
                        <input
                          type="date"
                          required
                          min={toInputDate(new Date())}
                          value={editForm.challengeEndAt}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              challengeEndAt: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.unlimited}
                    onChange={(e) =>
                      setEditForm({ ...editForm, unlimited: e.target.checked })
                    }
                  />
                  بدون سقف شرکت‌کننده
                </label>
                {!editForm.unlimited && (
                  <input
                    type="number"
                    min="2"
                    value={editForm.maxParticipants}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        maxParticipants: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="حداکثر افراد"
                  />
                )}
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">دسترسی</label>
                  <select
                    value={editForm.requireApproval ? 'private' : 'public'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        requireApproval: e.target.value === 'private',
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="public">عمومی — پیوستن بدون تایید</option>
                    <option value="private">خصوصی — پیوستن با تایید سازنده</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">قوانین</label>
                  <textarea
                    rows={2}
                    value={editForm.rules}
                    onChange={(e) =>
                      setEditForm({ ...editForm, rules: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={editBusy}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold disabled:opacity-50"
                >
                  {editBusy ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
                </button>
              </form>
            )}

            <form onSubmit={handleInviteSms} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[11px] text-gray-500 mb-1">
                  دعوت با پیامک (شماره همراه)
                </label>
                <input
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={inviteBusy || !invitePhone}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                {inviteBusy ? '…' : 'ارسال پیامک دعوت'}
              </button>
            </form>

            {data.participants?.some((p) => p.status === 'pending') && (
              <div>
                <h3 className="text-sm font-bold mb-2">درخواست‌های عضویت</h3>
                <ul className="space-y-2">
                  {data.participants
                    .filter((p) => p.status === 'pending')
                    .map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
                      >
                        <span>{p.user?.publicName || 'کاربر'}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleModerate(p.id, 'approve')}
                            className="px-2 py-1 rounded bg-emerald-600 text-white text-xs"
                          >
                            تایید
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModerate(p.id, 'reject')}
                            className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-xs"
                          >
                            رد
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </section>
        ) : (
          <section
            id="challenge-manage"
            className="scroll-mt-24 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900/80"
          >
            <p className="font-semibold">مدیریت چالش</p>
            <p className="mt-0.5 text-xs text-amber-800/80">
              دعوت، ویرایش و پایان چالش فقط برای سازنده نمایش داده می‌شود.
            </p>
          </section>
        )}

        <section id="challenge-discussion" className="scroll-mt-24">
          {(viewer?.isParticipant || viewer?.isAdmin) && user ? (
            <ChallengeDiscussionPanel challengeCode={code} user={user} />
          ) : (
            <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-sky-900/80">
              <p className="font-semibold">گفتگوی شرکت‌کنندگان</p>
              <p className="mt-0.5 text-xs text-sky-800/80">
                پس از پیوستن به چالش می‌توانید پرسش بگذارید و به بقیه پاسخ دهید.
              </p>
            </div>
          )}
        </section>

        <section
          id="challenge-analysis"
          className="scroll-mt-24 bg-white rounded-xl border border-gray-100 p-4 md:p-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
            <div>
              <h2 className="font-bold text-lg text-gray-900">جدول تحلیل نقاط ضعف و قوت</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                برای یادگیری و تحلیل — نه رتبه‌بندی. سطرها = شرکت‌کنندگان (مرتب با برایند
                TP−SL) · ستون‌ها = شاخص‌ها (
                {isTrade
                  ? `معاملات واقعی ${c.symbol} در بازه معاملات`
                  : hasSuggestedSetup
                    ? `بک‌تست‌های ${c.symbol} با ستاپ ${c.suggestedSetup?.title || ''} در بازه چارت`
                    : `بک‌تست‌های ${c.symbol} در بازه چارت`}
                )
              </p>
              {(data.resultsFrozen || c.resultsFrozen || c.phase === 'ended') && (
                <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 inline-block">
                  نتایج این چالش قفل شده‌اند و با ثبت دادهٔ جدید تغییر نمی‌کنند
                  {c.resultsFrozenAt || data.resultsFrozenAt
                    ? ` · از ${new Date(c.resultsFrozenAt || data.resultsFrozenAt).toLocaleDateString('fa-IR')}`
                    : ''}
                </p>
              )}
            </div>
            {!user && acceptsJoins && (
              <Link
                href={`/auth/login?next=/challenges/${code}`}
                className="text-sm text-primary-600 font-semibold"
              >
                برای شرکت وارد شوید
              </Link>
            )}
          </div>

          {!data.canViewResults ? (
            <p className="text-sm text-gray-500 text-center py-10">
              نتایج این چالش خصوصی است — فقط شرکت‌کنندگان تاییدشده می‌توانند جدول را ببینند.
              {!viewer?.isParticipant && canJoin && (
                <span className="block mt-2">برای دیدن نتایج، به چالش بپیوندید.</span>
              )}
            </p>
          ) : sortedStandings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">
              هنوز داده‌ای برای تحلیل ثبت نشده است
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky right-0 z-10 bg-gray-50 px-3 py-2 text-right text-xs font-bold text-gray-600 border-b min-w-[120px]">
                      کاربر
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                      پیشرفت
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                      {typeMeta.entriesLabel}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b">
                      {isTrade ? 'برد' : 'TP'}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b">
                      {isTrade ? 'باخت' : 'SL'}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                      {isTrade ? 'برایند برد−باخت' : 'برایند TP−SL'}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                      Hit Rate
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                      Profit Factor
                    </th>
                    {!isTrade && (
                      <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b">
                        Expectancy
                      </th>
                    )}
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                      {isTrade ? 'سود/زیان $' : 'برایند $'}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b">
                      Buy
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                      {isTrade ? 'Buy برد/باخت' : 'Buy TP/SL'}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b">
                      Sell
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                      {isTrade ? 'Sell برد/باخت' : 'Sell TP/SL'}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                      روز فعال
                    </th>
                    {!hasSuggestedSetup && (
                      <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                        ستاپ برتر
                      </th>
                    )}
                    {!isTrade && (
                      <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 border-b whitespace-nowrap">
                        سشن برتر
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedStandings.map((s) => {
                    const kind = isTrade ? 'trade' : 'backtest'
                    return (
                      <tr
                        key={s.userId}
                        className="border-b border-gray-100 hover:bg-gray-50/80"
                      >
                        <th className="sticky right-0 z-10 bg-white px-3 py-2 text-right text-xs font-medium text-gray-800 border-l whitespace-nowrap">
                          <Link
                            href={`/wall/${s.userId}`}
                            className="font-bold text-primary-700 hover:underline"
                          >
                            <UserName
                              name={s.publicName}
                              verified={s.verified}
                              badgeClassName="w-3.5 h-3.5 text-blue-500"
                            />
                          </Link>
                        </th>
                        <MetricCell
                          value={
                            s.progressPct != null
                              ? `${s.progressPct}% (${s.coveredDays ?? 0}/${s.totalDays ?? '—'})`
                              : '—'
                          }
                          good={(s.progressPct || 0) >= 100}
                        />
                        <MetricCell value={s.count} />
                        <MetricCell value={isTrade ? s.wins : s.tp} good />
                        <MetricCell value={isTrade ? s.losses : s.sl} good={false} />
                        <MetricCell
                          value={`${s.unitNet >= 0 ? '+' : ''}${s.unitNet}`}
                          good={s.unitNet > 0}
                        />
                        <MetricCell
                          value={
                            s.hitRate != null ? `${s.hitRate.toFixed(1)}%` : '—'
                          }
                        />
                        <MetricCell
                          value={
                            s.profitFactor == null
                              ? '—'
                              : s.profitFactor === Infinity
                                ? '∞'
                                : s.profitFactor.toFixed(2)
                          }
                        />
                        {!isTrade && (
                          <MetricCell
                            value={
                              s.expectancy != null
                                ? `${s.expectancy >= 0 ? '+' : ''}${s.expectancy.toFixed(2)} R`
                                : '—'
                            }
                          />
                        )}
                        <MetricCell
                          value={
                            s.withRisk
                              ? `${s.pnl >= 0 ? '+' : ''}${Number(s.pnl).toFixed(0)}`
                              : '—'
                          }
                          good={s.withRisk && s.pnl > 0}
                        />
                        <MetricCell value={s.buyCount} />
                        <MetricCell value={`${s.buyTp} / ${s.buySl}`} />
                        <MetricCell value={s.sellCount} />
                        <MetricCell value={`${s.sellTp} / ${s.sellSl}`} />
                        <MetricCell value={s.activeDays} />
                        {!hasSuggestedSetup && (
                          <MetricCell
                            value={formatTopSetupLabel(
                              s.topSetup || pickTopSetup(s.setupRows, kind),
                              kind,
                            )}
                          />
                        )}
                        {!isTrade && (
                          <MetricCell value={s.sessionRows?.[0]?.label || '—'} />
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          id="challenge-guides"
          className="scroll-mt-24 rounded-xl border border-gray-100 bg-white p-4"
        >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  راهنمای چالش‌ها
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  آموزش‌های کوتاه برای ساخت و اجرای بهتر چالش
                </p>
              </div>
              <Link
                href="/blog?category=challenges"
                className="shrink-0 text-[11px] font-semibold text-primary-700 hover:underline"
              >
                همه مطالب
              </Link>
            </div>
            {relatedPosts.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {relatedPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="group flex min-w-0 items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50/70 p-2 hover:border-sky-200 hover:bg-sky-50/50"
                  >
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.coverImageAlt || post.title}
                        className="h-14 w-16 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-14 w-16 shrink-0 rounded-md bg-slate-200" />
                    )}
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-xs font-bold leading-5 text-gray-800 group-hover:text-sky-800">
                        {post.title}
                      </h3>
                      <span className="mt-0.5 block text-[10px] text-gray-400">
                        مطالعه مقاله ←
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                مطلب آموزشی مرتبط هنوز منتشر نشده است.{' '}
                <Link href="/blog?category=challenges" className="font-semibold text-primary-700 hover:underline">
                  رفتن به دسته چالش‌ها
                </Link>
              </p>
            )}
        </section>
      </div>
    </main>
  )
}

function JumpLink({ href, label, icon }) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sky-300 transition-colors hover:bg-white/15 hover:text-white"
    >
      {icon}
    </a>
  )
}

function ManageIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function GuideIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  )
}

function TableIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M3 14h18m-9-8v12M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
      />
    </svg>
  )
}

function MetaChip({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px]">
      {children}
    </span>
  )
}

function RangeCard({ label, range }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5">
      <div className="text-[10px] font-semibold text-gray-500">{label}</div>
      <div className="text-xs sm:text-sm font-semibold text-white tabular-nums leading-snug">
        {range.fa}
      </div>
      <div className="text-[10px] text-gray-500 tabular-nums" dir="ltr">
        {range.en}
      </div>
    </div>
  )
}
