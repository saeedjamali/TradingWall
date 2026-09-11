'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import { Term } from './Tooltip'

export default function PlanModal({ isOpen, onClose, date, userId, existingPlan, coveringPlan, onSave }) {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPeriodWarning, setShowPeriodWarning] = useState(false)
  const [formData, setFormData] = useState({
    period: 'daily',
    maxTrades: '',
    maxLoss: '',
    maxLossPercent: '',
    targetProfit: '',
    notes: '',
    mood: 'neutral',
    tradeImage: '',
  })

  useEffect(() => {
    if (existingPlan) {
      setFormData({
        period: existingPlan.period || 'daily',
        maxTrades: existingPlan.maxTrades || '',
        maxLoss: existingPlan.maxLoss || '',
        maxLossPercent: existingPlan.maxLossPercent || '',
        targetProfit: existingPlan.targetProfit || '',
        notes: existingPlan.notes || '',
        mood: existingPlan.mood || 'neutral',
        tradeImage: existingPlan.tradeImage || '',
      })
    } else {
      // Reset form for new plan
      setFormData({
        period: 'daily',
        maxTrades: '',
        maxLoss: '',
        maxLossPercent: '',
        targetProfit: '',
        notes: '',
        mood: 'neutral',
        tradeImage: '',
      })
    }
    setShowPeriodWarning(false)
  }, [existingPlan, isOpen])

  const handlePeriodChange = (newPeriod) => {
    setFormData({ ...formData, period: newPeriod })
    if (newPeriod !== 'daily') {
      setShowPeriodWarning(true)
    } else {
      setShowPeriodWarning(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = existingPlan 
        ? `/api/plans/${existingPlan._id}`
        : '/api/plans'
      
      const method = existingPlan ? 'PUT' : 'POST'
      
      // Clean up data - remove empty strings and convert to proper types
      const cleanedData = {
        userId,
        date: date.toISOString(),
        period: formData.period,
        maxTrades: formData.maxTrades ? parseInt(formData.maxTrades) : null,
        maxLoss: formData.maxLoss ? parseFloat(formData.maxLoss) : null,
        maxLossPercent: formData.maxLossPercent ? parseFloat(formData.maxLossPercent) : null,
        targetProfit: formData.targetProfit ? parseFloat(formData.targetProfit) : null,
        notes: formData.notes,
        mood: formData.mood,
        tradeImage: formData.tradeImage || null,
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        onSave(data.plan)
        onClose()
      } else {
        alert(data.error || 'خطایی رخ داده است')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('خطا در ذخیره پلن')
    } finally {
      setLoading(false)
    }
  }

  const moods = [
    { value: 'calm', label: 'آرام', emoji: '😌' },
    { value: 'stressed', label: 'استرس', emoji: '😰' },
    { value: 'confident', label: 'مطمئن', emoji: '😎' },
    { value: 'anxious', label: 'نگران', emoji: '😟' },
    { value: 'focused', label: 'متمرکز', emoji: '🎯' },
    { value: 'tired', label: 'خسته', emoji: '😴' },
    { value: 'neutral', label: 'عادی', emoji: '😐' },
  ]

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { validateImageFile } = await import('@/utils/uploadLimits')
    const check = validateImageFile(file)
    if (!check.ok) {
      alert(check.error)
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'plan')

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setFormData(prev => ({ ...prev, tradeImage: data.url }))
      } else {
        alert(data.error || 'خطا در آپلود تصویر')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('خطا در آپلود تصویر')
    } finally {
      setUploadingImage(false)
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const isWeekend = (date) => {
    const dayOfWeek = date.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  }

  const getDateRangeText = (date, period) => {
    if (period === 'daily') return formatDate(date)
    
    if (period === 'weekly') {
      const weekStart = new Date(date)
      const dayOfWeek = weekStart.getDay()
      weekStart.setDate(weekStart.getDate() - dayOfWeek)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    
    if (period === 'monthly') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Trading Plan - ${formatDate(date)}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Existing Daily Plan Info */}
        {existingPlan && existingPlan.period === 'daily' && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 flex items-start gap-2">
            <span className="text-xl">✏️</span>
            <div className="text-sm text-blue-800 flex-1">
              <strong>ویرایش پلن روزانه:</strong> در حال ویرایش پلن روزانه برای این روز هستید.
            </div>
          </div>
        )}
        
        {/* Weekly/Monthly Plan Covering Info */}
        {!existingPlan && coveringPlan && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-start gap-2">
            <span className="text-xl">📊</span>
            <div className="text-sm text-green-800 flex-1">
              <strong>اطلاعات:</strong> این روز تحت پوشش یک پلن {coveringPlan.period === 'weekly' ? 'هفتگی' : 'ماهانه'} است. شما می‌توانید یک پلن روزانه جداگانه برای این روز ایجاد کنید که اولویت دارد.
            </div>
          </div>
        )}
      
        {/* Weekend Warning */}
        {isWeekend(date) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div className="text-sm text-yellow-800">
              <strong>توجه:</strong> این روز آخر هفته است و بازار تعطیل می‌باشد.
            </div>
          </div>
        )}
        {/* Period Type - Full Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Term en="Period" fa="دوره زمانی" />
          </label>
          <select
            value={formData.period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-900"
          >
            <option value="daily">📅 Daily (روزانه) - فقط برای این روز</option>
            <option value="weekly">📊 Weekly (هفتگی) - برای کل هفته جاری</option>
            <option value="monthly">📈 Monthly (ماهانه) - برای کل ماه جاری</option>
          </select>
          
          {/* Period Info */}
          <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
            {formData.period === 'daily' && (
              <div>
                💡 <strong>روزانه:</strong> این پلن فقط برای روز انتخاب شده ({formatDate(date)}) اعمال می‌شود. اگر پلن هفتگی یا ماهانه وجود داشته باشد، این پلن روزانه اولویت دارد.
              </div>
            )}
            {formData.period === 'weekly' && (
              <div>
                💡 <strong>هفتگی:</strong> این پلن برای تمام روزهای هفته جاری اعمال می‌شود (به جز روزهایی که پلن روزانه دارند). پلن‌های روزانه موجود این هفته حذف خواهند شد.
              </div>
            )}
            {formData.period === 'monthly' && (
              <div>
                💡 <strong>ماهانه:</strong> این پلن برای تمام روزهای ماه جاری اعمال می‌شود (به جز روزهایی که پلن روزانه یا هفتگی دارند). پلن‌های روزانه و هفتگی موجود حذف خواهند شد.
              </div>
            )}
          </div>
        </div>

        {/* Warning for Weekly/Monthly */}
        {showPeriodWarning && (
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div className="text-sm text-orange-800 flex-1">
              <strong>توجه مهم:</strong>
              <ul className="mt-1 mr-4 list-disc space-y-1">
                {formData.period === 'weekly' && (
                  <>
                    <li>این پلن برای <strong>تمام روزهای هفته</strong> جاری اعمال می‌شود</li>
                    <li>پلن‌های <strong>روزانه موجود</strong> در این هفته حذف خواهند شد</li>
                    <li>در آینده می‌توانید برای روزهای خاص، پلن روزانه جداگانه تعریف کنید (بدون حذف پلن هفتگی)</li>
                  </>
                )}
                {formData.period === 'monthly' && (
                  <>
                    <li>این پلن برای <strong>تمام روزهای ماه</strong> جاری اعمال می‌شود</li>
                    <li>پلن‌های <strong>روزانه و هفتگی موجود</strong> در این ماه حذف خواهند شد</li>
                    <li>در آینده می‌توانید برای روزهای خاص، پلن روزانه یا هفتگی جداگانه تعریف کنید</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Grid Layout for compact form */}
        <div className="grid grid-cols-2 gap-3">

          {/* Max Trades */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Term en="Max Trades" fa="حداکثر معامله" />
            </label>
            <input
              type="number"
              value={formData.maxTrades}
              onChange={(e) => setFormData({ ...formData, maxTrades: e.target.value })}
              placeholder="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-900"
            />
          </div>

          {/* Max Loss $ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Term en="Max Loss ($)" fa="حد ضرر ($)" />
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.maxLoss}
              onChange={(e) => setFormData({ ...formData, maxLoss: e.target.value })}
              placeholder="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-900"
            />
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              حداکثر ضرر مجاز هر معامله به دلار (مثلاً ۱۰$)
            </p>
          </div>

          {/* Max Loss % */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Term en="Max Loss (%)" fa="حد ضرر (%)" />
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.maxLossPercent}
              onChange={(e) => setFormData({ ...formData, maxLossPercent: e.target.value })}
              placeholder="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-900"
            />
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              حداکثر ضرر مجاز نسبت به سرمایه (مثلاً ۲٪)
            </p>
          </div>

          {/* Target Profit */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Term en="Target Profit ($)" fa="هدف سود ($)" />
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.targetProfit}
              onChange={(e) => setFormData({ ...formData, targetProfit: e.target.value })}
              placeholder="200"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Mood */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Term en="Mood" fa="حالت روحی" />
          </label>
          <div className="grid grid-cols-7 gap-1">
            {moods.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={() => setFormData({ ...formData, mood: mood.value })}
                title={mood.label}
                className={`
                  p-2 rounded-lg border-2 transition-all text-center
                  ${formData.mood === mood.value 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-xl">{mood.emoji}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Term en="Notes / Journal" fa="یادداشت / ژورنال" />
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-900"
            placeholder="یادداشت های شما درباره این روز معاملاتی..."
          />
        </div>

        {/* Trade Image - Compact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Term en="Trade Screenshot" fa="تصویر معامله" />
            <span className="text-xs text-gray-500 font-normal mr-1">(حداکثر ۳ مگابایت)</span>
          </label>
          <div className="space-y-2">
            {!formData.tradeImage ? (
              <div className="flex gap-2">
                {/* File Upload Button */}
                <label className="flex-1 flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <div className="text-center">
                    <span className="text-sm text-gray-600">
                      {uploadingImage ? '⏳ آپلود...' : '📤 آپلود'}
                    </span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
                
                {/* URL Input */}
                <input
                  type="text"
                  value={formData.tradeImage}
                  onChange={(e) => setFormData({ ...formData, tradeImage: e.target.value })}
                  placeholder="یا لینک تصویر"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-900"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-2 bg-gray-50 relative">
                <img 
                  src={formData.tradeImage} 
                  alt="Trade preview" 
                  className="max-h-32 mx-auto rounded"
                  onError={(e) => {
                    e.target.src = ''
                    e.target.alt = 'خطا در بارگذاری'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tradeImage: '' })}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 text-xs"
                  title="حذف تصویر"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm bg-white text-gray-700"
          >
            لغو
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
          >
            {loading ? '⏳ در حال ذخیره...' : existingPlan ? '✓ به‌روزرسانی' : '✓ ذخیره پلن'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
