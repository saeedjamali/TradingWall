'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'

export default function ChecklistsManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [checklists, setChecklists] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingChecklist, setEditingChecklist] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    items: [''],
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchChecklists(parsedUser.id)
  }, [router])

  const fetchChecklists = async (userId) => {
    try {
      const response = await fetch(`/api/checklists?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setChecklists(data.checklists || [])
      }
    } catch (error) {
      console.error('Error fetching checklists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, ''],
    })
  }

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      items: newItems.length > 0 ? newItems : [''],
    })
  }

  const handleItemChange = (index, value) => {
    const newItems = [...formData.items]
    newItems[index] = value
    setFormData({
      ...formData,
      items: newItems,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      alert('لطفا عنوان چک‌لیست را وارد کنید')
      return
    }

    const validItems = formData.items
      .filter(item => item.trim() !== '')
      .map((text, index) => ({ text, order: index }))

    if (validItems.length === 0) {
      alert('لطفا حداقل یک آیتم اضافه کنید')
      return
    }

    try {
      const url = editingChecklist
        ? `/api/checklists/${editingChecklist._id}`
        : '/api/checklists'
      
      const method = editingChecklist ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: formData.title,
          items: validItems,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchChecklists(user.id)
        setFormData({ title: '', items: [''] })
        setEditingChecklist(null)
        setShowAddForm(false)
        alert(editingChecklist ? 'چک‌لیست با موفقیت به‌روزرسانی شد' : 'چک‌لیست با موفقیت اضافه شد')
      } else {
        alert(data.error || 'خطایی رخ داده است')
      }
    } catch (error) {
      console.error('Error saving checklist:', error)
      alert('خطا در ذخیره چک‌لیست')
    }
  }

  const handleEdit = (checklist) => {
    setEditingChecklist(checklist)
    setFormData({
      title: checklist.title,
      items: checklist.items.map(item => item.text),
    })
    setShowAddForm(true)
  }

  const handleDelete = async (checklistId) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این چک‌لیست را حذف کنید؟')) {
      return
    }

    try {
      const response = await fetch(`/api/checklists/${checklistId}?userId=${user.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchChecklists(user.id)
        alert('چک‌لیست با موفقیت حذف شد')
      } else {
        alert(data.error || 'خطایی رخ داده است')
      }
    } catch (error) {
      console.error('Error deleting checklist:', error)
      alert('خطا در حذف چک‌لیست')
    }
  }

  const handleCancelEdit = () => {
    setEditingChecklist(null)
    setFormData({ title: '', items: [''] })
    setShowAddForm(false)
  }

  if (loading) {
    return <Loading text="در حال بارگذاری..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium hidden md:inline">بازگشت</span>
              </Link>
              <span className="text-gray-300 hidden md:inline">|</span>
              <h1 className="text-xl md:text-2xl font-bold">مدیریت چک‌لیست‌ها</h1>
            </div>
            
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                ➕ افزودن چک‌لیست جدید
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">
              {editingChecklist ? 'ویرایش چک‌لیست' : 'افزودن چک‌لیست جدید'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان چک‌لیست <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: بررسی‌های قبل از معامله"
                  required
                />
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  آیتم‌های چک‌لیست <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        placeholder={`آیتم ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="mt-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  ➕ افزودن آیتم
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" fullWidth>
                  {editingChecklist ? 'به‌روزرسانی' : 'ذخیره'} چک‌لیست
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancelEdit} fullWidth>
                  انصراف
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Checklists List */}
        {checklists.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12">
            <EmptyState
              icon={<span className="text-6xl">✅</span>}
              title="هیچ چک‌لیستی وجود ندارد"
              description="برای شروع، یک چک‌لیست جدید ایجاد کنید."
              action={
                !showAddForm && (
                  <Button onClick={() => setShowAddForm(true)}>
                    ➕ افزودن چک‌لیست
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checklists.map((checklist) => (
              <div
                key={checklist._id}
                className="bg-white rounded-lg shadow-md p-6 border-r-4 border-blue-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">{checklist.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(checklist)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(checklist._id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {checklist.items && checklist.items.length > 0 ? (
                    checklist.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 mt-0.5">✓</span>
                        <span>{item.text}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">هیچ آیتمی وجود ندارد</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  {checklist.items?.length || 0} آیتم
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
