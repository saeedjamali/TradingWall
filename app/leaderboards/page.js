import Link from 'next/link'
import Image from 'next/image'

export default function LeaderboardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 mb-4">
            ← بازگشت به صفحه اصلی
          </Link>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Link href="/">
                  <div className="logo-badge">
                    <Image
                      src="/icons/tradinggwall-icon.svg"
                      alt="Trading Wall Logo"
                      width={64}
                      height={64}
                      className="w-14 h-14 md:w-16 md:h-16 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </div>
                </Link>
                <h1 className="text-4xl font-bold text-white">جداول برترین‌ها</h1>
              </div>
          <p className="text-gray-400">مشاهده معامله‌گران برتر در دوره‌های مختلف</p>
        </div>

        {/* Leaderboards Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <LeaderboardCard
            title="🏆 برترین وین‌ریت سال"
            description="بالاترین درصد موفقیت در سال جاری"
            minTrades="حداقل 100 معامله"
          />
          <LeaderboardCard
            title="🎯 برترین وین‌ریت ماه"
            description="بالاترین درصد موفقیت در ماه جاری"
            minTrades="حداقل 30 معامله"
          />
          <LeaderboardCard
            title="⚡ برترین وین‌ریت هفته"
            description="بالاترین درصد موفقیت در هفته جاری"
            minTrades="حداقل 10 معامله"
          />
          <LeaderboardCard
            title="💰 سودده‌ترین سال"
            description="بیشترین سود دلاری در سال جاری"
            minTrades="حداقل 100 معامله"
          />
          <LeaderboardCard
            title="💵 سودده‌ترین ماه"
            description="بیشترین سود دلاری در ماه جاری"
            minTrades="حداقل 30 معامله"
          />
          <LeaderboardCard
            title="💸 سودده‌ترین هفته"
            description="بیشترین سود دلاری در هفته جاری"
            minTrades="حداقل 10 معامله"
          />
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            برای مشاهده جزئیات و ثبت معاملات خود وارد شوید
          </p>
          <Link 
            href="/auth/login"
            className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            ورود / ثبت نام
          </Link>
        </div>
      </div>
    </div>
  )
}

function LeaderboardCard({ title, description, minTrades }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300 mb-3">{description}</p>
      <p className="text-sm text-gray-400">{minTrades}</p>
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-gray-400 text-center text-sm">
          در حال حاضر اطلاعاتی موجود نیست
        </p>
      </div>
    </div>
  )
}
