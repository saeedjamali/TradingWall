'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import { formatDate } from '@/utils/dateHelpers'

export default function DayTradesModal({ isOpen, onClose, date, trades, userId }) {
  const [setups, setSetups] = useState([])
  const [editingTradeId, setEditingTradeId] = useState(null)
  const [selectedSetups, setSelectedSetups] = useState([])
  const [showAddSetup, setShowAddSetup] = useState(false)
  const [newSetup, setNewSetup] = useState({ title: '', description: '' })

  useEffect(() => {
    if (isOpen && userId) {
      fetchSetups()
    }
  }, [isOpen, userId])

  const fetchSetups = async () => {
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
          userId,
          title: newSetup.title,
          description: newSetup.description,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchSetups()
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

  const startEditSetups = (trade) => {
    setEditingTradeId(trade._id)
    setSelectedSetups(trade.setupIds?.map(s => s._id || s) || [])
  }

  const toggleSetup = (setupId) => {
    setSelectedSetups(prev =>
      prev.includes(setupId)
        ? prev.filter(id => id !== setupId)
        : [...prev, setupId]
    )
  }

  const saveSetups = async (tradeId) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          setupIds: selectedSetups,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local trade data
        const tradeIndex = trades.findIndex(t => t._id === tradeId)
        if (tradeIndex !== -1) {
          trades[tradeIndex].setupIds = selectedSetups.map(id => 
            setups.find(s => s._id === id)
          ).filter(Boolean)
        }
        setEditingTradeId(null)
        alert('ستاپ‌ها با موفقیت ذخیره شدند')
      } else {
        alert(data.error || 'خطایی رخ داده است')
      }
    } catch (error) {
      console.error('Error saving setups:', error)
      alert('خطا در ذخیره ستاپ‌ها')
    }
  }

  if (!trades || trades.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="معاملات روز">
        <div className="text-center py-8 text-gray-500">
          هیچ معامله‌ای برای این روز وجود ندارد
        </div>
      </Modal>
    )
  }

  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0)
  const wins = trades.filter(t => t.profit > 0).length
  const winRate = ((wins / trades.length) * 100).toFixed(1)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`معاملات ${formatDate(date)}`}>
      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">تعداد معاملات</div>
            <div className="text-xl font-bold text-gray-800">{trades.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Win Rate</div>
            <div className="text-xl font-bold text-blue-600">{winRate}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">سود/زیان</div>
            <div className={`text-xl font-bold ${
              totalProfit > 0 ? 'text-green-600' : 
              totalProfit < 0 ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              ${totalProfit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Add Setup Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAddSetup(!showAddSetup)}
            className="w-full px-4 py-2 bg-green-50 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            {showAddSetup ? '❌ لغو' : '➕ افزودن ستاپ جدید'}
          </button>

          {/* Add Setup Form */}
          {showAddSetup && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
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
        </div>

        {/* Trades List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {trades.map((trade, index) => {
            const isWin = trade.profit > 0
            const duration = new Date(trade.closeTime) - new Date(trade.openTime)
            const durationMinutes = Math.floor(duration / 1000 / 60)
            const isEditing = editingTradeId === trade._id
            
            return (
              <div
                key={trade._id || index}
                className={`border rounded-lg p-3 ${
                  isWin ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg`}>
                      {trade.type === 'buy' ? '📈' : '📉'}
                    </span>
                    <span className="font-bold text-gray-800">{trade.symbol}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      trade.type === 'buy' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {trade.type.toUpperCase()}
                    </span>
                  </div>
                  <div className={`font-bold text-lg ${
                    isWin ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${trade.profit.toFixed(2)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                  <div>
                    <span className="font-medium">Open:</span> ${trade.openPrice.toFixed(5)}
                  </div>
                  <div>
                    <span className="font-medium">Close:</span> ${trade.closePrice.toFixed(5)}
                  </div>
                  <div>
                    <span className="font-medium">Volume:</span> {trade.volume}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {durationMinutes}m
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mb-2">
                  {new Date(trade.openTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} → {new Date(trade.closeTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>

                {/* Setups Section */}
                {!isEditing ? (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {trade.setupIds && trade.setupIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {trade.setupIds.map((setup) => (
                              <span
                                key={setup._id || setup}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                              >
                                {setup.title || setup}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">بدون ستاپ</span>
                        )}
                      </div>
                      <button
                        onClick={() => startEditSetups(trade)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors ml-2"
                      >
                        ✏️ ستاپ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs font-medium mb-2">انتخاب ستاپ‌ها (چند انتخابی):</div>
                    <div className="flex flex-wrap gap-2 mb-2 max-h-32 overflow-y-auto">
                      {setups.map((setup) => (
                        <button
                          key={setup._id}
                          type="button"
                          onClick={() => toggleSetup(setup._id)}
                          className={`px-3 py-1 rounded text-xs transition-colors ${
                            selectedSetups.includes(setup._id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {setup.type === 'standard' ? '⭐' : '👤'} {setup.title}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSetups(trade._id)}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        ✅ ذخیره
                      </button>
                      <button
                        onClick={() => setEditingTradeId(null)}
                        className="flex-1 px-3 py-1.5 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
                      >
                        ❌ لغو
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
