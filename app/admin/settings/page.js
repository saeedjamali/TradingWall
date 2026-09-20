'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import Loading from '@/components/Loading'

function CategoryEditor({ title, description, items, onChange }) {
  const update = (index, patch) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const add = () => {
    onChange([
      ...items,
      { slug: '', label: '', isActive: true, isSystem: false },
    ])
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

      <div className="mt-4 space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item.slug}-${index}`}
            className="grid gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
          >
            <input
              value={item.label}
              onChange={(event) => update(index, { label: event.target.value })}
              placeholder="عنوان فارسی"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <input
              value={item.slug}
              onChange={(event) =>
                update(index, {
                  slug: event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, ''),
                })
              }
              readOnly={item.isSystem}
              placeholder="english-slug"
              dir="ltr"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm read-only:bg-gray-100"
            />
            <label className="flex items-center gap-2 px-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={item.isActive !== false}
                onChange={(event) =>
                  update(index, { isActive: event.target.checked })
                }
              />
              فعال
            </label>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={item.isSystem}
              className="rounded-md px-2 text-xs text-rose-600 disabled:cursor-not-allowed disabled:text-gray-300"
              title={item.isSystem ? 'دسته سیستمی قابل حذف نیست' : 'حذف'}
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [blogCategories, setBlogCategories] = useState([])
  const [feedbackCategories, setFeedbackCategories] = useState([])

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
    if (!user?.id) return
    ;(async () => {
      try {
        const response = await fetch(
          `/api/admin/settings?adminUserId=${user.id}`,
        )
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'خطا در دریافت تنظیمات')
        }
        setBlogCategories(data.settings.blogCategories || [])
        setFeedbackCategories(data.settings.feedbackCategories || [])
      } catch (error) {
        alert(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.id])

  const save = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          blogCategories,
          feedbackCategories,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در ذخیره تنظیمات')
      }
      setBlogCategories(data.settings.blogCategories || [])
      setFeedbackCategories(data.settings.feedbackCategories || [])
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
      <main className="container mx-auto max-w-5xl space-y-5 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تنظیمات سیستم</h1>
          <p className="mt-1 text-sm text-gray-500">
            تنظیمات جزئی و قابل توسعه سایت را از این بخش مدیریت کنید.
          </p>
        </div>

        <CategoryEditor
          title="دسته‌بندی‌های بلاگ"
          description="این دسته‌ها در فرم مقاله و فیلترهای عمومی بلاگ استفاده می‌شوند."
          items={blogCategories}
          onChange={setBlogCategories}
        />
        <CategoryEditor
          title="دسته‌بندی‌های خطا و بازخورد"
          description="عنوان دسته‌های فرم پشتیبانی و صندوق پیام‌های مدیر."
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
