export const metadata = {
  title: 'لیدربورد تریدرها',
  description:
    'برترین تریدرهای دیوار معاملاتی بر اساس وین‌ریت و سود — رتبه‌بندی هفتگی، ماهانه و سالانه.',
  alternates: {
    canonical: '/leaderboards',
  },
  openGraph: {
    title: 'لیدربورد تریدرها',
    description:
      'مشاهده برترین وین‌ریت و سودده‌ترین تریدرها در بازه‌های هفته، ماه و سال.',
    url: '/leaderboards',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LeaderboardsLayout({ children }) {
  return children
}
