export const metadata = {
  title: 'همپوشانی سشن‌های فارکس | سیدنی توکیو لندن نیویورک | Trading Wall',
  description:
    'همپوشانی همه سشن‌های فارکس: سیدنی×توکیو، توکیو×لندن، لندن×نیویورک، نیویورک×سیدنی و سایر تقاطع‌ها به وقت تهران و GMT.',
  keywords: [
    'همپوشانی سشن',
    'لندن نیویورک',
    'توکیو لندن',
    'سیدنی توکیو',
    'london new york overlap',
    'tokyo london overlap',
    'نقدینگی فارکس',
  ],
  alternates: { canonical: '/tools/session-overlap' },
  openGraph: {
    title: 'همپوشانی سشن لندن–نیویورک | Trading Wall',
    description: 'بازه مشترک لندن و نیویورک با نمایش به وقت تهران',
    url: '/tools/session-overlap',
    type: 'website',
    locale: 'fa_IR',
  },
  robots: { index: true, follow: true },
}

export default function Layout({ children }) {
  return children
}
