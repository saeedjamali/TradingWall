'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Loading from '@/components/Loading'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    verifiedUsers: 0,
    totalProfit: 0,
  })
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
    fetchAdminStats()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    router.push('/')
  }

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading text="در حال بارگذاری پنل مدیریت..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/">
                <div className="logo-badge">
                  <Image 
                    src="/icons/tradinggwall-icon.svg" 
                    alt="Trading Wall Logo" 
                    width={56} 
                    height={56}
                    className="w-12 h-12 md:w-14 md:h-14 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </div>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">پنل مدیریت</h1>
                <p className="text-purple-200 mt-1 tracking-tight trading-wall-logo">Trading Wall Admin Panel</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <Link href="/dashboard" className="text-white hover:text-purple-200">
                نمای کاربری
              </Link>
              <span>|</span>
              <span>{user?.publicName}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm mr-4"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AdminStatCard
            title="کل کاربران"
            value={stats.totalUsers}
            icon="👥"
            color="blue"
          />
          <AdminStatCard
            title="کل معاملات"
            value={stats.totalTrades}
            icon="📊"
            color="green"
          />
          <AdminStatCard
            title="کاربران تایید شده"
            value={stats.verifiedUsers}
            icon="✓"
            color="purple"
          />
          <AdminStatCard
            title="مجموع سود"
            value={`$${stats.totalProfit.toFixed(2)}`}
            icon="💰"
            color="yellow"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/users" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
              <div>
                <h3 className="font-bold text-lg">مدیریت کاربران</h3>
                <p className="text-sm text-gray-600">مشاهده و تایید کاربران</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/trades" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <h3 className="font-bold text-lg">مدیریت معاملات</h3>
                <p className="text-sm text-gray-600">مشاهده همه معاملات</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/setups" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                ⚙️
              </div>
              <div>
                <h3 className="font-bold text-lg">ستاپ‌های استاندارد</h3>
                <p className="text-sm text-gray-600">مدیریت ستاپ‌های پیش‌فرض</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">فعالیت‌های اخیر</h2>
          <div className="text-center py-8 text-gray-500">
            <p>در حال حاضر فعالیتی وجود ندارد</p>
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
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-6 text-white shadow-md`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-4xl">{icon}</span>
        <div className="text-right">
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  )
}
