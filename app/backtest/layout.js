export const metadata = {
  title: 'بک‌تست معاملاتی | ژورنال بک‌تست فارکس | Trading Wall',
  description:
    'ثبت بک‌تست روزانه با نماد، ستاپ، تعداد TP و SL، گزارش عملکرد ماهانه و تقویم بک‌تست در Trading Wall.',
  keywords: [
    'بک تست فارکس',
    'ژورنال بک تست',
    'backtest journal',
    'ثبت بک تست',
    'گزارش بک تست',
    'Trading Wall backtest',
  ],
  alternates: {
    canonical: '/backtest',
  },
  openGraph: {
    title: 'بک‌تست معاملاتی | Trading Wall',
    description:
      'تقویم بک‌تست، ثبت چند بک‌تست در روز، گزارش TP/SL و عملکرد ستاپ‌ها',
    url: '/backtest',
    type: 'website',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'بک‌تست معاملاتی | Trading Wall',
    description: 'ژورنال بک‌تست با گزارش TP/SL و ستاپ‌ها',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function BacktestLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'بک‌تست Trading Wall',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description:
      'ابزار ثبت و تحلیل بک‌تست معاملات فارکس با تقویم، گزارش TP/SL و ستاپ‌ها',
    url: 'https://tradingwall.ir/backtest',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IRR',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
