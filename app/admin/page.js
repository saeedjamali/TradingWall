'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import { UserName } from '@/components/VerifiedBadge'
import { formatDate, formatDateTime } from '@/utils/dateHelpers'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    verifiedUsers: 0,
    totalProfit: 0,
    adminUsers: 0,
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentTrades, setRecentTrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const tokenExpiry = localStorage.getItem('tokenExpiry')

    if (!userData || !tokenExpiry) {
      router.push('/auth/login')
      return
    }

    const now = new Date().getTime()
    if (now >= parseInt(tokenExpiry)) {
      localStorage.removeItem('user')
      localStorage.removeItem('tokenExpiry')
      router.push('/auth/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setUser(parsedUser)
    fetchAdminStats(parsedUser.id)
  }, [router])

  const fetchAdminStats = async (adminUserId) => {
    try {
      const response = await fetch(`/api/admin/stats?adminUserId=${adminUserId}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setRecentUsers(data.recentUsers || [])
        setRecentTrades(data.recentTrades || [])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !user) {
    return <Loading text="در حال بارگذاری پنل مدیریت..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <AdminStatCard title="کل کاربران" value={stats.totalUsers} icon="👥" color="blue" />
          <AdminStatCard title="کل معاملات" value={stats.totalTrades} icon="📊" color="green" />
          <AdminStatCard title="تیک آبی" value={stats.verifiedUsers} icon="✓" color="indigo" />
          <AdminStatCard
            title="مجموع سود"
            value={`$${(stats.totalProfit || 0).toFixed(0)}`}
            icon="💰"
            color="emerald"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/users" className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-transparent hover:border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
              <div>
                <h3 className="font-bold text-lg">مدیریت کاربران</h3>
                <p className="text-sm text-gray-600">مشاهده، تایید و تغییر نقش</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/trades" className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-transparent hover:border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">📊</div>
              <div>
                <h3 className="font-bold text-lg">مدیریت معاملات</h3>
                <p className="text-sm text-gray-600">لیست کل معاملات سیستم</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/symbols" className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-transparent hover:border-amber-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">📈</div>
              <div>
                <h3 className="font-bold text-lg">نمادهای معاملاتی</h3>
                <p className="text-sm text-gray-600">شاخص، نفت، کریپتو، فارکس...</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/blog" className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-transparent hover:border-emerald-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-2xl">✍️</div>
              <div>
                <h3 className="font-bold text-lg">بلاگ و مقالات</h3>
                <p className="text-sm text-gray-600">نوشتن مقاله، تگ، سئو و نظرات</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/messages" className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-transparent hover:border-sky-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center text-2xl">💬</div>
              <div>
                <h3 className="font-bold text-lg">نظرات و پیشنهادات</h3>
                <p className="text-sm text-gray-600">بازخورد کاربران و پاسخ‌دهی</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/setups" className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-transparent hover:border-purple-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">⚙️</div>
              <div>
                <h3 className="font-bold text-lg">ستاپ‌های استاندارد</h3>
                <p className="text-sm text-gray-600">جداول ثابت سیستم</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/demo-data" className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-transparent hover:border-rose-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center text-2xl">🧪</div>
              <div>
                <h3 className="font-bold text-lg">دیتای دمو</h3>
                <p className="text-sm text-gray-600">۱۰ تریدر + معاملات سالانه برای لیدربورد</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/logs" className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-transparent hover:border-slate-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">📋</div>
              <div>
                <h3 className="font-bold text-lg">لاگ و بازدید</h3>
                <p className="text-sm text-gray-600">صفحات، اکشن‌ها و فیلتر زمانی</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">کاربران اخیر</h2>
              <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
                مشاهده همه
              </Link>
            </div>
            {recentUsers.length === 0 ? (
              <p className="text-center py-6 text-gray-500">کاربری وجود ندارد</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentUsers.map((u) => (
                  <li key={u._id} className="py-3 flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <UserName
                        name={u.publicName}
                        verified={u.verified}
                        className="font-medium text-gray-900"
                        badgeClassName="w-4 h-4 text-blue-500"
                      />
                      <div className="text-xs text-gray-500" dir="ltr">{u.phone}</div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">{formatDate(u.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">معاملات اخیر</h2>
              <Link href="/admin/trades" className="text-sm text-blue-600 hover:underline">
                مشاهده همه
              </Link>
            </div>
            {recentTrades.length === 0 ? (
              <p className="text-center py-6 text-gray-500">معامله‌ای وجود ندارد</p>
            ) : (
              <ul className="divide-y divide-gray-100" dir="ltr">
                {recentTrades.map((t) => (
                  <li key={t._id} className="py-3 flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">
                        {t.symbol}{' '}
                        <span className={`text-xs ${t.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate inline-flex items-center gap-1">
                        <UserName
                          name={t.userId?.publicName || '—'}
                          verified={t.userId?.verified}
                          badgeClassName="w-3 h-3 text-blue-500"
                        />
                        <span>· {formatDateTime(t.closeTime)}</span>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold shrink-0 ${
                      t.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${t.profit?.toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminStatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-4 md:p-6 text-white shadow-md`}>
      <div className="flex justify-between items-start">
        <span className="text-2xl md:text-4xl">{icon}</span>
        <div className="text-right">
          <p className="text-xs md:text-sm opacity-90">{title}</p>
          <p className="text-xl md:text-3xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  )
}
