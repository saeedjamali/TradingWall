'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'
import Button from '@/components/Button'
import Input from '@/components/Input'

export default function PersonalSetupsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [setups, setSetups] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingSetup, setEditingSetup] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '' })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchSetups(parsedUser.id)
  }, [router])

  const fetchSetups = async (userId) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/setups?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        // Filter only custom setups for this user
        const customSetups = data.setups.filter(s => s.type === 'custom' && s.userId === userId)
        setSetups(customSetups)
      }
    } catch (error) {
      console.error('Error fetching setups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.title.trim()) {
      alert('لطفا عنوان ستاپ را وارد کنید')
      return
    }

    try {
      const response = await fetch('/api/setups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: formData.title,
          description: formData.description,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('ستاپ با موفقیت اضافه شد')
        fetchSetups(user.id)
        setFormData({ title: '', description: '' })
        setShowAddForm(false)
      } else {
        alert(data.error || 'خطایی رخ داده است')
      }
    } catch (error) {
      console.error('Error adding setup:', error)
      alert('خطا در افزودن ستاپ')
    }
  }

  const handleUpdate = async (setupId) => {
    if (!formData.title.trim()) {
      alert('لطفا عنوان ستاپ را وارد کنید')
      return
    }

    try {
      const response = await fetch(`/api/setups/${setupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: formData.title,
          description: formData.description,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('ستاپ با موفقیت به‌روزرسانی شد')
        fetchSetups(user.id)
        setEditingSetup(null)
        setFormData({ title: '', description: '' })
      } else {
        alert(data.error || 'خطایی رخ داده است')
      }
    } catch (error) {
      console.error('Error updating setup:', error)
      alert('خطا در به‌روزرسانی ستاپ')
    }
  }

  const handleDelete = async (setupId) => {
    if (!confirm('آیا از حذف این ستاپ اطمینان دارید؟')) {
      return
    }

    try {
      const response = await fetch(`/api/setups/${setupId}?userId=${user.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('ستاپ با موفقیت حذف شد')
        fetchSetups(user.id)
      } else {
        alert(data.error || 'خطایی رخ داده است')
      }
    } catch (error) {
      console.error('Error deleting setup:', error)
      alert('خطا در حذف ستاپ')
    }
  }

  const startEdit = (setup) => {
    setEditingSetup(setup._id)
    setFormData({ title: setup.title, description: setup.description })
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingSetup(null)
    setFormData({ title: '', description: '' })
  }

  if (loading) {
    return <Loading text="در حال بارگذاری..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">ستاپ‌های معاملاتی شخصی</h1>
            </div>
            
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                داشبورد
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                پروفایل
              </Link>
              <Link href="/profile/setups" className="text-primary-600 font-semibold">
                ستاپ‌ها
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Add New Setup Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setEditingSetup(null)
              setFormData({ title: '', description: '' })
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {showAddForm ? '❌ لغو' : '➕ افزودن ستاپ جدید'}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">افزودن ستاپ جدید</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان ستاپ *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: Breakout Strategy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات کامل درباره این ستاپ..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ✅ ذخیره ستاپ
              </button>
            </div>
          </div>
        )}

        {/* Setups List */}
        <div className="space-y-4">
          {setups.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              <p className="text-lg mb-2">هیچ ستاپ شخصی‌ای ثبت نشده است</p>
              <p className="text-sm">با کلیک روی دکمه «افزودن ستاپ جدید» اولین ستاپ خود را ایجاد کنید</p>
            </div>
          ) : (
            setups.map((setup) => (
              <div key={setup._id} className="bg-white rounded-lg shadow-md p-6">
                {editingSetup === setup._id ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold mb-4">ویرایش ستاپ</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عنوان ستاپ *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        توضیحات
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdate(setup._id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        ✅ ذخیره تغییرات
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                      >
                        ❌ لغو
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{setup.title}</h3>
                        {setup.description && (
                          <p className="text-gray-600 mt-2">{setup.description}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        👤 شخصی
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEdit(setup)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(setup._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
