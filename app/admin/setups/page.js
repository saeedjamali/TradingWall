'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import Button from '@/components/Button'
import Input from '@/components/Input'

export default function AdminSetupsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [setups, setSetups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '' })

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
    fetchSetups(parsed.id)
  }, [router])

  const fetchSetups = async (adminUserId) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/setups?adminUserId=${adminUserId}`)
      const data = await response.json()
      if (data.success) {
        setSetups(data.setups)
      } else {
        alert(data.error || 'خطا در دریافت ستاپ‌ها')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در دریافت ستاپ‌ها')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (setup) => {
    setFormData({ title: setup.title, description: setup.description || '' })
    setEditingId(setup._id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('عنوان ستاپ الزامی است')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/setups', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          setupId: editingId || undefined,
          title: formData.title,
          description: formData.description,
        }),
      })
      const data = await response.json()
      if (data.success) {
        resetForm()
        fetchSetups(user.id)
      } else {
        alert(data.error || 'خطا در ذخیره')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در ذخیره ستاپ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (setupId) => {
    if (!confirm('آیا از حذف این ستاپ استاندارد مطمئن هستید؟')) return

    try {
      const response = await fetch('/api/admin/setups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user.id, setupId }),
      })
      const data = await response.json()
      if (data.success) {
        fetchSetups(user.id)
      } else {
        alert(data.error || 'خطا در حذف')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در حذف ستاپ')
    }
  }

  if (!user) {
    return <Loading text="در حال بارگذاری..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">ستاپ‌های استاندارد</h2>
            <p className="text-gray-500 text-sm mt-1">
              جداول ثابت که برای همه کاربران قابل انتخاب است
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>➕ افزودن ستاپ</Button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-bold text-lg mb-4">
              {editingId ? 'ویرایش ستاپ' : 'افزودن ستاپ استاندارد'}
            </h3>
            <div className="space-y-4 max-w-xl">
              <Input
                label="عنوان"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثلا: Breakout"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="شرح کوتاه ستاپ..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'در حال ذخیره...' : 'ذخیره'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <Loading text="در حال بارگذاری ستاپ‌ها..." />
        ) : setups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">⚙️</p>
            <p>هنوز ستاپ استانداردی تعریف نشده است</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              افزودن اولین ستاپ
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {setups.map((setup) => (
              <div
                key={setup._id}
                className="bg-white rounded-lg shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg text-gray-800">{setup.title}</h3>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
                    استاندارد
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
                  {setup.description || 'بدون توضیحات'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(setup)}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(setup._id)}
                    className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
