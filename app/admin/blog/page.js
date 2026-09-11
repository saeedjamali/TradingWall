'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import Button from '@/components/Button'
import { BLOG_CATEGORY_LABELS, slugify } from '@/utils/blog'

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  coverImage: '',
  coverImageAlt: '',
  videoUrl: '',
  videoFile: '',
  gallery: [],
  category: 'education',
  tags: '',
  keywords: '',
  focusKeyword: '',
  seoTitle: '',
  seoDescription: '',
  faq1q: '',
  faq1a: '',
  faq2q: '',
  faq2a: '',
  isActive: false,
  isVisible: true,
      commentsEnabled: true,
      commentsRequireApproval: true,
      isPinned: false,
      pinPriority: 10,
      publishedAt: '',
}

function toLocalInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminBlogPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [tab, setTab] = useState('posts')
  const [commentFilter, setCommentFilter] = useState('pending')

  useEffect(() => {
    const raw = localStorage.getItem('user')
    const expiry = localStorage.getItem('tokenExpiry')
    if (!raw || !expiry || Date.now() >= parseInt(expiry, 10)) {
      router.push('/auth/login')
      return
    }
    const parsed = JSON.parse(raw)
    if (parsed.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    setUser(parsed)
  }, [router])

  useEffect(() => {
    if (user?.id) {
      fetchPosts()
      fetchComments()
    }
  }, [user?.id])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/blog?adminUserId=${user.id}`)
      const data = await res.json()
      if (data.success) setPosts(data.posts || [])
      else alert(data.error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    const res = await fetch(`/api/admin/blog/comments?adminUserId=${user.id}`)
    const data = await res.json()
    if (data.success) setComments(data.comments || [])
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const startEdit = (post) => {
    const faqs = post.faqs || []
    setEditingId(post._id)
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      body: post.body || '',
      coverImage: post.coverImage || '',
      coverImageAlt: post.coverImageAlt || '',
      videoUrl: post.videoUrl || '',
      videoFile: post.videoFile || '',
      gallery: post.gallery || [],
      category: post.category || 'education',
      tags: (post.tags || []).join('، '),
      keywords: (post.keywords || []).join('، '),
      focusKeyword: post.focusKeyword || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      faq1q: faqs[0]?.q || '',
      faq1a: faqs[0]?.a || '',
      faq2q: faqs[1]?.q || '',
      faq2a: faqs[1]?.a || '',
      isActive: post.isActive !== false,
      isVisible: post.isVisible !== false,
      commentsEnabled: post.commentsEnabled !== false,
      commentsRequireApproval: post.commentsRequireApproval !== false,
      isPinned: post.isPinned === true,
      pinPriority: post.isPinned ? (post.pinPriority || 10) : 10,
      publishedAt: toLocalInput(post.publishedAt),
    })
    setShowForm(true)
  }

  const uploadMedia = async (file, field) => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/blog', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'خطا در آپلود')
      if (field === 'gallery') {
        setForm((prev) => ({ ...prev, gallery: [...(prev.gallery || []), data.url] }))
      } else {
        setField(field, data.url)
      }
      return data.url
    } catch (err) {
      alert(err.message)
      return null
    }
  }

  const insertImageInBody = (url, alt = 'تصویر مقاله') => {
    if (!url) return
    setForm((prev) => ({
      ...prev,
      body: `${prev.body}${prev.body ? '\n\n' : ''}![${alt}](${url})\n`,
    }))
  }

  const savePost = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      alert('عنوان و متن مقاله الزامی است')
      return
    }
    setSaving(true)
    try {
      const payload = {
        adminUserId: user.id,
        postId: editingId,
        ...form,
        slug: form.slug || slugify(form.title),
        faqs: [
          { q: form.faq1q, a: form.faq1a },
          { q: form.faq2q, a: form.faq2a },
        ],
        publishedAt: form.publishedAt || new Date().toISOString(),
      }
      const res = await fetch('/api/admin/blog', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      alert(data.message)
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchPosts()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deletePost = async (post) => {
    if (!confirm(`مقاله «${post.title}» حذف شود؟`)) return
    const res = await fetch('/api/admin/blog', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUserId: user.id, postId: post._id }),
    })
    const data = await res.json()
    if (!data.success) alert(data.error)
    else fetchPosts()
  }

  const toggleComment = async (comment, isApproved) => {
    const res = await fetch('/api/admin/blog/comments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUserId: user.id, commentId: comment._id, isApproved }),
    })
    const data = await res.json()
    if (data.success) fetchComments()
  }

  const deleteComment = async (comment) => {
    if (!confirm('این نظر حذف شود؟')) return
    const res = await fetch('/api/admin/blog/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUserId: user.id, commentId: comment._id }),
    })
    const data = await res.json()
    if (data.success) fetchComments()
  }

  if (!user) return <Loading text="در حال بارگذاری..." />

  const pendingCount = comments.filter((c) => !c.isApproved).length
  const visibleComments = comments.filter((c) => {
    if (commentFilter === 'pending') return !c.isApproved
    if (commentFilter === 'approved') return c.isApproved
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">بلاگ و مقالات سئو</h2>
            <p className="text-sm text-gray-500 mt-1">
              هر مقاله باید یک کلمه کلیدی اصلی، عنوان یکتا و متن مفید داشته باشد.
              پست‌های ثابت با اولویت بالاتر، بالای صفحه بلاگ می‌مانند.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('posts')}
              className={`px-3 py-2 rounded-lg text-sm ${tab === 'posts' ? 'bg-slate-800 text-white' : 'bg-white border'}`}
            >
              مقالات
            </button>
            <button
              type="button"
              onClick={() => setTab('comments')}
              className={`px-3 py-2 rounded-lg text-sm ${tab === 'comments' ? 'bg-slate-800 text-white' : 'bg-white border'}`}
            >
              نظرات
              {pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
            {tab === 'posts' && (
              <Button
                onClick={() => {
                  setForm(emptyForm)
                  setEditingId(null)
                  setShowForm(true)
                }}
              >
                مقاله جدید
              </Button>
            )}
          </div>
        </div>

        {tab === 'comments' ? (
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { id: 'pending', label: `در انتظار تایید (${pendingCount})` },
                { id: 'approved', label: 'منتشرشده' },
                { id: 'all', label: 'همه' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCommentFilter(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs ${
                    commentFilter === item.id ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {visibleComments.length === 0 ? (
              <p className="text-gray-500 text-sm">نظری در این وضعیت نیست</p>
            ) : (
              visibleComments.map((c) => (
                <div
                  key={c._id}
                  className={`border rounded-lg p-3 ${c.isApproved ? '' : 'border-amber-300 bg-amber-50'}`}
                >
                  <p className="text-xs text-gray-500 mb-1">
                    {c.userId?.publicName || 'کاربر'} روی{' '}
                    <Link className="text-primary-700" href={`/blog/${c.postId?.slug || ''}`}>
                      {c.postId?.title || 'مقاله'}
                    </Link>
                    {c.isApproved ? ' · منتشرشده' : ' · در انتظار تایید'}
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.body}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      className="text-xs text-emerald-700"
                      onClick={() => toggleComment(c, !c.isApproved)}
                    >
                      {c.isApproved ? 'عدم نمایش' : 'تایید و انتشار'}
                    </button>
                    <button type="button" className="text-xs text-rose-700" onClick={() => deleteComment(c)}>
                      حذف
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {showForm && (
              <div className="bg-white rounded-xl border p-5 mb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-sm">
                    عنوان
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.title} onChange={(e) => {
                      const title = e.target.value
                      setForm((prev) => ({
                        ...prev,
                        title,
                        slug: prev.slug || slugify(title),
                      }))
                    }} />
                  </label>
                  <label className="text-sm">
                    نامک (slug)
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.slug} onChange={(e) => setField('slug', slugify(e.target.value))} />
                  </label>
                </div>
                <label className="text-sm block">
                  خلاصه (excerpt)
                  <textarea className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[70px]" value={form.excerpt} onChange={(e) => setField('excerpt', e.target.value)} />
                </label>
                <label className="text-sm block">
                  متن مقاله (از ## برای تیتر، **ضخیم**، و ![توضیح](آدرس تصویر) استفاده کنید)
                  <textarea className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[220px]" value={form.body} onChange={(e) => setField('body', e.target.value)} />
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-sm">
                    تصویر شاخص
                    <input type="file" accept="image/*" className="mt-1 block w-full text-xs" onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], 'coverImage')} />
                    {form.coverImage && (
                      <div className="flex gap-2 mt-1">
                        <p className="text-xs text-emerald-700 break-all flex-1">{form.coverImage}</p>
                        <button
                          type="button"
                          className="text-xs text-primary-700 shrink-0"
                          onClick={() => insertImageInBody(form.coverImage, form.coverImageAlt || form.title)}
                        >
                          درج در متن
                        </button>
                      </div>
                    )}
                  </label>
                  <label className="text-sm">
                    متن جایگزین تصویر (alt)
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.coverImageAlt} onChange={(e) => setField('coverImageAlt', e.target.value)} />
                  </label>
                  <label className="text-sm">
                    لینک ویدیو (یوتیوب / آپارات)
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.videoUrl} onChange={(e) => setField('videoUrl', e.target.value)} />
                  </label>
                  <label className="text-sm">
                    آپلود ویدیو mp4/webm
                    <input type="file" accept="video/mp4,video/webm" className="mt-1 block w-full text-xs" onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], 'videoFile')} />
                    {form.videoFile && <p className="text-xs text-emerald-700 mt-1 break-all">{form.videoFile}</p>}
                  </label>
                  <label className="text-sm md:col-span-2">
                    گالری تصاویر داخل مقاله
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-xs"
                      onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], 'gallery')}
                    />
                    {(form.gallery || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.gallery.map((src) => (
                          <div key={src} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border" />
                            <button
                              type="button"
                              className="absolute -top-1 -left-1 bg-white text-rose-600 text-xs rounded-full w-5 h-5 border"
                              onClick={() => setField('gallery', form.gallery.filter((item) => item !== src))}
                            >
                              ×
                            </button>
                            <button
                              type="button"
                              className="block text-[10px] text-primary-700 mt-1"
                              onClick={() => insertImageInBody(src)}
                            >
                              درج در متن
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </label>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-sm">
                    دسته
                    <select className="mt-1 w-full border rounded-lg px-3 py-2 bg-white" value={form.category} onChange={(e) => setField('category', e.target.value)}>
                      {Object.entries(BLOG_CATEGORY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    کلمه کلیدی اصلی
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.focusKeyword} onChange={(e) => setField('focusKeyword', e.target.value)} placeholder="مثلاً ژورنال معاملاتی" />
                  </label>
                  <label className="text-sm">
                    تگ‌ها (با ویرگول)
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.tags} onChange={(e) => setField('tags', e.target.value)} />
                  </label>
                  <label className="text-sm">
                    کلمات کلیدی سئو (با ویرگول)
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.keywords} onChange={(e) => setField('keywords', e.target.value)} />
                  </label>
                  <label className="text-sm">
                    عنوان سئو
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.seoTitle} onChange={(e) => setField('seoTitle', e.target.value)} />
                  </label>
                  <label className="text-sm">
                    توضیحات سئو
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.seoDescription} onChange={(e) => setField('seoDescription', e.target.value)} />
                  </label>
                  <label className="text-sm">
                    تاریخ نمایش
                    <input type="datetime-local" className="mt-1 w-full border rounded-lg px-3 py-2" value={form.publishedAt} onChange={(e) => setField('publishedAt', e.target.value)} />
                  </label>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-sm">سوال متداول ۱<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.faq1q} onChange={(e) => setField('faq1q', e.target.value)} /></label>
                  <label className="text-sm">پاسخ ۱<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.faq1a} onChange={(e) => setField('faq1a', e.target.value)} /></label>
                  <label className="text-sm">سوال متداول ۲<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.faq2q} onChange={(e) => setField('faq2q', e.target.value)} /></label>
                  <label className="text-sm">پاسخ ۲<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.faq2a} onChange={(e) => setField('faq2a', e.target.value)} /></label>
                </div>
                <div className="flex flex-wrap gap-4 text-sm items-end">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />
                    فعال
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={form.isVisible} onChange={(e) => setField('isVisible', e.target.checked)} />
                    نمایش در لیست و سایت‌مپ
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isPinned}
                      onChange={(e) => setField('isPinned', e.target.checked)}
                    />
                    پست ثابت (بالای صفحه بلاگ)
                  </label>
                  {form.isPinned ? (
                    <label className="text-sm min-w-[160px]">
                      اولویت نمایش
                      <input
                        type="number"
                        min="1"
                        max="99"
                        className="mt-1 block w-28 border rounded-lg px-3 py-2"
                        value={form.pinPriority}
                        onChange={(e) => setField('pinPriority', e.target.value)}
                      />
                      <span className="block text-[11px] text-gray-500 mt-1">عدد بزرگ‌تر بالاتر می‌آید (۱ تا ۹۹)</span>
                    </label>
                  ) : null}
                  <label className="text-sm min-w-[240px]">
                    نظرات
                    <select
                      className="mt-1 block w-full border rounded-lg px-3 py-2 bg-white"
                      value={
                        !form.commentsEnabled
                          ? 'off'
                          : form.commentsRequireApproval
                            ? 'approve'
                            : 'instant'
                      }
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === 'off') {
                          setField('commentsEnabled', false)
                          return
                        }
                        setForm((prev) => ({
                          ...prev,
                          commentsEnabled: true,
                          commentsRequireApproval: value === 'approve',
                        }))
                      }}
                    >
                      <option value="off">غیرفعال</option>
                      <option value="instant">انتشار بدون تایید ادمین</option>
                      <option value="approve">انتشار پس از تایید ادمین</option>
                    </select>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={savePost} disabled={saving}>{saving ? 'در حال ذخیره...' : 'ذخیره مقاله'}</Button>
                  <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>انصراف</Button>
                </div>
              </div>
            )}

            {loading ? (
              <Loading text="در حال دریافت مقالات..." />
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {posts.length === 0 ? (
                  <p className="p-8 text-center text-gray-500">هنوز مقاله‌ای نیست</p>
                ) : (
                  posts.map((post) => (
                    <div key={post._id} className={`p-4 flex flex-wrap items-center justify-between gap-3 ${post.isPinned ? 'bg-amber-50/80' : ''}`}>
                      <div>
                        <p className="font-bold text-gray-900 flex flex-wrap items-center gap-2">
                          {post.title}
                          {post.isPinned ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                              ثابت · اولویت {post.pinPriority || 0}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          /blog/{post.slug} · {BLOG_CATEGORY_LABELS[post.category] || post.category}
                          {post.isActive ? ' · فعال' : ' · غیرفعال'}
                          {post.isVisible ? ' · نمایش' : ' · مخفی'}
                          {!post.commentsEnabled
                            ? ' · بدون نظر'
                            : post.commentsRequireApproval !== false
                              ? ' · نظر با تایید ادمین'
                              : ' · نظر بدون تایید'}
                          {post.publishedAt ? ` · نمایش ${new Date(post.publishedAt).toLocaleString('fa-IR')}` : ''}
                          {post.updatedAt ? ` · ویرایش ${new Date(post.updatedAt).toLocaleString('fa-IR')}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <Link href={`/blog/${post.slug}`} className="px-3 py-1 rounded-lg border" target="_blank">مشاهده</Link>
                        <button type="button" className="px-3 py-1 rounded-lg border" onClick={() => startEdit(post)}>ویرایش</button>
                        <button type="button" className="px-3 py-1 rounded-lg border text-rose-700" onClick={() => deletePost(post)}>حذف</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
