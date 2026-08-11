'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import Button from '@/components/Button'

export default function AdminMessagesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('site_feedback')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyImage, setReplyImage] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

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
  }, [user, filter, statusFilter])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        adminUserId: user.id,
        type: filter,
      })
      if (statusFilter) params.set('status', statusFilter)
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

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
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

  if (!user) return <Loading text="در حال بارگذاری..." />

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">نظرات و پیشنهادات</h2>
          <p className="text-sm text-gray-500 mt-1">بازخورد کاربران درباره توسعه سایت و پیشنهادات کاری</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setSelected(null) }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="site_feedback">نظرات سایت</option>
            <option value="job_offer">پیشنهادات کاری</option>
            <option value="all">همه</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="open">بدون پاسخ</option>
            <option value="replied">پاسخ‌داده‌شده</option>
          </select>
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
                        <span className="font-semibold text-gray-900 truncate">{m.title}</span>
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
                      <p className="text-xs text-gray-500 truncate">
                        {m.fromUserId?.publicName || 'کاربر'}
                        {m.type === 'job_offer' && m.toUserId ? ` → ${m.toUserId.publicName}` : ''}
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
                    <span className="text-xs text-gray-400">
                      از {selected.fromUserId?.publicName}
                      {selected.fromUserId?.phone ? ` (${selected.fromUserId.phone})` : ''}
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
                          <p className="text-xs text-gray-500 mb-1">
                            {item.fromUserId?.publicName || 'کاربر'}
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
