'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { UserName } from '@/components/VerifiedBadge'
import { formatDateTime } from '@/utils/dateHelpers'

export default function AdminTradesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    symbol: '',
    type: '',
    startDate: '',
    endDate: '',
  })

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
    fetchTrades(parsed.id, 1)
  }, [router])

  const fetchTrades = async (adminUserId, page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        adminUserId,
        page: String(page),
        limit: '25',
      })
      if (filters.symbol) params.set('symbol', filters.symbol)
      if (filters.type) params.set('type', filters.type)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const response = await fetch(`/api/admin/trades?${params}`)
      const data = await response.json()

      if (data.success) {
        setTrades(data.trades)
        setPagination(data.pagination)
      } else {
        alert(data.error || 'خطا در دریافت معاملات')
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
      alert('خطا در دریافت معاملات')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tradeId) => {
    if (!confirm('آیا از حذف این معامله مطمئن هستید؟')) return

    try {
      const response = await fetch('/api/admin/trades', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user.id, tradeId }),
      })
      const data = await response.json()
      if (data.success) {
        fetchTrades(user.id, pagination.page)
      } else {
        alert(data.error || 'خطا در حذف')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در حذف معامله')
    }
  }

  if (!user) {
    return <Loading text="در حال بارگذاری..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">مدیریت معاملات</h2>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} معامله</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6" dir="ltr">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input
              placeholder="Symbol (e.g. EURUSD)"
              value={filters.symbol}
              onChange={(e) => setFilters({ ...filters, symbol: e.target.value })}
            />
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg text-gray-900"
            >
              <option value="">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg text-gray-900"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg text-gray-900"
            />
            <Button onClick={() => fetchTrades(user.id, 1)}>اعمال فیلتر</Button>
          </div>
        </div>

        {loading ? (
          <Loading text="در حال بارگذاری معاملات..." />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden" dir="ltr">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">کاربر</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Close Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setups</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trades.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          معامله‌ای یافت نشد
                        </td>
                      </tr>
                    ) : (
                      trades.map((trade) => (
                        <tr key={trade._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <UserName
                              name={trade.userId?.publicName || '—'}
                              verified={trade.userId?.verified}
                              className="font-medium text-gray-900"
                              badgeClassName="w-3.5 h-3.5 text-blue-500"
                            />
                            <div className="text-xs text-gray-500">{trade.userId?.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{trade.symbol}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                              trade.type === 'buy'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {trade.type === 'buy' ? 'Buy' : 'Sell'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{trade.volume}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDateTime(trade.closeTime)}
                          </td>
                          <td className={`px-4 py-3 text-sm font-medium ${
                            trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${trade.profit?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {trade.setupIds?.length > 0 ? (
                                trade.setupIds.map((s) => (
                                  <span
                                    key={s._id}
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      s.type === 'standard'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {s.title}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDelete(trade._id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4 bg-white rounded-lg shadow p-4" dir="rtl">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchTrades(user.id, pagination.page - 1)}
                >
                  قبلی
                </Button>
                <span className="text-gray-700">
                  صفحه {pagination.page} از {pagination.pages}
                </span>
                <Button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchTrades(user.id, pagination.page + 1)}
                >
                  بعدی
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
