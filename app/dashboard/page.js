'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import PlanModal from '@/components/PlanModal'
import MonthlyChart from '@/components/MonthlyChart'
import DayTradesModal from '@/components/DayTradesModal'
import PreTradeChecklist from '@/components/PreTradeChecklist'
import FileUploadCard from '@/components/FileUploadCard'
import { checkPlanCompliance, getPlanForDate } from '@/utils/planCompliance'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthTrades, setMonthTrades] = useState([])
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    // Check authentication and token expiry
    const userData = localStorage.getItem('user')
    const tokenExpiry = localStorage.getItem('tokenExpiry')
    
    if (!userData || !tokenExpiry) {
      router.push('/auth/login')
      return
    }
    
    const now = new Date().getTime()
    if (now >= parseInt(tokenExpiry)) {
      // Token expired
      localStorage.removeItem('user')
      localStorage.removeItem('tokenExpiry')
      router.push('/auth/login')
      return
    }
    
    setUser(JSON.parse(userData))
    fetchStats(JSON.parse(userData).id)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    router.push('/')
  }

  useEffect(() => {
    if (user) {
      fetchMonthTrades(user.id)
    }
  }, [currentMonth, user])

  const fetchStats = async (userId) => {
    try {
      const response = await fetch(`/api/trades/stats?userId=${userId}`)
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

  const fetchMonthTrades = async (userId) => {
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      const response = await fetch(
        `/api/trades?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=1000`
      )
      const data = await response.json()
      
      if (data.success) {
        setMonthTrades(data.trades || [])
      }
    } catch (error) {
      console.error('Error fetching month trades:', error)
    }
  }

  const handleExportCalendar = async () => {
    setIsExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      
      // Get calendar and chart elements
      const calendarElement = document.querySelector('.calendar-export-section')
      
      if (calendarElement) {
        const canvas = await html2canvas(calendarElement, {
          backgroundColor: '#f9fafb',
          scale: 2,
          logging: false,
          useCORS: true
        })
        
        // Download as image
        const link = document.createElement('a')
        const monthName = monthNames[currentMonth.getMonth()]
        const year = currentMonth.getFullYear()
        link.download = `trading-calendar-${monthName}-${year}.png`
        link.href = canvas.toDataURL()
        link.click()
      }
    } catch (error) {
      console.error('Error exporting calendar:', error)
      alert('خطا در دانلود تصویر')
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return <Loading text="در حال بارگذاری داشبورد..." />
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="logo-badge-light">
                  <Image 
                    src="/icons/tradinggwall-icon.svg" 
                    alt="Trading Wall Logo" 
                    width={56} 
                    height={56}
                    className="w-10 h-10 md:w-12 md:h-12"
                  />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight trading-wall-logo">Trading Wall</h1>
              </Link>
              <span className="text-gray-500">|</span>
              <span className="text-gray-700">{user?.publicName}</span>
            </div>
            
            <nav className="flex gap-4 items-center">
              <Link href="/dashboard" className="text-primary-600 font-semibold">
                دیوار معاملاتی
              </Link>
              <Link href="/dashboard/trades" className="text-gray-600 hover:text-gray-900">
                لیست معاملات
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                پروفایل
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                خروج
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="تعداد معاملات"
            value={stats?.totalTrades || 0}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="وین ریت"
            value={stats ? `${stats.winRate}%` : '0%'}
            icon="🎯"
            color="green"
          />
          <StatCard
            title="سود/زیان کل"
            value={stats ? `$${stats.totalProfitLoss.toFixed(2)}` : '$0'}
            icon="💰"
            color={stats && stats.totalProfitLoss >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="میانگین سود"
            value={stats ? `$${stats.averageProfit.toFixed(2)}` : '$0'}
            icon="📈"
            color="purple"
          />
        </div>

        {/* Calendar and Chart Export Section */}
        <div className="calendar-export-section">
        
        {/* Calendar Header */}
        {/* Pre-Trade Checklist */}
        {user && <PreTradeChecklist userId={user.id} />}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Title - Centered */}
          <div className="text-center mb-6 relative">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-4xl">📊</span>
              <h2 className="text-3xl font-bold text-gray-800">Trading Calendar</h2>
            </div>
            <p className="text-sm text-gray-500">تقویم معاملاتی</p>
            
            {/* Export Button */}
            <button
              onClick={handleExportCalendar}
              disabled={isExporting}
              className="absolute left-0 top-0 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="دانلود تصویر تقویم و نمودار"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">{isExporting ? 'در حال آماده‌سازی...' : 'Export Image'}</span>
            </button>
          </div>
          
          {/* Month Navigation - Centered */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              title="ماه بعد"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div className="px-8 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-300 rounded-lg min-w-[220px] text-center">
              <div className="text-2xl font-bold text-primary-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
            </div>
            
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              title="ماه قبل"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-300 rounded"></div>
              <span>Profit Day (روز سودده)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
              <span>Loss Day (روز ضررده)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></div>
              <span>Break-even (بدون سود/ضرر)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
              <span>No Trades (بدون معامله)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Weekend (تعطیل)</span>
            </div>
            <span className="text-gray-400">|</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 rounded"></div>
              <span>✓ Disciplined (با پلن)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-orange-400 rounded"></div>
              <span>⚠ Undisciplined (بدون پلن)</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <TradingCalendar 
            currentMonth={currentMonth}
            userId={user?.id}
            monthTrades={monthTrades}
          />
        </div>

        {/* Monthly Performance Chart */}
        <div className="mb-8">
          <MonthlyChart 
            trades={monthTrades}
            currentMonth={currentMonth}
          />
        </div>
        
        </div>
        {/* End Export Section */}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Compact File Upload */}
          {user && <FileUploadCard userId={user.id} compact={true} onUploadSuccess={() => fetchMonthTrades(user.id)} />}
          
          <QuickActionCard
            title="Add New Trade"
            description="ثبت معامله به صورت دستی"
            icon="➕"
            href="/dashboard/trades/new"
          />
          <QuickActionCard
            title="Upload Page"
            description="صفحه کامل آپلود"
            icon="📤"
            href="/dashboard/trades/upload"
          />
          <QuickActionCard
            title="View All Trades"
            description="مشاهده لیست کامل معاملات"
            icon="📊"
            href="/dashboard/trades"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  }

  const tooltips = {
    'تعداد معاملات': 'Total Trades',
    'وین ریت': 'Win Rate - درصد معاملات سودده',
    'سود/زیان کل': 'Total Profit/Loss',
    'میانگین سود': 'Average Profit per Trade'
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-6 text-white shadow-md`} title={tooltips[title]}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-3xl">{icon}</span>
        <div className="text-right">
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  )
}

function TradingCalendar({ currentMonth, userId, monthTrades = [] }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [coveringPlan, setCoveringPlan] = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showTradesModal, setShowTradesModal] = useState(false)
  const [selectedDayTrades, setSelectedDayTrades] = useState([])

  useEffect(() => {
    fetchMonthData()
  }, [currentMonth, userId])

  const fetchMonthData = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      // Fetch plans for the month
      const plansResponse = await fetch(
        `/api/plans?userId=${userId}`
      )
      const plansData = await plansResponse.json()
      
      if (plansData.success) {
        setPlans(plansData.plans || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleDayClick = (date, dayTrades) => {
    // Don't allow plan creation for weekends
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    if (isWeekend) {
      return // Don't open modal for weekends
    }
    
    setSelectedDate(date)
    
    // Only look for daily plan for this specific date
    const dailyPlan = plans.find(plan => {
      const planDate = new Date(plan.date)
      return planDate.getDate() === date.getDate() &&
             planDate.getMonth() === date.getMonth() &&
             planDate.getFullYear() === date.getFullYear() &&
             plan.period === 'daily'
    })
    
    // Check if there's a weekly/monthly plan covering this date (for info only)
    let coveringWeeklyMonthly = null
    
    if (!dailyPlan) {
      // Check for weekly plan
      coveringWeeklyMonthly = plans.find(plan => {
        if (plan.period !== 'weekly') return false
        
        const planDate = new Date(plan.date)
        const weekStart = new Date(planDate)
        const dayOfWeek = weekStart.getDay()
        weekStart.setDate(weekStart.getDate() - dayOfWeek)
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        return date >= weekStart && date <= weekEnd
      })
      
      // Check for monthly plan if no weekly
      if (!coveringWeeklyMonthly) {
        coveringWeeklyMonthly = plans.find(plan => {
          if (plan.period !== 'monthly') return false
          const planDate = new Date(plan.date)
          return planDate.getMonth() === date.getMonth() &&
                 planDate.getFullYear() === date.getFullYear()
        })
      }
    }
    
    setSelectedPlan(dailyPlan || null)
    setCoveringPlan(coveringWeeklyMonthly || null)
    setShowPlanModal(true)
  }

  const handlePlanSave = (savedPlan) => {
    // Refetch all data to ensure we have the latest plans
    // This is important because creating a weekly/monthly plan may delete daily plans
    fetchMonthData()
  }

  const handleViewTrades = (date, dayTrades, e) => {
    e.stopPropagation() // Prevent opening plan modal
    setSelectedDate(date)
    setSelectedDayTrades(dayTrades)
    setShowTradesModal(true)
  }

  if (loading) {
    return <Loading text="در حال بارگذاری تقویم..." />
  }

  // Generate calendar days
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Create array of days with empty cells for proper alignment
  const calendarDays = []
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Calculate weekly summaries
  const weeks = []
  let currentWeek = []
  
  calendarDays.forEach((day, index) => {
    currentWeek.push(day)
    
    if ((index + 1) % 7 === 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })
  
  // Add remaining days as last week (pad with nulls to make it 7 days)
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  // Calculate month summary
  const monthProfit = (monthTrades || []).reduce((sum, trade) => sum + trade.profit, 0)
  const monthWins = (monthTrades || []).filter(t => t.profit > 0).length
  const monthWinRate = (monthTrades || []).length > 0 ? ((monthWins / (monthTrades || []).length) * 100).toFixed(1) : 0
  const hasMonthTrades = (monthTrades || []).length > 0
  const isMonthProfit = hasMonthTrades && monthProfit > 0
  const isMonthLoss = hasMonthTrades && monthProfit < 0
  const isMonthBreakEven = hasMonthTrades && monthProfit === 0
  
  // Calculate compliance stats for month
  let monthCompliantTrades = 0
  let monthUndisciplinedTrades = 0
  let monthNoPlanTrades = 0
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue // Skip weekends
    
    const dayTrades = (monthTrades || []).filter(trade => {
      const tradeDate = new Date(trade.closeTime)
      return tradeDate.getDate() === day &&
             tradeDate.getMonth() === currentMonth.getMonth() &&
             tradeDate.getFullYear() === currentMonth.getFullYear()
    })
    
    if (dayTrades.length === 0) continue
    
    // Find plan for this day
    const dayPlan = getPlanForDate(plans, date)
    
    // Check compliance
    const compliance = checkPlanCompliance(dayTrades, dayPlan)
    monthCompliantTrades += compliance.compliant.length
    monthUndisciplinedTrades += compliance.undisciplined.length
    monthNoPlanTrades += compliance.noPlan.length
  }
  
  return (
    <div dir="ltr">
      {/* Week days header + Weekly Summary column */}
      <div className="grid grid-cols-8 gap-2 mb-2">
        {weekDays.map((day, idx) => (
          <div 
            key={idx} 
            className={`text-center font-bold py-2 ${
              day === 'Sat' || day === 'Sun' 
                ? 'text-red-500' 
                : 'text-gray-600'
            }`}
          >
            {day}
            {(day === 'Sat' || day === 'Sun') && (
              <span className="text-xs block" title="Market Closed">🔒</span>
            )}
          </div>
        ))}
        <div className="text-center font-bold text-primary-600 py-2">
          Week Total
        </div>
      </div>
      
      {/* Calendar weeks with weekly summary */}
      {weeks.map((week, weekIndex) => (
        <div key={`week-${weekIndex}`} className="grid grid-cols-8 gap-2 mb-2">
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <div key={`empty-${weekIndex}-${dayIndex}`} className="min-h-[100px]"></div>
            }
            
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            
            const dayTrades = (monthTrades || []).filter(trade => {
              const tradeDate = new Date(trade.closeTime)
              return tradeDate.getDate() === day &&
                     tradeDate.getMonth() === currentMonth.getMonth() &&
                     tradeDate.getFullYear() === currentMonth.getFullYear()
            })
            
            const dayProfit = dayTrades.reduce((sum, trade) => sum + trade.profit, 0)
            const dayWins = dayTrades.filter(t => t.profit > 0).length
            const dayWinRate = dayTrades.length > 0 ? ((dayWins / dayTrades.length) * 100).toFixed(0) : 0
            const hasTrades = dayTrades.length > 0
            const isProfit = hasTrades && dayProfit > 0
            const isLoss = hasTrades && dayProfit < 0
            const isBreakEven = hasTrades && dayProfit === 0
            
            // Find plan for this day (check daily, weekly, monthly)
            let dayPlan = null
            
            // Check for daily plan
            dayPlan = plans.find(plan => {
              const planDate = new Date(plan.date)
              return planDate.getDate() === day &&
                     planDate.getMonth() === currentMonth.getMonth() &&
                     planDate.getFullYear() === currentMonth.getFullYear() &&
                     plan.period === 'daily'
            })
            
            // Check for weekly plan if no daily
            if (!dayPlan) {
              dayPlan = plans.find(plan => {
                if (plan.period !== 'weekly') return false
                
                const planDate = new Date(plan.date)
                const weekStart = new Date(planDate)
                const dayOfWeek = weekStart.getDay()
                weekStart.setDate(weekStart.getDate() - dayOfWeek)
                weekStart.setHours(0, 0, 0, 0)
                
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekEnd.getDate() + 6)
                
                return date >= weekStart && date <= weekEnd
              })
            }
            
            // Check for monthly plan if no daily or weekly
            if (!dayPlan) {
              dayPlan = plans.find(plan => {
                if (plan.period !== 'monthly') return false
                const planDate = new Date(plan.date)
                return planDate.getMonth() === currentMonth.getMonth() &&
                       planDate.getFullYear() === currentMonth.getFullYear()
              })
            }
            
            const planType = dayPlan ? dayPlan.period : null
            
            // Check plan compliance for each trade
            const complianceResult = checkPlanCompliance(dayTrades, dayPlan)
            const compliantCount = complianceResult.compliant.length
            const undisciplinedCount = complianceResult.undisciplined.length
            const noPlanCount = complianceResult.noPlan.length
            
            // Day is disciplined if has plan and all trades comply
            // Day is undisciplined if has plan but some trades violate, OR has trades but no plan
            const hasPlan = !!dayPlan
            const isDisciplined = hasTrades && hasPlan && undisciplinedCount === 0
            const isUndisciplined = (hasTrades && hasPlan && undisciplinedCount > 0) || (hasTrades && !hasPlan && !isWeekend)
            
            return (
              <div
                key={`day-${day}`}
                onClick={() => handleDayClick(date, dayTrades)}
                className={`
                  border rounded-lg p-3 min-h-[120px] transition-all relative flex flex-col
                  ${isWeekend ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
                  ${isWeekend ? 'bg-gray-100 border-gray-300 opacity-75' : ''}
                  ${!isWeekend && isProfit ? 'bg-green-50 border-green-300 hover:bg-green-100' : ''}
                  ${!isWeekend && isLoss ? 'bg-red-50 border-red-300 hover:bg-red-100' : ''}
                  ${!isWeekend && isBreakEven ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100' : ''}
                  ${!isWeekend && !hasTrades ? 'bg-white border-gray-200 hover:bg-gray-50' : ''}
                  ${isUndisciplined ? 'ring-2 ring-orange-400' : ''}
                  ${isDisciplined ? 'ring-2 ring-blue-400' : ''}
                `}
              >
                {/* Weekend indicator */}
                {isWeekend && (
                  <div className="absolute top-1 left-1 text-red-500" title="Market Closed">
                    🔒
                  </div>
                )}
                
                {/* Discipline indicator */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {isDisciplined && (
                    <div 
                      className="text-lg" 
                      title="Disciplined Day - با پلن معاملاتی"
                    >
                      ✓
                    </div>
                  )}
                  {isUndisciplined && (
                    <div 
                      className="text-lg" 
                      title="Undisciplined Day - بدون پلن معاملاتی"
                    >
                      ⚠
                    </div>
                  )}
                  {dayPlan && (
                    <div 
                      className="text-sm" 
                      title={
                        planType === 'daily' ? 'Daily Plan' :
                        planType === 'weekly' ? 'Weekly Plan' :
                        'Monthly Plan'
                      }
                    >
                      {planType === 'daily' ? '📋' : planType === 'weekly' ? '📊' : '📈'}
                    </div>
                  )}
                </div>
                
                <div className={`font-bold mb-1 text-left ${isWeekend ? 'text-gray-500' : 'text-gray-700'}`}>
                  {day}
                </div>
                {dayTrades.length > 0 && (
                  <div className="text-xs text-left flex flex-col flex-1">
                    <div className="flex-1">
                      <div className="text-gray-600">{dayTrades.length} trades</div>
                      {hasPlan && (
                        <div className="text-xs space-y-0.5 py-1 border-t border-gray-300">
                          {compliantCount > 0 && (
                            <div className="text-blue-600" title="Compliant with plan">
                              ✓ {compliantCount} منظم
                            </div>
                          )}
                          {undisciplinedCount > 0 && (
                            <div className="text-orange-600" title="Undisciplined trades">
                              ⚠ {undisciplinedCount} نامنظم
                            </div>
                          )}
                        </div>
                      )}
                      {!hasPlan && (
                        <div className="text-xs text-orange-600 py-1 border-t border-gray-300">
                          بدون پلن
                        </div>
                      )}
                      <div className="text-gray-600">WR: {dayWinRate}%</div>
                      <div className={`font-bold ${
                        isProfit ? 'text-green-600' : 
                        isLoss ? 'text-red-600' : 
                        'text-yellow-600'
                      }`}>
                        ${dayProfit.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* View Trades Button - Fixed at bottom */}
                    <button
                      onClick={(e) => handleViewTrades(date, dayTrades, e)}
                      className="w-full px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors mt-2"
                      title="مشاهده لیست معاملات"
                    >
                      📋 مشاهده
                    </button>
                  </div>
                )}
                {isWeekend && dayTrades.length === 0 && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Weekend
                  </div>
                )}
              </div>
            )
          })}
          
          {/* Weekly summary */}
          {(() => {
            const weekTrades = (monthTrades || []).filter(trade => {
              const tradeDate = new Date(trade.closeTime)
              const tradeDayOfWeek = tradeDate.getDay()
              const firstDayOfWeek = week.find(d => d !== null)
              if (!firstDayOfWeek) return false
              
              const weekStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), firstDayOfWeek)
              const weekStartDay = weekStart.getDay()
              const daysToSubtract = weekStartDay === 0 ? 0 : weekStartDay
              weekStart.setDate(weekStart.getDate() - daysToSubtract)
              
              const weekEnd = new Date(weekStart)
              weekEnd.setDate(weekEnd.getDate() + 6)
              
              return tradeDate >= weekStart && tradeDate <= weekEnd
            })
            
            const weekProfit = weekTrades.reduce((sum, trade) => sum + trade.profit, 0)
            const weekWins = weekTrades.filter(t => t.profit > 0).length
            const weekWinRate = weekTrades.length > 0 ? ((weekWins / weekTrades.length) * 100).toFixed(1) : 0
            const hasWeekTrades = weekTrades.length > 0
            const isWeekProfit = hasWeekTrades && weekProfit > 0
            const isWeekLoss = hasWeekTrades && weekProfit < 0
            const isWeekBreakEven = hasWeekTrades && weekProfit === 0
            
            // Calculate compliance stats for this week
            let weekCompliantTrades = 0
            let weekUndisciplinedTrades = 0
            let weekNoPlanTrades = 0
            
            week.forEach(day => {
              if (day === null) return
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
              const dayOfWeek = date.getDay()
              if (dayOfWeek === 0 || dayOfWeek === 6) return // Skip weekends
              
              const dayTrades = (monthTrades || []).filter(trade => {
                const tradeDate = new Date(trade.closeTime)
                return tradeDate.getDate() === day &&
                       tradeDate.getMonth() === currentMonth.getMonth() &&
                       tradeDate.getFullYear() === currentMonth.getFullYear()
              })
              
              if (dayTrades.length === 0) return
              
              // Find plan for this day
              const dayPlan = getPlanForDate(plans, date)
              
              // Check compliance
              const compliance = checkPlanCompliance(dayTrades, dayPlan)
              weekCompliantTrades += compliance.compliant.length
              weekUndisciplinedTrades += compliance.undisciplined.length
              weekNoPlanTrades += compliance.noPlan.length
            })
            
            return (
              <div className={`
                border-2 rounded-lg p-3 min-h-[100px] font-semibold
                ${isWeekProfit ? 'bg-green-100 border-green-400' : ''}
                ${isWeekLoss ? 'bg-red-100 border-red-400' : ''}
                ${isWeekBreakEven ? 'bg-yellow-100 border-yellow-400' : ''}
                ${!hasWeekTrades ? 'bg-gray-50 border-gray-300' : ''}
              `}>
                <div className="text-xs space-y-1 text-left">
                  {hasWeekTrades ? (
                    <>
                      <div className="text-gray-700">{weekTrades.length} trades</div>
                      <div className="text-gray-700">WR: {weekWinRate}%</div>
                      <div className={`font-bold text-sm ${
                        isWeekProfit ? 'text-green-700' : 
                        isWeekLoss ? 'text-red-700' : 
                        'text-yellow-700'
                      }`}>
                        ${weekProfit.toFixed(2)}
                      </div>
                      {(weekCompliantTrades > 0 || weekUndisciplinedTrades > 0 || weekNoPlanTrades > 0) && (
                        <div className="text-xs pt-1 border-t border-gray-300 space-y-0.5">
                          {weekCompliantTrades > 0 && (
                            <div className="text-blue-700" title="Compliant Trades">✓ {weekCompliantTrades} منظم</div>
                          )}
                          {weekUndisciplinedTrades > 0 && (
                            <div className="text-orange-700" title="Undisciplined Trades">⚠ {weekUndisciplinedTrades} نامنظم</div>
                          )}
                          {weekNoPlanTrades > 0 && (
                            <div className="text-gray-700" title="No Plan Trades">📋 {weekNoPlanTrades} بدون پلن</div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500 text-center">No trades</div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      ))}
      
      {/* Month Summary Row */}
      <div className="grid grid-cols-8 gap-2 mt-4 pt-4 border-t-2 border-gray-300">
        <div className="col-span-7 text-right font-bold text-lg text-gray-700 flex items-center justify-end">
          Month Total:
        </div>
        <div className={`
          border-2 rounded-lg p-4 font-bold
          ${isMonthProfit ? 'bg-green-100 border-green-500' : ''}
          ${isMonthLoss ? 'bg-red-100 border-red-500' : ''}
          ${isMonthBreakEven ? 'bg-yellow-100 border-yellow-500' : ''}
          ${!hasMonthTrades ? 'bg-gray-50 border-gray-300' : ''}
        `}>
          <div className="text-sm space-y-1 text-left">
            {hasMonthTrades ? (
              <>
                <div className="text-gray-700">{(monthTrades || []).length} trades</div>
                <div className="text-gray-700">WR: {monthWinRate}%</div>
                <div className={`font-bold text-base ${
                  isMonthProfit ? 'text-green-700' : 
                  isMonthLoss ? 'text-red-700' : 
                  'text-yellow-700'
                }`}>
                  ${monthProfit.toFixed(2)}
                </div>
                {(monthCompliantTrades > 0 || monthUndisciplinedTrades > 0 || monthNoPlanTrades > 0) && (
                  <div className="text-xs pt-2 border-t border-gray-400 space-y-1">
                    {monthCompliantTrades > 0 && (
                      <div className="text-blue-700 font-semibold" title="Compliant Trades">
                        ✓ {monthCompliantTrades} معامله منظم
                      </div>
                    )}
                    {monthUndisciplinedTrades > 0 && (
                      <div className="text-orange-700 font-semibold" title="Undisciplined Trades">
                        ⚠ {monthUndisciplinedTrades} معامله نامنظم
                      </div>
                    )}
                    {monthNoPlanTrades > 0 && (
                      <div className="text-gray-700 font-semibold" title="No Plan Trades">
                        📋 {monthNoPlanTrades} بدون پلن
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 text-center">No trades</div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Modal */}
      {selectedDate && (
        <PlanModal
          isOpen={showPlanModal}
          onClose={() => {
            setShowPlanModal(false)
            setSelectedDate(null)
            setSelectedPlan(null)
            setCoveringPlan(null)
          }}
          date={selectedDate}
          userId={userId}
          existingPlan={selectedPlan}
          coveringPlan={coveringPlan}
          onSave={handlePlanSave}
        />
      )}

      {/* Day Trades Modal */}
      <DayTradesModal
        isOpen={showTradesModal}
        onClose={() => {
          setShowTradesModal(false)
          setSelectedDayTrades([])
        }}
        date={selectedDate}
        trades={selectedDayTrades}
        userId={userId}
      />
    </div>
  )
}

function QuickActionCard({ title, description, icon, href }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg p-6 border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </Link>
  )
}
