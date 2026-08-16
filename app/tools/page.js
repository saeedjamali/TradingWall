import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'ابزار معامله فارکس | ساعت سشن، ماشین‌حساب، بک‌تست | Trading Wall',
  description:
    'ابزارهای رایگان فارکس: ساعت سشن و تهران، همپوشانی لندن–نیویورک، ماشین‌حساب پیپ و ریسک، مبدل لات، راهنمای جفت‌ارز و بک‌تست.',
  keywords: [
    'ابزار فارکس',
    'ساعت بازار فارکس',
    'ماشین حساب پیپ',
    'ماشین حساب ریسک',
    'همپوشانی سشن',
    'مبدل لات',
    'Trading Wall tools',
  ],
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'ابزار معامله | Trading Wall',
    description:
      'ساعت سشن، ماشین‌حساب‌ها، همپوشانی لندن–نیویورک و راهنمای جفت‌ارز',
    url: '/tools',
    type: 'website',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ابزار معامله | Trading Wall',
    description: 'مجموعه ابزارهای رایگان معامله‌گری',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

/** Keep hub lean — group related tools */
const TOOLS = [
  {
    href: '/tools/market-clock',
    title: 'ساعت بازار و تعطیلات',
    desc: 'سشن‌ها، تهران، بانک NY، تبدیل زمان و اعلان تعطیلات',
    icon: '🕐',
    accent: 'from-cyan-500/20 to-blue-600/20 border-cyan-400/30',
  },
  {
    href: '/tools/session-overlap',
    title: 'همپوشانی سشن‌ها',
    desc: 'تقاطع همه بازارها: سیدنی، توکیو، لندن و نیویورک',
    icon: '🔀',
    accent: 'from-indigo-500/20 to-sky-600/20 border-indigo-400/30',
  },
  {
    href: '/tools/calculators',
    title: 'ماشین‌حساب‌ها',
    desc: 'پیپ، سود/زیان، مبدل لات و واحد حساب',
    icon: '🧮',
    accent: 'from-emerald-500/20 to-teal-600/20 border-emerald-400/30',
  },
  {
    href: '/tools/risk-calculator',
    title: 'ماشین‌حساب ریسک',
    desc: 'حجم لات بر اساس درصد ریسک و فاصله SL',
    icon: '📐',
    accent: 'from-lime-500/20 to-emerald-700/20 border-lime-400/30',
  },
  {
    href: '/tools/pair-guide',
    title: 'راهنمای جفت‌ارز',
    desc: 'سشن و تایم‌فریم پیشنهادی برای هر نماد',
    icon: '🧭',
    accent: 'from-violet-500/20 to-fuchsia-600/20 border-violet-400/30',
  },
  {
    href: '/backtest',
    title: 'بک‌تست',
    desc: 'تقویم بک‌تست و گزارش TP/SL',
    icon: '📊',
    accent: 'from-amber-500/20 to-orange-600/20 border-amber-400/30',
  },
]

export default function ToolsHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'ابزار معامله Trading Wall',
    description:
      'ابزارهای رایگان فارکس شامل ساعت سشن، ماشین‌حساب پیپ و ریسک، همپوشانی سشن و راهنمای جفت‌ارز',
    url: 'https://tradingwall.ir/tools',
    hasPart: TOOLS.map((t) => ({
      '@type': 'WebPage',
      name: t.title,
      url: `https://tradingwall.ir${t.href}`,
      description: t.desc,
    })),
  }

  return (
    <main className="page-shell text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo/tradinggwall-logo-horizontal.svg"
              alt="Trading Wall"
              width={160}
              height={40}
              className="h-8 md:h-10 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-white/70 hover:text-white px-2 hidden sm:inline">
              خانه
            </Link>
            <Link
              href="/dashboard"
              className="text-white/70 hover:text-white px-2 hidden sm:inline"
            >
              داشبورد
            </Link>
            <span className="text-primary-300 font-semibold px-2">ابزار معامله</span>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 md:py-14" dir="rtl">
        <div className="max-w-2xl mb-8">
          <p className="text-primary-300 text-sm font-medium mb-2">Trading Tools</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">ابزار معامله</h1>
          <p className="text-white/60 leading-relaxed text-sm md:text-base">
            ابزارهای ضروری در چند بخش مرتب — بدون شلوغی.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} className="block group">
              <div
                className={`h-full rounded-2xl border bg-gradient-to-br p-4 md:p-5 transition-all group-hover:border-white/30 ${tool.accent}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{tool.icon}</span>
                  <h2 className="text-base md:text-lg font-bold text-white">
                    {tool.title}
                  </h2>
                </div>
                <p className="text-sm text-white/55 leading-relaxed">{tool.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
