'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import { UserName } from '@/components/VerifiedBadge'
import { formatDateTime } from '@/utils/dateHelpers'
import { ACTION_LABELS } from '@/utils/siteLogLabels'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'

const RANGE_OPTIONS = [
  { id: 'today', label: 'امروز' },
  { id: '24h', label: '۲۴ ساعت' },
  { id: '7d', label: '۷ روز' },
  { id: '30d', label: '۳۰ روز' },
  { id: 'month', label: 'این ماه' },
  { id: 'year', label: 'امسال' },
  { id: 'custom', label: 'بازه دلخواه' },
]

function Stat({ label, value, hint }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="text-sm text-gray-600 mt-0.5">{label}</div>
      {hint ? <div className="text-[11px] text-gray-400 mt-1">{hint}</div> : null}
    </div>
  )
}

function pageItems(current, total) {
  if (total <= 1) return [1]
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const items = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) items.push('…')
  for (let i = start; i <= end; i += 1) items.push(i)
  if (end < total - 1) items.push('…')
  items.push(total)
  return items
}

function LogsPager({ page, pages, total, limit, onPage, onLimit }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  return (
    <div className="px-4 py-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-gray-600">
        <span>
          {from}–{to} از {total}
        </span>
        <select
          value={limit}
          onChange={(e) => onLimit(Number(e.target.value))}
          className="border rounded-lg px-2 py-1 text-sm bg-white"
        >
          <option value={20}>۲۰ در صفحه</option>
          <option value={40}>۴۰ در صفحه</option>
          <option value={80}>۸۰ در صفحه</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(1)}
          className="px-2 py-1 rounded border disabled:opacity-40"
        >
          اول
        </button>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="px-2 py-1 rounded border disabled:opacity-40"
        >
          قبلی
        </button>
        {pageItems(page, Math.max(1, pages)).map((item, idx) =>
          item === '…' ? (
            <span key={`e-${idx}`} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              className={`min-w-[2rem] px-2 py-1 rounded border ${
                item === page
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="px-2 py-1 rounded border disabled:opacity-40"
        >
          بعدی
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(pages)}
          className="px-2 py-1 rounded border disabled:opacity-40"
        >
          آخر
        </button>
      </div>
    </div>
  )
}

export default function AdminLogsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [range, setRange] = useState('7d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [kind, setKind] = useState('')
  const [action, setAction] = useState('')
  const [q, setQ] = useState('')
  const [qApplied, setQApplied] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(40)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const tokenExpiry = localStorage.getItem('tokenExpiry')
    if (!userData || !tokenExpiry || Date.now() >= parseInt(tokenExpiry, 10)) {
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
  }, [router])

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        adminUserId: user.id,
        range,
        page: String(page),
        limit: String(limit),
      })
      if (kind) params.set('kind', kind)
      if (action) params.set('action', action)
      if (qApplied.trim()) params.set('q', qApplied.trim())
      if (range === 'custom') {
        if (from) params.set('from', from)
        if (to) params.set('to', to)
      }
      const res = await fetch(`/api/admin/logs?${params}`)
      const json = await res.json()
      if (json.success) setData(json)
      else alert(json.error || 'خطا در دریافت لاگ')
    } catch (err) {
      console.error(err)
      alert('خطا در دریافت لاگ')
    } finally {
      setLoading(false)
    }
  }, [user?.id, range, from, to, kind, action, qApplied, page, limit])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  if (!user) return <Loading text="در حال بارگذاری..." />

  const stats = data?.stats || {}
  const series = data?.series || []
  const byPath = data?.byPath || []
  const byAction = data?.byAction || []
  const byUser = data?.byUser || []
  const logs = data?.logs || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0, limit }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8 max-w-7xl" dir="rtl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">لاگ و بازدید</h2>
          <p className="text-sm text-gray-600 mt-1">
            بازدید صفحات و اکشن‌های کاربران (ورود، معامله، بک‌تست، چالش و …) با فیلتر زمانی.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setRange(opt.id)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  range === opt.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {range === 'custom' && (
            <div className="flex flex-wrap gap-3 items-end">
              <label className="text-sm text-gray-600">
                از
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value)
                    setPage(1)
                  }}
                  className="block mt-1 border rounded-lg px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-gray-600">
                تا
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value)
                    setPage(1)
                  }}
                  className="block mt-1 border rounded-lg px-3 py-1.5 text-sm"
                />
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value)
                setPage(1)
              }}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">همه انواع</option>
              <option value="page_view">بازدید صفحه</option>
              <option value="action">اکشن</option>
            </select>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setPage(1)
              }}
              className="border rounded-lg px-3 py-2 text-sm bg-white min-w-[180px]"
            >
              <option value="">همه اکشن‌ها</option>
              {Object.entries(ACTION_LABELS)
                .filter(([k]) => k !== 'page_view')
                .map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
            </select>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setQApplied(q)
                  setPage(1)
                }
              }}
              placeholder="جستجوی مسیر صفحه…"
              className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
            />
            <button
              type="button"
              onClick={() => {
                setQApplied(q)
                setPage(1)
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm"
            >
              اعمال
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Stat label="کل رویداد" value={stats.total ?? '—'} />
          <Stat label="بازدید صفحه" value={stats.pageViews ?? '—'} />
          <Stat label="اکشن‌ها" value={stats.actions ?? '—'} />
          <Stat
            label="کاربران لاگین"
            value={stats.uniqueUsers ?? '—'}
            hint="یکتا در این بازه"
          />
          <Stat
            label="بازدیدکننده"
            value={stats.uniqueVisitors ?? '—'}
            hint="دستگاه / مرورگر"
          />
        </div>

        {loading && !data ? (
          <Loading text="در حال بارگذاری لاگ..." />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">روند زمانی</h3>
                <div className="h-64" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="t" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="pageViews"
                        name="بازدید"
                        stroke="#0ea5e9"
                        fill="#bae6fd"
                      />
                      <Area
                        type="monotone"
                        dataKey="actions"
                        name="اکشن"
                        stroke="#10b981"
                        fill="#a7f3d0"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">اکشن‌های پرتکرار</h3>
                <div className="h-64" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byAction} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={110}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip />
                      <Bar dataKey="count" name="تعداد" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-3">کاربران با بیشترین فعالیت</h3>
              {byUser.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">
                  در این بازه کاربر لاگین‌شده‌ای ثبت نشده است.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-right px-3 py-2 font-medium">رتبه</th>
                        <th className="text-right px-3 py-2 font-medium">کاربر</th>
                        <th className="text-right px-3 py-2 font-medium">کل رویداد</th>
                        <th className="text-right px-3 py-2 font-medium">بازدید</th>
                        <th className="text-right px-3 py-2 font-medium">اکشن</th>
                        <th className="text-right px-3 py-2 font-medium">آخرین فعالیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {byUser.map((u, idx) => (
                        <tr key={String(u.id)} className="hover:bg-gray-50">
                          <td className="px-3 py-2 tabular-nums text-gray-500">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </td>
                          <td className="px-3 py-2">
                            <UserName
                              name={u.publicName}
                              verified={u.verified}
                              className="text-sm"
                              badgeClassName="w-3.5 h-3.5"
                            />
                            <div className="text-[11px] text-gray-400" dir="ltr">
                              {u.phone}
                              {u.role === 'admin' ? ' · admin' : ''}
                            </div>
                          </td>
                          <td className="px-3 py-2 font-semibold tabular-nums">{u.total}</td>
                          <td className="px-3 py-2 tabular-nums text-sky-700">{u.pageViews}</td>
                          <td className="px-3 py-2 tabular-nums text-emerald-700">{u.actions}</td>
                          <td className="px-3 py-2 text-xs text-gray-500 whitespace-pre-line">
                            {u.lastAt ? formatDateTime(u.lastAt) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-3">پربازدیدترین صفحات</h3>
              <div className="h-56" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byPath} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="path"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="بازدید" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-800">جدول رویدادها</h3>
                <span className="text-xs text-gray-500">
                  {pagination.total} مورد
                </span>
              </div>
              <LogsPager
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={limit}
                onPage={setPage}
                onLimit={(n) => {
                  setLimit(n)
                  setPage(1)
                }}
              />
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-right px-3 py-2 font-medium">زمان</th>
                      <th className="text-right px-3 py-2 font-medium">نوع</th>
                      <th className="text-right px-3 py-2 font-medium">اکشن</th>
                      <th className="text-right px-3 py-2 font-medium">مسیر</th>
                      <th className="text-right px-3 py-2 font-medium">کاربر</th>
                      <th className="text-right px-3 py-2 font-medium">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-gray-500">
                          در این بازه لاگی نیست. بعد از گردش در سایت، اینجا پر می‌شود.
                        </td>
                      </tr>
                    ) : (
                      logs.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-pre-line text-xs text-gray-600">
                            {formatDateTime(row.createdAt)}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full ${
                                row.kind === 'page_view'
                                  ? 'bg-sky-50 text-sky-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {row.kind === 'page_view' ? 'بازدید' : 'اکشن'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-800">
                            {row.actionLabel}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs dir-ltr text-left" dir="ltr">
                            {row.method && row.kind === 'action' ? `${row.method} ` : ''}
                            {row.path}
                          </td>
                          <td className="px-3 py-2">
                            {row.user ? (
                              <div>
                                <UserName
                                  name={row.user.publicName}
                                  className="text-sm"
                                  badgeClassName="w-3 h-3"
                                />
                                <div className="text-[11px] text-gray-400" dir="ltr">
                                  {row.user.phone}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">مهمان</span>
                            )}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-xs text-gray-500">
                            {row.status ?? '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <LogsPager
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={limit}
                onPage={setPage}
                onLimit={(n) => {
                  setLimit(n)
                  setPage(1)
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
