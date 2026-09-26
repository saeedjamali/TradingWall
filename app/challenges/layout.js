export const metadata = {
  title: 'چالش بک‌تست و چالش معامله',
  description:
    'چالش بک‌تست و چالش معامله برای شناسایی نقاط ضعف و قوت و تحلیل عملکرد روی یک نماد — نه رتبه‌بندی. دعوت با لینک و پیامک در دیوار معاملاتی.',
  keywords: [
    'چالش بک‌تست',
    'چالش معامله',
    'چالش بک تست',
    'چالش بکتست',
    'تحلیل بک‌تست',
    'نقاط ضعف و قوت ترید',
    'تحلیل معامله',
    'بک‌تست فارکس',
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'چالش بک‌تست / چالش معامله | دیوار معاملاتی',
    description:
      'هدف چالش‌ها شناسایی نقاط ضعف و قوت و تحلیل آن‌هاست — چالش بک‌تست روی چارت تاریخی و چالش معامله روی معاملات واقعی.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
  },
}

export default function ChallengesLayout({ children }) {
  return children
}
