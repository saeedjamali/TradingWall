export const metadata = {
  title: 'ماشین‌حساب ریسک و حجم معامله فارکس',
  description:
    'محاسبه رایگان حجم لات، مبلغ ریسک، فاصله پیپ SL و نسبت RR برای معاملات فارکس — ابزار ریسک دیوار معاملاتی.',
  keywords: [
    'ماشین حساب ریسک',
    'محاسبه لات',
    'حجم معامله فارکس',
    'risk calculator',
    'position size calculator',
  ],
  alternates: {
    canonical: '/tools/risk-calculator',
  },
  openGraph: {
    title: 'ماشین‌حساب ریسک فارکس',
    description: 'محاسبه حجم لات و ریسک معامله با Entry، SL و درصد ریسک',
    url: '/tools/risk-calculator',
    type: 'website',
    locale: 'fa_IR',
  },
  robots: { index: true, follow: true },
}

export default function RiskCalculatorLayout({ children }) {
  return children
}
