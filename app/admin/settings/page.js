'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import Loading from '@/components/Loading'

function newClientId(prefix, index = 0) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${index}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function withClientId(item, prefix, index) {
  return {
    ...item,
    uid: item.uid || newClientId(prefix, index),
  }
}

function toSavePayload(items) {
  return items.map((item) => ({
    slug: item.slug,
    label: item.label,
    isActive: item.isActive !== false,
    isSystem: Boolean(item.isSystem),
    originKey: item.originKey || '',
  }))
}

function applySaved(nextItems, prevItems, prefix) {
  return (nextItems || []).map((item, index) => {
    const prev =
      prevItems.find((p) => p.originKey && p.originKey === item.originKey) ||
      prevItems.find((p) => p.slug && p.slug === item.slug) ||
      prevItems[index]
    return withClientId({ ...item, uid: prev?.uid }, prefix, index)
  })
}

function sanitizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
}

function moveByUid(items, uid, direction) {
  const index = items.findIndex((item) => item.uid === uid)
  const next = index + direction
  if (index < 0 || next < 0 || next >= items.length) return items
  const copy = [...items]
  const current = copy[index]
  copy[index] = copy[next]
  copy[next] = current
  return copy
}

function CategoryEditor({ title, description, items, onChange }) {
  const update = (uid, patch) => {
    onChange((current) =>
      current.map((item) => (item.uid === uid ? { ...item, ...patch } : item)),
    )
  }

  const remove = (uid) => {
    onChange((current) => current.filter((item) => item.uid !== uid))
  }

  const add = () => {
    const uid = newClientId('new')
    onChange((current) => [
      ...current,
      {
        slug: '',
        label: '',
        isActive: true,
        isSystem: false,
        originKey: '',
        uid,
      },
    ])
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-cat-uid="${uid}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }

  const move = (uid, direction) => {
    onChange((current) => moveByUid(current, uid, direction))
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white"
        >
          افزودن دسته
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {items.map((item, index) => (
          <CategoryRow
            key={item.uid}
            item={item}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            onUpdate={update}
            onMove={move}
            onRemove={remove}
          />
        ))}
      </div>
    </section>
  )
}

function CategoryRow({ item, isFirst, isLast, onUpdate, onMove, onRemove }) {
  return (
    <div
      data-cat-uid={item.uid}
      className="grid items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[auto_1fr_1fr_auto_auto]"
    >
      <div className="relative z-10 flex gap-1 sm:flex-col">
        <button
          type="button"
          onClick={() => onMove(item.uid, -1)}
          disabled={isFirst}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
          title="انتقال به بالا"
          aria-label="انتقال به بالا"
        >
          <MoveUpIcon />
        </button>
        <button
          type="button"
          onClick={() => onMove(item.uid, 1)}
          disabled={isLast}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
          title="انتقال به پایین"
          aria-label="انتقال به پایین"
        >
          <MoveDownIcon />
        </button>
      </div>
      <input
        value={item.label || ''}
        onChange={(event) => onUpdate(item.uid, { label: event.target.value })}
        placeholder="عنوان فارسی"
        autoComplete="off"
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      />
      <input
        value={item.slug || ''}
        onChange={(event) =>
          onUpdate(item.uid, { slug: sanitizeSlug(event.target.value) })
        }
        placeholder="english-slug"
        dir="ltr"
        autoComplete="off"
        spellCheck={false}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 px-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={item.isActive !== false}
          onChange={(event) =>
            onUpdate(item.uid, { isActive: event.target.checked })
          }
        />
        فعال
      </label>
      <button
        type="button"
        onClick={() => onRemove(item.uid)}
        disabled={item.isSystem}
        className="rounded-md px-2 text-xs text-rose-600 disabled:cursor-not-allowed disabled:text-gray-300"
        title={item.isSystem ? 'دسته سیستمی قابل حذف نیست' : 'حذف'}
      >
        حذف
      </button>
    </div>
  )
}

function MoveUpIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  )
}

function MoveDownIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [blogCategories, setBlogCategories] = useState([])
  const [feedbackCategories, setFeedbackCategories] = useState([])
  const settingsLoaded = useRef(false)
  const blogCategoriesRef = useRef([])
  const feedbackCategoriesRef = useRef([])
  blogCategoriesRef.current = blogCategories
  feedbackCategoriesRef.current = feedbackCategories

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
    if (!user?.id || settingsLoaded.current) return
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(
          `/api/admin/settings?adminUserId=${user.id}`,
          { cache: 'no-store' },
        )
        const data = await response.json()
        if (cancelled) return
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'خطا در دریافت تنظیمات')
        }
        setBlogCategories(
          (data.settings.blogCategories || []).map((item, index) =>
            withClientId(item, 'blog', index),
          ),
        )
        setFeedbackCategories(
          (data.settings.feedbackCategories || []).map((item, index) =>
            withClientId(item, 'feedback', index),
          ),
        )
        settingsLoaded.current = true
      } catch (error) {
        if (!cancelled) alert(error.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const save = async (event) => {
    event?.preventDefault?.()
    const blogPayload = toSavePayload(blogCategoriesRef.current)
    const feedbackPayload = toSavePayload(feedbackCategoriesRef.current)
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          blogCategories: blogPayload,
          feedbackCategories: feedbackPayload,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در ذخیره تنظیمات')
      }
      setBlogCategories((prev) =>
        applySaved(data.settings?.blogCategories || blogPayload, prev, 'blog'),
      )
      setFeedbackCategories((prev) =>
        applySaved(
          data.settings?.feedbackCategories || feedbackPayload,
          prev,
          'feedback',
        ),
      )
      alert('تنظیمات ذخیره شد')
    } catch (error) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) {
    return <Loading text="در حال بارگذاری تنظیمات..." />
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <AdminHeader user={user} />
      <main className="container mx-auto max-w-5xl space-y-5 px-4 py-8 pb-28">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تنظیمات سیستم</h1>
          <p className="mt-1 text-sm text-gray-500">
            تنظیمات جزئی و قابل توسعه سایت را از این بخش مدیریت کنید.
          </p>
        </div>

        <CategoryEditor
          title="دسته‌بندی‌های بلاگ"
          description="این دسته‌ها در فرم مقاله و فیلترهای عمومی بلاگ استفاده می‌شوند. ترتیب لیست همان ترتیب نمایش است."
          items={blogCategories}
          onChange={setBlogCategories}
        />
        <CategoryEditor
          title="دسته‌بندی‌های خطا و بازخورد"
          description="عنوان دسته‌های فرم پشتیبانی و صندوق پیام‌های مدیر. ترتیب لیست همان ترتیب نمایش است."
          items={feedbackCategories}
          onChange={setFeedbackCategories}
        />

        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-5">
          <h2 className="font-bold text-gray-800">سایر تنظیمات</h2>
          <p className="mt-1 text-xs text-gray-500">
            این ساختار برای افزودن تنظیمات جزئی بعدی آماده است.
          </p>
        </section>

        <div className="sticky bottom-3 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </div>
      </main>
    </div>
  )
}
