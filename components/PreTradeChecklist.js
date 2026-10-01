'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PreTradeChecklist({ userId, className = '' }) {
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
      const response = await fetch(
        `/api/checklists/status?userId=${userId}&date=${today}`,
      )
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
      const response = await fetch(
        `/api/checklists/status?userId=${userId}&date=${today}`,
        {
          method: 'DELETE',
        },
      )

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
      (item) =>
        item.checklistId === checklistId && item.itemIndex === itemIndex,
    )
  }

  const getTotalItems = () => {
    return checklists.reduce(
      (sum, checklist) => sum + (checklist.items?.length || 0),
      0,
    )
  }

  const getCheckedCount = () => {
    return status?.checkedItems?.length || 0
  }

  if (loading) {
    return (
      <div className={`h-9 rounded-lg bg-white shadow-sm ${className}`}>
        <div className="h-full animate-pulse rounded-lg bg-gray-100" />
      </div>
    )
  }

  if (checklists.length === 0) {
    return null
  }

  const totalItems = getTotalItems()
  const checkedCount = getCheckedCount()
  const progressPercentage =
    totalItems > 0 ? (checkedCount / totalItems) * 100 : 0
  const pct = Math.round(progressPercentage)
  const done = pct === 100

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`} dir="rtl">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-bold text-gray-800 shrink-0">چک لیست معامله</span>
        <span className="text-[11px] text-gray-500 shrink-0 tabular-nums">
          {checkedCount} از {totalItems}
        </span>
        <span className="h-1.5 min-w-[4.5rem] flex-1 overflow-hidden rounded-full bg-slate-200">
          <span
            className={`block h-full rounded-full transition-all duration-300 ${
              done ? 'bg-emerald-500' : 'bg-primary-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </span>
        <span
          className={`text-xs font-bold tabular-nums shrink-0 ${
            done ? 'text-emerald-700' : 'text-primary-700'
          }`}
        >
          {pct}٪
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="px-3 sm:px-6 pb-4 border-t border-gray-100">
          <div className="space-y-4 mt-4">
            {checklists.map((checklist) => (
              <div
                key={checklist._id}
                className="border-r-4 border-primary-500 pr-3"
              >
                <h4 className="font-semibold text-gray-800 mb-2">
                  {checklist.title}
                </h4>
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
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 shrink-0"
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
                    <p className="text-sm text-gray-400 pr-2">
                      هیچ آیتمی وجود ندارد
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2 sm:gap-3">
            <button
              type="button"
              onClick={resetChecklist}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              🔄 ریست چک‌لیست
            </button>
            <Link
              href="/profile/checklists"
              className="px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              ⚙️ مدیریت چک‌لیست‌ها
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
