export const metadata = {
  title: 'ساعت بازار فارکس و سشن‌ها | تهران، لندن و نیویورک',
  description:
    'ساعت زنده سشن‌های سیدنی، توکیو، لندن و نیویورک به وقت تهران و GMT، ساعت بانک نیویورک، تبدیل زمان با DST و اعلان تعطیلات امروز/هفته/ماه.',
  keywords: [
    'ساعت فارکس',
    'سشن لندن',
    'سشن نیویورک',
    'وقت تهران فارکس',
    'تعطیلات فارکس',
    'ساعت بانک نیویورک',
    'DST فارکس',
  ],
  alternates: {
    canonical: '/tools/market-clock',
  },
  openGraph: {
    title: 'ساعت بازار فارکس و سشن‌ها',
    description:
      'نمایش گرافیکی سشن‌ها، ساعت تهران، بانک نیویورک و تعطیلات بازار',
    url: '/tools/market-clock',
    type: 'website',
    locale: 'fa_IR',
  },
  robots: { index: true, follow: true },
}

export default function MarketClockLayout({ children }) {
  return children
}
