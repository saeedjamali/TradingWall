'use client'

import { useState } from 'react'
import Button from '@/components/Button'

/**
 * Shared form: title + body + optional image
 * onSubmit({ title, body, image })
 */
export default function ProposalForm({
  submitLabel = 'ارسال',
  onSubmit,
  dark = false,
  requireLogin = false,
  isLoggedIn = true,
  loginHref = '/auth/login',
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const labelCls = dark ? 'text-gray-300' : 'text-gray-700'
  const inputCls = dark
    ? 'w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
    : 'w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500'

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (requireLogin && !isLoggedIn) return
    if (!title.trim() || !body.trim()) {
      setError('عنوان و توضیحات الزامی است')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await onSubmit({ title: title.trim(), body: body.trim(), image: image || null })
      setTitle('')
      setBody('')
      setImage('')
      setSuccess('با موفقیت ارسال شد')
    } catch (err) {
      setError(err.message || 'خطا در ارسال')
    } finally {
      setSaving(false)
    }
  }

  if (requireLogin && !isLoggedIn) {
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
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>عنوان</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          placeholder="عنوان پیشنهاد یا انتقاد"
          maxLength={200}
          required
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>توضیحات</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${inputCls} min-h-[110px]`}
          placeholder="جزئیات را بنویسید..."
          maxLength={5000}
          required
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>تصویر (اختیاری)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          disabled={uploading}
          className={`block w-full text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}
        />
        {uploading && <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>در حال آپلود...</p>}
        {image && (
          <div className="mt-2 relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-24 rounded-lg border object-cover" />
            <button
              type="button"
              onClick={() => setImage('')}
              className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs"
            >
              ×
            </button>
          </div>
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
