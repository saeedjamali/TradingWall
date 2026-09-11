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
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
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
  const progressPercentage =
    totalItems > 0 ? (checkedCount / totalItems) * 100 : 0
  const pct = Math.round(progressPercentage)
  const done = pct === 100

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span className="text-xl sm:text-2xl shrink-0">✅</span>
          <div className="text-right min-w-0">
            <h3 className="text-sm sm:text-lg font-bold text-gray-800 truncate">
              چک‌لیست قبل از معامله
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              {checkedCount} از {totalItems} مورد انجام شده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className={`flex items-center gap-2 rounded-2xl px-2.5 py-1.5 ${
              done
                ? 'bg-emerald-50 ring-1 ring-emerald-200'
                : 'bg-slate-50 ring-1 ring-slate-200'
            }`}
          >
            {done ? (
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            ) : null}
            <div className="flex w-[3.75rem] sm:w-[5.25rem] flex-col items-stretch gap-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[10px] font-medium text-slate-500 tabular-nums">
                  {checkedCount}/{totalItems}
                </span>
                <span
                  className={`text-sm sm:text-base font-black tabular-nums leading-none ${
                    done ? 'text-emerald-700' : 'text-primary-700'
                  }`}
                >
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    done
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-l from-primary-500 to-sky-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform shrink-0 ${
              isOpen ? 'rotate-180' : ''
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
