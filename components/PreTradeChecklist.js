'use client'

import { useState, useEffect } from 'react'

export default function PreTradeChecklist({ userId }) {
  const [checklists, setChecklists] = useState([])
  const [status, setStatus] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchChecklists()
      fetchStatus()
    }
  }, [userId])

  const fetchChecklists = async () => {
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

  const fetchStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/checklists/status?userId=${userId}&date=${today}`)
      const data = await response.json()
      
      if (data.success) {
        setStatus(data.status)
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    }
  }

  const toggleItem = async (checklistId, itemIndex) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch('/api/checklists/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          date: today,
          checklistId,
          itemIndex,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus(data.status)
      }
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }

  const resetChecklist = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید چک‌لیست امروز را ریست کنید؟')) {
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/checklists/status?userId=${userId}&date=${today}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setStatus(data.status)
      }
    } catch (error) {
      console.error('Error resetting checklist:', error)
    }
  }

  const isItemChecked = (checklistId, itemIndex) => {
    if (!status || !status.checkedItems) return false
    return status.checkedItems.some(
      item => item.checklistId === checklistId && item.itemIndex === itemIndex
    )
  }

  const getTotalItems = () => {
    return checklists.reduce((sum, checklist) => sum + (checklist.items?.length || 0), 0)
  }

  const getCheckedCount = () => {
    return status?.checkedItems?.length || 0
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  if (checklists.length === 0) {
    return null
  }

  const totalItems = getTotalItems()
  const checkedCount = getCheckedCount()
  const progressPercentage = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0

  return (
    <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      {/* Header - Clickable to toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div className="text-right">
            <h3 className="text-lg font-bold text-gray-800">چک‌لیست قبل از معامله</h3>
            <p className="text-sm text-gray-600">
              {checkedCount} از {totalItems} مورد انجام شده
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress Circle */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercentage / 100)}`}
                className={`transition-all ${
                  progressPercentage === 100 ? 'text-green-500' : 'text-blue-500'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Content - Collapsible */}
      {isOpen && (
        <div className="px-6 pb-4 border-t border-gray-100">
          <div className="space-y-4 mt-4">
            {checklists.map((checklist) => (
              <div key={checklist._id} className="border-r-4 border-blue-500 pr-3">
                <h4 className="font-semibold text-gray-800 mb-2">{checklist.title}</h4>
                <div className="space-y-2">
                  {checklist.items && checklist.items.length > 0 ? (
                    checklist.items.map((item, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isItemChecked(checklist._id, index)}
                          onChange={() => toggleItem(checklist._id, index)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span
                          className={`text-sm ${
                            isItemChecked(checklist._id, index)
                              ? 'text-gray-400 line-through'
                              : 'text-gray-700'
                          }`}
                        >
                          {item.text}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 pr-2">هیچ آیتمی وجود ندارد</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={resetChecklist}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              🔄 ریست چک‌لیست
            </button>
            <a
              href="/profile/checklists"
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              ⚙️ مدیریت چک‌لیست‌ها
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
