'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Loading from '@/components/Loading'

export default function EditTradePage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [setups, setSetups] = useState([])
  const [selectedSetups, setSelectedSetups] = useState([])
  const [showAddSetup, setShowAddSetup] = useState(false)
  const [newSetup, setNewSetup] = useState({ title: '', description: '' })
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'buy',
    volume: '',
    openPrice: '',
    closePrice: '',
    stopLoss: '',
    takeProfit: '',
    openTime: '',
    closeTime: '',
    commission: '',
    swap: '',
    profit: '',
    notes: '',
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchTrade(parsedUser.id)
    fetchSetups(parsedUser.id)
  }, [router, params.id])

  const fetchSetups = async (userId) => {
    try {
      const response = await fetch(`/api/setups?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setSetups(data.setups || [])
      }
    } catch (error) {
      console.error('Error fetching setups:', error)
    }
  }

  const handleAddSetup = async () => {
    if (!newSetup.title.trim()) {
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
          title: newSetup.title,
          description: newSetup.description,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchSetups(user.id)
        setNewSetup({ title: '', description: '' })
        setShowAddSetup(false)
        alert('ستاپ با موفقیت اضافه شد')
      } else {
        alert(data.error || 'خطایی رخ داده است')
      }
    } catch (error) {
      console.error('Error adding setup:', error)
      alert('خطا در افزودن ستاپ')
    }
  }

  const toggleSetup = (setupId) => {
    setSelectedSetups(prev =>
      prev.includes(setupId)
        ? prev.filter(id => id !== setupId)
        : [...prev, setupId]
    )
  }

  const fetchTrade = async (userId) => {
    try {
      // Fetch specific trade by ID
      const response = await fetch(`/api/trades/${params.id}?userId=${userId}`)
      const data = await response.json()
      
      if (data.success && data.trade) {
        const trade = data.trade
        setFormData({
          symbol: trade.symbol || '',
          type: trade.type || 'buy',
          volume: trade.volume || '',
          openPrice: trade.openPrice || '',
          closePrice: trade.closePrice || '',
          stopLoss: trade.stopLoss || '',
          takeProfit: trade.takeProfit || '',
          openTime: trade.openTime ? new Date(trade.openTime).toISOString().slice(0, 16) : '',
          closeTime: trade.closeTime ? new Date(trade.closeTime).toISOString().slice(0, 16) : '',
          commission: trade.commission || '',
          swap: trade.swap || '',
          profit: trade.profit || '',
          notes: trade.notes || '',
        })
        setSelectedSetups(trade.setupIds?.map(s => s._id || s) || [])
      } else {
        alert('معامله یافت نشد')
        router.push('/dashboard/trades')
      }
    } catch (error) {
      console.error('Error fetching trade:', error)
      alert('خطا در بارگذاری معامله')
      router.push('/dashboard/trades')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/trades/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
          volume: parseFloat(formData.volume),
          openPrice: parseFloat(formData.openPrice),
          closePrice: parseFloat(formData.closePrice),
          stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
          takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
          commission: formData.commission ? parseFloat(formData.commission) : 0,
          swap: formData.swap ? parseFloat(formData.swap) : 0,
          profit: parseFloat(formData.profit),
          setupIds: selectedSetups,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('معامله با موفقیت به‌روزرسانی شد')
        router.push('/dashboard/trades')
      } else {
        alert(data.error || 'خطایی رخ داده است')
      }
    } catch (error) {
      console.error('Error updating trade:', error)
      alert('خطا در به‌روزرسانی معامله')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return <Loading text="در حال بارگذاری معامله..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/trades" 
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium hidden md:inline">بازگشت</span>
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl md:text-2xl font-bold">ویرایش معامله</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Symbol & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol <span className="text-red-500">*</span>
                </label>
                <Input
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  placeholder="US30_i"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
            </div>

            {/* Volume & Prices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="volume"
                  value={formData.volume}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Open Price <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  name="openPrice"
                  value={formData.openPrice}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Close Price <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  name="closePrice"
                  value={formData.closePrice}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  name="stopLoss"
                  value={formData.stopLoss}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Take Profit
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  name="takeProfit"
                  value={formData.takeProfit}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Open Time & Close Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Open Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="openTime"
                  value={formData.openTime}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Close Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="closeTime"
                  value={formData.closeTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Commission, Swap & Profit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="commission"
                  value={formData.commission}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Swap
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="swap"
                  value={formData.swap}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit/Loss <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="profit"
                  value={formData.profit}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="یادداشت‌های اضافی..."
              />
            </div>

            {/* Setups Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">ستاپ‌های معاملاتی</h3>
              
              {/* Add New Setup Button */}
              <button
                type="button"
                onClick={() => setShowAddSetup(!showAddSetup)}
                className="w-full px-4 py-2 mb-4 bg-green-50 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                {showAddSetup ? '❌ لغو' : '➕ افزودن ستاپ جدید'}
              </button>

              {/* Add Setup Form */}
              {showAddSetup && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                  <input
                    type="text"
                    value={newSetup.title}
                    onChange={(e) => setNewSetup({ ...newSetup, title: e.target.value })}
                    placeholder="عنوان ستاپ (مثال: Breakout Strategy)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                  <textarea
                    value={newSetup.description}
                    onChange={(e) => setNewSetup({ ...newSetup, description: e.target.value })}
                    placeholder="توضیحات ستاپ (اختیاری)"
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSetup}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    ✅ ذخیره ستاپ
                  </button>
                </div>
              )}

              {/* Select Setups */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  انتخاب ستاپ‌ها (چند گزینه‌ای):
                </label>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-60 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {setups.map((setup) => (
                      <button
                        key={setup._id}
                        type="button"
                        onClick={() => toggleSetup(setup._id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedSetups.includes(setup._id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {setup.type === 'standard' ? '⭐' : '👤'} {setup.title}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⭐ ستاپ‌های استاندارد | 👤 ستاپ‌های شخصی
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving} fullWidth>
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
              <Link href="/dashboard/trades" className="flex-1">
                <Button type="button" variant="ghost" fullWidth>
                  انصراف
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
