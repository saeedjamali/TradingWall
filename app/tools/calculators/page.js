import Link from 'next/link'
import TradingCalculatorsTool from '@/components/tools/TradingCalculatorsTool'
import PublicPageHeader from '@/components/PublicPageHeader'

export const metadata = {
  title: 'ماشین‌حساب فارکس | پیپ، سود زیان و مبدل لات',
  description:
    'ماشین‌حساب رایگان فارکس: محاسبه پیپ Entry–SL–TP، سود و زیان تقریبی، مبدل لات استاندارد/مینی/میکرو و واحد حساب دلار و سنت.',
  keywords: [
    'ماشین حساب پیپ',
    'محاسبه سود زیان فارکس',
    'مبدل لات',
    'پیپ کالکولاتور',
    'forex calculator',
    'pip calculator',
  ],
  alternates: { canonical: '/tools/calculators' },
  openGraph: {
    title: 'ماشین‌حساب‌های فارکس',
    description: 'پیپ، PnL، مبدل لات و واحد حساب در یک صفحه',
    url: '/tools/calculators',
    type: 'website',
    locale: 'fa_IR',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export default function CalculatorsPage() {
  return (
    <main className="page-shell text-white">
      <PublicPageHeader title="ماشین‌حساب‌ها">
        <Link
          href="/tools"
          className="px-3 py-1.5 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 text-sm shrink-0"
        >
          همه ابزارها
        </Link>
      </PublicPageHeader>
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-4xl">
        <p className="text-sm text-white/55 mb-6" dir="rtl">
          چهار ابزار محاسباتی در یک صفحه — بین تب‌ها جابه‌جا شوید.
        </p>
        <TradingCalculatorsTool />
      </div>
    </main>
  )
}
