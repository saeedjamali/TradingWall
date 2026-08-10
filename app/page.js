'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    const tokenExpiry = localStorage.getItem('tokenExpiry')
    
    if (userData && tokenExpiry) {
      const now = new Date().getTime()
      if (now < parseInt(tokenExpiry)) {
        setUser(JSON.parse(userData))
      } else {
        // Token expired
        localStorage.removeItem('user')
        localStorage.removeItem('tokenExpiry')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    setUser(null)
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Candlestick Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="logo-badge">
                <Image 
                  src="/icons/tradinggwall-icon.svg" 
                  alt="Trading Wall Logo" 
                  width={64} 
                  height={64}
                  className="w-12 h-12 md:w-14 md:h-14"
                />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white tracking-tight trading-wall-logo">
                Trading Wall
              </div>
            </Link>
            <div className="space-x-4 space-x-reverse">
              {user ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="px-6 py-2 text-white hover:text-primary-400 transition-colors"
                  >
                    داشبورد
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    خروج
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth/login" 
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  ورود / ثبت نام
                </Link>
              )}
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            دیوار معاملاتی
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            پلتفرم حرفه‌ای تحلیل و مدیریت معاملات شما
            <br />
            معاملات خود را ثبت کنید، آنالیز کنید و عملکرد خود را بهبود دهید
          </p>

          {/* Upload Section */}
          <div className="max-w-xl mx-auto mb-20">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                بارگذاری معاملات
              </h3>
              <p className="text-gray-300 mb-6">
                فایل گزارش متاتریدر یا فایل الگوی خالی را بارگذاری کنید
              </p>
              {user ? (
                <Link 
                  href="/dashboard/trades/upload"
                  className="block w-full px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg text-center"
                >
                  بارگذاری فایل معاملات
                </Link>
              ) : (
                <Link 
                  href="/auth/login"
                  className="block w-full px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg text-center"
                >
                  ورود / ثبت نام برای بارگذاری
                </Link>
              )}
              <div className="mt-4 flex gap-3 justify-center flex-wrap">
                <a 
                  href="/api/templates/download?type=sample" 
                  className="text-sm text-primary-400 hover:text-primary-300"
                  download
                >
                  📊 نمونه Excel
                </a>
                <span className="text-gray-500">|</span>
                <a 
                  href="/api/templates/download?type=sample&format=csv" 
                  className="text-sm text-primary-400 hover:text-primary-300"
                  download
                >
                  📋 نمونه CSV
                </a>
                <span className="text-gray-500">|</span>
                <a 
                  href="/api/templates/download?type=template" 
                  className="text-sm text-primary-400 hover:text-primary-300"
                  download
                >
                  📄 الگوی خالی
                </a>
              </div>
            </div>
          </div>

          {/* Leaderboards Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-white mb-8">
              برترین معامله‌گران
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Top Win Rate - Year */}
              <LeaderboardCard 
                title="بالاترین وین‌ریت سال"
                period="سال جاری"
                minTrades={100}
                topTraders={[
                  { rank: 1, name: 'علی احمدی', value: '87.5%', verified: true },
                  { rank: 2, name: 'سارا محمدی', value: '85.2%', verified: true },
                  { rank: 3, name: 'محمد رضایی', value: '82.3%', verified: false },
                ]}
              />

              {/* Top Win Rate - Month */}
              <LeaderboardCard 
                title="بالاترین وین‌ریت ماه"
                period="ماه جاری"
                minTrades={30}
                topTraders={[
                  { rank: 1, name: 'فاطمه کریمی', value: '92.1%', verified: true },
                  { rank: 2, name: 'حسین نوری', value: '88.4%', verified: false },
                  { rank: 3, name: 'زهرا حسینی', value: '86.7%', verified: true },
                ]}
              />

              {/* Top Win Rate - Week */}
              <LeaderboardCard 
                title="بالاترین وین‌ریت هفته"
                period="هفته جاری"
                minTrades={10}
                topTraders={[
                  { rank: 1, name: 'مهدی صادقی', value: '95.0%', verified: true },
                  { rank: 2, name: 'نیما محمودی', value: '90.5%', verified: true },
                  { rank: 3, name: 'رضا امینی', value: '88.2%', verified: false },
                ]}
              />
            </div>

            <div className="mt-8">
              <Link 
                href="/leaderboards" 
                className="inline-block px-8 py-3 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                مشاهده همه لیست‌ها
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard 
              icon="📊"
              title="تحلیل جامع"
              description="آمار و تحلیل کامل از معاملات با نمایش وین‌ریت، سود/زیان و شاخص‌های مهم"
            />
            <FeatureCard 
              icon="📅"
              title="تقویم معاملاتی"
              description="مشاهده تقویم روزانه، هفتگی و ماهانه با امکان ثبت پلن و ژورنال"
            />
            <FeatureCard 
              icon="🏆"
              title="رقابت سالم"
              description="مقایسه عملکرد با سایر معامله‌گران و کسب رتبه در جداول"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>&copy; 2026 Trading Wall. تمامی حقوق محفوظ است.</p>
        </footer>
      </div>
    </main>
  )
}

function LeaderboardCard({ title, period, minTrades, topTraders }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">حداقل {minTrades} معامله</p>
      <div className="space-y-3">
        {topTraders.map((trader) => (
          <div key={trader.rank} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                trader.rank === 1 ? 'bg-yellow-500 text-white' :
                trader.rank === 2 ? 'bg-gray-400 text-white' :
                'bg-orange-600 text-white'
              }`}>
                {trader.rank}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-white">{trader.name}</span>
                {trader.verified && (
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-profit font-bold">{trader.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  )
}
