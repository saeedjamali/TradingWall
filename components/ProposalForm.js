'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/Button'
import { FEEDBACK_CATEGORIES } from '@/utils/feedbackCategories'

/**
 * Shared form: category + title + body + optional image
 * onSubmit({ title, body, image, category, phone })
 */
export default function ProposalForm({
  submitLabel = 'ارسال',
  onSubmit,
  dark = false,
  requireLogin = false,
  allowGuest = false,
  isLoggedIn = true,
  loginHref = '/auth/login',
  showCategory = false,
  defaultCategory = 'other',
  defaultPhone = '',
  defaultTitle = '',
}) {
  const initialCategory = /^[a-z0-9_-]+$/.test(defaultCategory)
    ? defaultCategory
    : 'other'

  const [feedbackCategories, setFeedbackCategories] =
    useState(FEEDBACK_CATEGORIES)
  const [category, setCategory] = useState(initialCategory)
  const [title, setTitle] = useState(defaultTitle || '')
  const [body, setBody] = useState('')
  const [phone, setPhone] = useState(defaultPhone || '')
  const [image, setImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (/^[a-z0-9_-]+$/.test(defaultCategory)) {
      setCategory(defaultCategory)
    }
  }, [defaultCategory])

  useEffect(() => {
    if (!showCategory) return
    let active = true
    fetch('/api/site-config')
      .then((response) => response.json())
      .then((data) => {
        if (!active || !data.success || !data.feedbackCategories?.length) return
        const items = data.feedbackCategories.map((item) => ({
          value: item.slug,
          label: item.label,
        }))
        setFeedbackCategories(items)
        setCategory((current) =>
          items.some((item) => item.value === current) ? current : 'other',
        )
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [showCategory])

  useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone)
  }, [defaultPhone])

  useEffect(() => {
    if (defaultTitle) setTitle(defaultTitle)
  }, [defaultTitle])

  const labelCls = dark ? 'text-gray-300' : 'text-gray-700'
  const inputCls = dark
    ? 'w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
    : 'w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500'

  const guestMode = allowGuest && !isLoggedIn
  const isSetupRequest = showCategory && category === 'add_setup'

  const uploadSelectedFile = async (file) => {
    if (!file) return

    const { validateImageFile, MAX_IMAGE_LABEL } = await import('@/utils/uploadLimits')
    const check = validateImageFile(file)
    if (!check.ok) {
      setError(check.error || `حداکثر حجم ${MAX_IMAGE_LABEL}`)
      return
    }

    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('type', 'message')
      const res = await fetch('/api/upload/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'خطا در آپلود')
      setImage(data.url)
    } catch (err) {
      setError(err.message || 'خطا در آپلود تصویر')
    } finally {
      setUploading(false)
    }
  }

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    await uploadSelectedFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (requireLogin && !isLoggedIn && !allowGuest) return
    if (guestMode && !/^09\d{9}$/.test(phone.trim())) {
      setError('شماره موبایل معتبر وارد کنید (مثل 09123456789)')
      return
    }
    if (showCategory && !category) {
      setError('دسته‌بندی را انتخاب کنید')
      return
    }
    if (!title.trim() || !body.trim()) {
      setError('عنوان و توضیحات الزامی است')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        image: image || null,
        category: showCategory ? category : undefined,
        phone: guestMode ? phone.trim() : undefined,
      })
      setTitle('')
      setBody('')
      setImage('')
      if (!defaultPhone) setPhone('')
      if (!defaultCategory || defaultCategory === 'other') setCategory('other')
      setSuccess('با موفقیت ارسال شد. پشتیبانی به‌زودی بررسی می‌کند.')
    } catch (err) {
      setError(err.message || 'خطا در ارسال')
    } finally {
      setSaving(false)
    }
  }

  if (requireLogin && !isLoggedIn && !allowGuest) {
    return (
      <div className={`rounded-xl border p-6 text-center ${dark ? 'border-white/15 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
        <p className="mb-4">برای ارسال نظر یا پیشنهاد ابتدا وارد شوید.</p>
        <a
          href={loginHref}
          className="inline-block px-6 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          ورود / ثبت‌نام
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showCategory && (
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
            دسته‌بندی
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
            required
          >
            {feedbackCategories.map((item) => (
              <option key={item.value} value={item.value} className="text-gray-900">
                {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {guestMode && (
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
            شماره موبایل
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            placeholder="09123456789"
            dir="ltr"
            required
          />
          <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            برای پیگیری پاسخ، شماره موبایلی که با آن ثبت‌نام کرده‌اید را وارد کنید.
          </p>
        </div>
      )}

      <div>
        <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
          {isSetupRequest ? 'نام ستاپ' : 'عنوان'}
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          placeholder={
            isSetupRequest
              ? 'مثلاً Order Block یا Breaker'
              : 'عنوان پیشنهاد یا انتقاد'
          }
          maxLength={200}
          required
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
          {isSetupRequest ? 'توضیح ستاپ' : 'توضیحات'}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${inputCls} min-h-[110px]`}
          placeholder={
            isSetupRequest
              ? 'شرایط ورود، تایید، حد ضرر، خروج و هر نکته‌ای که مدیر برای افزودن به لیست ستاپ‌ها لازم دارد…'
              : 'جزئیات را بنویسید...'
          }
          maxLength={5000}
          required
        />
        {isSetupRequest && (
          <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            پس از بررسی مدیر، در صورت تایید به لیست ستاپ‌های استاندارد اضافه می‌شود.
          </p>
        )}
      </div>
      <div>
        <p className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
          تصویر (اختیاری)
        </p>
        {image ? (
          <div
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              dark
                ? 'border-white/15 bg-white/5'
                : 'border-sky-100 bg-sky-50/60'
            }`}
          >
            <img
              src={image}
              alt="پیش‌نمایش تصویر پیوست"
              className="h-16 w-16 shrink-0 rounded-lg border border-black/5 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>
                تصویر پیوست شد
              </p>
              <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                می‌توانید تصویر را عوض کنید یا حذف کنید
              </p>
            </div>
            <label
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${
                dark
                  ? 'bg-white/10 text-white hover:bg-white/15'
                  : 'bg-white text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50'
              }`}
            >
              تغییر
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={handleImage}
              />
            </label>
            <button
              type="button"
              onClick={() => setImage('')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                dark
                  ? 'text-rose-300 hover:bg-white/10'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              حذف
            </button>
          </div>
        ) : (
          <label
            onDragOver={(event) => {
              event.preventDefault()
              if (!uploading) setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              if (!uploading) {
                uploadSelectedFile(event.dataTransfer.files?.[0])
              }
            }}
            className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
              uploading ? 'pointer-events-none opacity-70' : ''
            } ${
              dragOver
                ? dark
                  ? 'border-sky-400 bg-sky-500/15'
                  : 'border-sky-400 bg-sky-50'
                : dark
                  ? 'border-white/20 bg-white/5 hover:border-sky-400/70 hover:bg-white/10'
                  : 'border-sky-200 bg-gradient-to-b from-sky-50 to-white hover:border-sky-400 hover:from-sky-50 hover:to-sky-50/80'
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm ${
                dark
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'bg-sky-100 text-sky-600 group-hover:bg-sky-200'
              }`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </span>
            <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>
              {uploading ? 'در حال بارگذاری تصویر...' : 'انتخاب یا رها کردن تصویر'}
            </span>
            <span className={`text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              JPG، PNG، WEBP — حداکثر ۳ مگابایت
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={handleImage}
            />
          </label>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <Button type="submit" disabled={saving || uploading} fullWidth={!dark}>
        {saving ? 'در حال ارسال...' : submitLabel}
      </Button>
    </form>
  )
}
