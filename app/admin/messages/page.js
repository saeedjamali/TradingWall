'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import Button from '@/components/Button'
import { UserName } from '@/components/VerifiedBadge'
import {
  FEEDBACK_CATEGORIES,
  getFeedbackCategoryLabel,
} from '@/utils/feedbackCategories'
import { CATEGORY_LABELS } from '@/utils/symbolSeed'

const SYMBOL_CATEGORIES = [
  'forex_major',
  'forex_minor',
  'forex_exotic',
  'metals',
  'energy',
  'indices',
  'crypto',
  'stocks',
  'commodities',
  'other',
]

export default function AdminMessagesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('site_feedback')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [phoneQuery, setPhoneQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyImage, setReplyImage] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [addingSetup, setAddingSetup] = useState(false)
  const [resolvingSymbol, setResolvingSymbol] = useState(false)
  const [symbolForm, setSymbolForm] = useState({
    code: '',
    name: '',
    nameFa: '',
    category: 'other',
  })

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
  }, [router])

  useEffect(() => {
    if (user) fetchMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter, statusFilter, categoryFilter, phoneQuery])

  useEffect(() => {
    const meta = selected?.meta
    if (meta?.kind === 'unknown_symbol') {
      const similar = meta.similar?.[0]
      setSymbolForm({
        code: meta.symbolCode || '',
        name: similar?.name || meta.symbolCode || '',
        nameFa: similar?.nameFa || '',
        category: similar?.category || 'other',
      })
    }
  }, [selected?._id])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        adminUserId: user.id,
        type: filter,
      })
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (phoneQuery) params.set('phone', phoneQuery)
      const res = await fetch(`/api/admin/messages?${params}`)
      const data = await res.json()
      if (data.success) setMessages(data.messages || [])
      else alert(data.error || 'خطا')
    } catch {
      alert('خطا در دریافت پیام‌ها')
    } finally {
      setLoading(false)
    }
  }

  const applyPhoneSearch = (e) => {
    e?.preventDefault?.()
    setSelected(null)
    setPhoneQuery(phoneSearch.trim())
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
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
      fd.append('type', 'message')
      const res = await fetch('/api/upload/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) setReplyImage(data.url)
      else alert(data.error || 'خطا در آپلود')
    } finally {
      setUploading(false)
    }
  }

  const handleReply = async () => {
    if (!selected || !replyBody.trim()) {
      alert('متن پاسخ را وارد کنید')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          messageId: selected._id,
          replyBody,
          replyImage: replyImage || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSelected(data.item)
        setReplyBody('')
        setReplyImage('')
        fetchMessages()
      } else {
        alert(data.error || 'خطا')
      }
    } catch {
      alert('خطا در ثبت پاسخ')
    } finally {
      setSaving(false)
    }
  }

  const addAsStandardSetup = async () => {
    if (!selected || selected.category !== 'add_setup') return
    if (!confirm(`ستاپ «${selected.title}» به لیست استاندارد اضافه شود؟`)) return
    setAddingSetup(true)
    try {
      const res = await fetch('/api/admin/setups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          title: selected.title,
          description: selected.body || '',
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'خطا در افزودن ستاپ')
      alert('ستاپ به لیست استاندارد اضافه شد')
    } catch (err) {
      alert(err.message || 'خطا در افزودن ستاپ')
    } finally {
      setAddingSetup(false)
    }
  }

  const resolveUnknownSymbol = async (action) => {
    if (!selected || selected.meta?.kind !== 'unknown_symbol') return
    if (selected.meta?.resolved) return
    if (action === 'approve_symbol') {
      if (!symbolForm.code.trim() || !symbolForm.name.trim() || !symbolForm.category) {
        alert('کد، نام و دسته‌بندی را کامل کنید')
        return
      }
      if (!confirm(`نماد «${symbolForm.code}» به فهرست اضافه شود و به کاربر اطلاع داده شود؟`)) return
    } else if (
      !confirm(
        `همه معاملات این کاربر با نماد «${selected.meta.symbolCode}» حذف شود و به او اطلاع داده شود؟`
      )
    ) {
      return
    }

    setResolvingSymbol(true)
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          messageId: selected._id,
          action,
          code: symbolForm.code,
          name: symbolForm.name,
          nameFa: symbolForm.nameFa,
          category: symbolForm.category,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'خطا')
      setSelected(data.item)
      fetchMessages()
      alert(data.message || 'انجام شد')
    } catch (err) {
      alert(err.message || 'خطا در رسیدگی به نماد')
    } finally {
      setResolvingSymbol(false)
    }
  }

  if (!user) return <Loading text="در حال بارگذاری..." />

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">نظرات و پیشنهادات</h2>
          <p className="text-sm text-gray-500 mt-1">بازخورد کاربران درباره توسعه سایت و پیشنهادات کاری</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-6">
          <form
            onSubmit={applyPhoneSearch}
            className="flex flex-wrap gap-2 items-center"
          >
            <select
              value={filter}
              onChange={(e) => {
                const next = e.target.value
                setFilter(next)
                if (next === 'job_offer') setCategoryFilter('')
                setSelected(null)
              }}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="site_feedback">نظرات سایت</option>
              <option value="job_offer">پیشنهادات کاری</option>
              <option value="all">همه</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setSelected(null) }}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="open">بدون پاسخ</option>
              <option value="replied">پاسخ‌داده‌شده</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setSelected(null) }}
              className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[180px]"
              disabled={filter === 'job_offer'}
              title={filter === 'job_offer' ? 'دسته‌بندی فقط برای نظرات سایت است' : ''}
            >
              <option value="">همه دسته‌بندی‌ها</option>
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="جستجو شماره همراه..."
              dir="ltr"
              className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[180px] flex-1"
            />
            <Button type="submit" className="!py-2 !px-4 text-sm">
              جستجو
            </Button>
            {(phoneQuery || categoryFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setPhoneSearch('')
                  setPhoneQuery('')
                  setCategoryFilter('')
                  setStatusFilter('')
                  setSelected(null)
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                پاک کردن فیلتر
              </button>
            )}
          </form>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8"><Loading text="..." /></div>
            ) : messages.length === 0 ? (
              <p className="p-8 text-center text-gray-500 text-sm">پیامی نیست</p>
            ) : (
              <ul className="divide-y max-h-[70vh] overflow-y-auto">
                {messages.map((m) => (
                  <li key={m._id}>
                    <button
                      type="button"
                      onClick={() => { setSelected(m); setReplyBody(''); setReplyImage('') }}
                      className={`w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selected?._id === m._id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate">
                          {m.title}
                          {m.meta?.kind === 'unknown_symbol' && !m.meta?.resolved ? ' · نماد جدید' : ''}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                          (m.thread?.length || 0) > 0 || m.status === 'replied'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {(m.thread?.length || 0) > 0
                            ? `${m.thread.length} پاسخ`
                            : 'باز'}
                        </span>
                      </div>
                      {m.type === 'site_feedback' && (
                        <p className="text-[10px] text-primary-700 mb-1">
                          {getFeedbackCategoryLabel(m.category)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 truncate inline-flex items-center gap-1 max-w-full">
                        <UserName
                          name={m.fromUserId?.publicName || (m.contactPhone ? 'مهمان' : 'کاربر')}
                          verified={m.fromUserId?.verified}
                          badgeClassName="w-3 h-3 text-blue-500"
                        />
                        {m.contactPhone ? (
                          <span className="text-gray-400" dir="ltr">
                            ({m.contactPhone})
                          </span>
                        ) : null}
                        {m.type === 'job_offer' && m.toUserId ? (
                          <>
                            <span>→</span>
                            <UserName
                              name={m.toUserId.publicName}
                              verified={m.toUserId.verified}
                              badgeClassName="w-3 h-3 text-blue-500"
                            />
                          </>
                        ) : null}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(m.createdAt).toLocaleString('fa-IR')}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
            {!selected ? (
              <p className="text-center text-gray-400 py-16">یک پیام را انتخاب کنید</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selected.type === 'site_feedback' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
                    }`}>
                      {selected.type === 'site_feedback' ? 'نظر سایت' : 'پیشنهاد کاری'}
                    </span>
                    {selected.type === 'site_feedback' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {getFeedbackCategoryLabel(selected.category)}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 inline-flex items-center gap-1 flex-wrap">
                      از{' '}
                      <UserName
                        name={selected.fromUserId?.publicName || (selected.contactPhone ? 'مهمان' : 'کاربر')}
                        verified={selected.fromUserId?.verified}
                        badgeClassName="w-3 h-3 text-blue-500"
                      />
                      {(selected.fromUserId?.phone || selected.contactPhone)
                        ? ` (${selected.fromUserId?.phone || selected.contactPhone})`
                        : ''}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{selected.title}</h3>
                  <div className="mt-3 rounded-lg p-3 bg-gray-50 border">
                    <p className="text-xs text-gray-500 mb-1">پیام اولیه</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{selected.body}</p>
                    {selected.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.image} alt="" className="mt-3 max-h-64 rounded-lg border object-contain" />
                    )}
                  </div>
                  {selected.category === 'add_setup' && (
                    <button
                      type="button"
                      onClick={addAsStandardSetup}
                      disabled={addingSetup}
                      className="mt-3 inline-flex items-center px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {addingSetup ? 'در حال افزودن…' : 'تایید و افزودن به ستاپ‌های استاندارد'}
                    </button>
                  )}
                  {selected.meta?.kind === 'unknown_symbol' && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3" dir="rtl">
                      <p className="text-sm font-semibold text-amber-900">
                        رسیدگی به نماد «{selected.meta.symbolCode}»
                        {selected.meta.tradeCount
                          ? ` · ${selected.meta.tradeCount} معامله`
                          : ''}
                      </p>
                      {selected.meta.similar?.length > 0 && (
                        <p className="text-xs text-amber-800">
                          نماد نزدیک:{' '}
                          {selected.meta.similar.map((s) => s.code || s).join('، ')}
                        </p>
                      )}
                      {selected.meta.resolved ? (
                        <p className="text-sm text-emerald-800">
                          {selected.meta.resolved === 'approved'
                            ? `تایید شده${selected.meta.resolvedCode ? ` (${selected.meta.resolvedCode})` : ''}`
                            : 'رد شده و معاملات حذف شد'}
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="text-xs text-gray-600">
                              کد نماد
                              <input
                                value={symbolForm.code}
                                onChange={(e) =>
                                  setSymbolForm((f) => ({ ...f, code: e.target.value }))
                                }
                                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                              />
                            </label>
                            <label className="text-xs text-gray-600">
                              نام
                              <input
                                value={symbolForm.name}
                                onChange={(e) =>
                                  setSymbolForm((f) => ({ ...f, name: e.target.value }))
                                }
                                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                              />
                            </label>
                            <label className="text-xs text-gray-600">
                              نام فارسی
                              <input
                                value={symbolForm.nameFa}
                                onChange={(e) =>
                                  setSymbolForm((f) => ({ ...f, nameFa: e.target.value }))
                                }
                                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                              />
                            </label>
                            <label className="text-xs text-gray-600">
                              دسته‌بندی
                              <select
                                value={symbolForm.category}
                                onChange={(e) =>
                                  setSymbolForm((f) => ({ ...f, category: e.target.value }))
                                }
                                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm bg-white"
                              >
                                {SYMBOL_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {CATEGORY_LABELS[cat] || cat}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => resolveUnknownSymbol('approve_symbol')}
                              disabled={resolvingSymbol}
                              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
                            >
                              {resolvingSymbol ? 'در حال ثبت…' : 'افزودن به فهرست نمادها'}
                            </button>
                            <button
                              type="button"
                              onClick={() => resolveUnknownSymbol('reject_symbol')}
                              disabled={resolvingSymbol}
                              className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50"
                            >
                              حذف معاملات این نماد
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Thread */}
                {(selected.thread || []).length > 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-semibold text-gray-800 mb-2">گفتگو</h4>
                    {(selected.thread || []).map((item, idx) => {
                      const fromId = String(item.fromUserId?._id || item.fromUserId)
                      const isAdminMsg = item.fromUserId?.role === 'admin' || fromId === String(user.id)
                      return (
                        <div
                          key={item._id || idx}
                          className={`rounded-lg p-3 ${
                            isAdminMsg
                              ? 'bg-emerald-50 border border-emerald-100'
                              : 'bg-white border'
                          }`}
                        >
                          <p className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1 flex-wrap">
                            <UserName
                              name={item.fromUserId?.publicName}
                              verified={item.fromUserId?.verified}
                              badgeClassName="w-3 h-3 text-blue-500"
                            />
                            {item.fromUserId?.role === 'admin' ? ' (مدیر)' : ''}
                          </p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.body}</p>
                          {item.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="mt-2 max-h-40 rounded border object-contain" />
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('fa-IR') : ''}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {selected.type === 'site_feedback' && selected.status !== 'closed' ? (
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-semibold">ارسال پیام در گفتگو</h4>
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
                      placeholder="پاسخ یا پیام بعدی..."
                    />
                    <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                    {replyImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={replyImage} alt="" className="h-20 rounded border" />
                    )}
                    <Button onClick={handleReply} disabled={saving || uploading}>
                      {saving ? 'در حال ارسال...' : 'ارسال پیام'}
                    </Button>
                  </div>
                ) : selected.type !== 'site_feedback' ? (
                  <p className="text-sm text-gray-500 border-t pt-4">
                    پیشنهادات کاری توسط طرفین در پروفایل کاربر ادامه پیدا می‌کند.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
