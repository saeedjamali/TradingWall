import Link from 'next/link'
import { BLOG_CATEGORY_LABELS } from '@/utils/blog'
import PublicPageHeader from '@/components/PublicPageHeader'

export const metadata = {
  title: 'بلاگ ژورنال معاملاتی و بک‌تست فارکس',
  description:
    'مقالات آموزشی دیوار معاملاتی درباره ژورنال معاملاتی، بک‌تست فارکس، روانشناسی معامله و ابزارهای ترید.',
  keywords: [
    'بلاگ فارکس',
    'ژورنال معاملاتی',
    'بکتست',
    'آموزش بک‌تست',
    'روانشناسی معامله',
  ],
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': '/blog/rss.xml',
    },
  },
  openGraph: {
    title: 'بلاگ دیوار معاملاتی',
    description: 'آموزش ژورنال معاملاتی، بک‌تست و معامله‌گری',
    url: '/blog',
    type: 'website',
    locale: 'fa_IR',
    images: [
      {
        url: '/icons/tradingwall-icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'دیوار معاملاتی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'بلاگ دیوار معاملاتی',
    description: 'آموزش ژورنال معاملاتی، بک‌تست و معامله‌گری',
    images: ['/icons/tradingwall-icon-512x512.png'],
  },
  robots: { index: true, follow: true },
}

export default function BlogLayout({ children }) {
  return (
    <div className="page-shell text-white">
      <PublicPageHeader sticky={false} logoPriority>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/blog" className="text-emerald-300 font-semibold">
            بلاگ
          </Link>
          <Link href="/blog/rss.xml" className="text-white/60 hover:text-white">
            RSS
          </Link>
          <Link href="/backtest" className="text-white/60 hover:text-white">
            بک‌تست
          </Link>
          <Link href="/tools" className="text-white/60 hover:text-white">
            ابزارها
          </Link>
        </nav>
      </PublicPageHeader>
      {children}
      <p className="sr-only">
        دسته‌های آموزشی: {Object.values(BLOG_CATEGORY_LABELS).join('، ')}
      </p>
    </div>
  )
}
