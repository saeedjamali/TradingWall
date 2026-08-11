'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { CATEGORY_LABELS } from '@/utils/symbolSeed'

// Client-safe category list (mirrors model enum)
const CATEGORIES = [
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

const emptyForm = {
  code: '',
  name: '',
  nameFa: '',
  category: 'indices',
  isActive: true,
  sortOrder: 0,
}

export default function AdminSymbolsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [symbols, setSymbols] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')

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
    fetchSymbols(parsed.id)
  }, [router])

  const fetchSymbols = async (adminUserId, opts = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ adminUserId })
      const cat = opts.category ?? filterCategory
      const q = opts.q ?? search
      if (cat) params.set('category', cat)
      if (q) params.set('q', q)

      const response = await fetch(`/api/admin/symbols?${params}`)
      const data = await response.json()
      if (data.success) {
        setSymbols(data.symbols)
      } else {
        alert(data.error || 'خطا در دریافت نمادها')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در دریافت نمادها')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (symbol) => {
    setFormData({
      code: symbol.code,
      name: symbol.name,
      nameFa: symbol.nameFa || '',
      category: symbol.category,
      isActive: symbol.isActive !== false,
      sortOrder: symbol.sortOrder || 0,
    })
    setEditingId(symbol._id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      alert('کد و نام نماد الزامی است')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/symbols', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          symbolId: editingId || undefined,
          ...formData,
          sortOrder: Number(formData.sortOrder) || 0,
        }),
      })
      const data = await response.json()
      if (data.success) {
        resetForm()
        fetchSymbols(user.id)
      } else {
        alert(data.error || 'خطا در ذخیره')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در ذخیره نماد')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (symbolId) => {
    if (!confirm('این نماد حذف شود؟')) return
    try {
      const response = await fetch('/api/admin/symbols', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user.id, symbolId }),
      })
      const data = await response.json()
      if (data.success) {
        fetchSymbols(user.id)
      } else {
        alert(data.error || 'خطا در حذف')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در حذف نماد')
    }
  }

  const handleToggleActive = async (symbol) => {
    try {
      const response = await fetch('/api/admin/symbols', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          symbolId: symbol._id,
          isActive: !symbol.isActive,
        }),
      })
      const data = await response.json()
      if (data.success) fetchSymbols(user.id)
      else alert(data.error || 'خطا')
    } catch (error) {
      alert('خطا در تغییر وضعیت')
    }
  }

  const handleSeed = async () => {
    if (!confirm('نمادهای پیش‌فرض (شاخص، نفت، کریپتو، فارکس و ...) اضافه شوند؟ موارد تکراری رد می‌شوند.')) {
      return
    }
    setSeeding(true)
    try {
      const response = await fetch('/api/admin/symbols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user.id, action: 'seed', onlyIfEmpty: false }),
      })
      const data = await response.json()
      if (data.success) {
        alert(data.message || 'انجام شد')
        fetchSymbols(user.id)
      } else {
        alert(data.error || 'خطا در تغذیه')
      }
    } catch (error) {
      alert('خطا در تغذیه نمادها')
    } finally {
      setSeeding(false)
    }
  }

  if (!user) {
    return <Loading text="در حال بارگذاری..." />
  }

  const groupedCount = symbols.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">نمادهای معاملاتی</h2>
            <p className="text-gray-500 text-sm mt-1">
              تعریف نمادهایی که کاربران هنگام ثبت معامله می‌توانند انتخاب کنند
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSeed} disabled={seeding}>
              {seeding ? 'در حال تغذیه...' : '🌱 تغذیه پیش‌فرض'}
            </Button>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>➕ افزودن نماد</Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1">جستجو</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="کد یا نام..."
            />
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs text-gray-500 mb-1">دسته</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">همه دسته‌ها</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => fetchSymbols(user.id)}
            variant="outline"
          >
            فیلتر
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-bold text-lg mb-4">
              {editingId ? 'ویرایش نماد' : 'افزودن نماد'}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
              <Input
                label="کد نماد *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="US30"
                disabled={!!editingId}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
                  ))}
                </select>
              </div>
              <Input
                label="نام انگلیسی *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dow Jones 30"
              />
              <Input
                label="نام فارسی"
                value={formData.nameFa}
                onChange={(e) => setFormData({ ...formData, nameFa: e.target.value })}
                placeholder="داوجونز ۳۰"
              />
              <Input
                label="ترتیب نمایش"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm mt-8">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                فعال (قابل انتخاب در فرم معامله)
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'در حال ذخیره...' : 'ذخیره'}
              </Button>
              <Button variant="outline" onClick={resetForm}>انصراف</Button>
            </div>
          </div>
        )}

        {loading ? (
          <Loading text="در حال بارگذاری نمادها..." />
        ) : symbols.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">📈</p>
            <p className="mb-4">هنوز نمادی تعریف نشده است</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button onClick={handleSeed} disabled={seeding}>تغذیه پیش‌فرض</Button>
              <Button variant="outline" onClick={() => setShowForm(true)}>افزودن دستی</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-600">
              <span className="font-medium">{symbols.length} نماد</span>
              {Object.entries(groupedCount).map(([cat, n]) => (
                <span key={cat} className="px-2 py-0.5 bg-white border rounded-full">
                  {CATEGORY_LABELS[cat] || cat}: {n}
                </span>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-right px-4 py-3 font-medium">کد</th>
                      <th className="text-right px-4 py-3 font-medium">نام</th>
                      <th className="text-right px-4 py-3 font-medium">دسته</th>
                      <th className="text-center px-4 py-3 font-medium">وضعیت</th>
                      <th className="text-center px-4 py-3 font-medium">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {symbols.map((s) => (
                      <tr key={s._id} className={!s.isActive ? 'bg-gray-50 opacity-70' : ''}>
                        <td className="px-4 py-3 font-mono font-semibold" dir="ltr">{s.code}</td>
                        <td className="px-4 py-3">
                          <div>{s.nameFa || s.name}</div>
                          {s.nameFa && <div className="text-xs text-gray-400">{s.name}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {CATEGORY_LABELS[s.category] || s.category}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(s)}
                            className={`text-xs px-2 py-1 rounded-full ${
                              s.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {s.isActive ? 'فعال' : 'غیرفعال'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(s)}
                            className="px-2 py-1 text-blue-700 hover:bg-blue-50 rounded ml-1"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="px-2 py-1 text-red-700 hover:bg-red-50 rounded"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
