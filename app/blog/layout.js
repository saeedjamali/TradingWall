import Link from 'next/link'
import Image from 'next/image'
import { BLOG_CATEGORY_LABELS } from '@/utils/blog'

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
  },
  robots: { index: true, follow: true },
}

export default function BlogLayout({ children }) {
  return (
    <div className="page-shell text-white">
      <header className="border-b border-white/10 bg-black/25">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3" dir="rtl">
          <Link href="/" className="flex items-center min-w-0">
            <Image
              src="/logo/tradinggwall-logo-horizontal.svg"
              alt="دیوار معاملاتی"
              width={519}
              height={163}
              priority
              className="h-8 md:h-10 w-auto max-w-[160px] md:max-w-[200px]"
            />
          </Link>
          <nav className="flex items-center gap-3 text-sm shrink-0">
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
        </div>
      </header>
      {children}
      <p className="sr-only">
        دسته‌های آموزشی: {Object.values(BLOG_CATEGORY_LABELS).join('، ')}
      </p>
    </div>
  )
}
