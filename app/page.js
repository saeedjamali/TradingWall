import HomeClient from '@/components/HomeClient'
import HomeSeoArticle from '@/components/HomeSeoArticle'
import { getPublicPosts } from '@/lib/blogQueries'
import {
  HOME_TITLE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_TAGLINE,
} from '@/utils/site'

export const metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: { canonical: '/' },
  openGraph: {
    title: HOME_TITLE,
    description: SITE_TAGLINE,
    url: '/',
    type: 'website',
    locale: 'fa_IR',
    images: [
      {
        url: '/icons/tradingwall-icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'ژورنال معاملاتی دیوار معاملاتی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: SITE_TAGLINE,
  },
}

export default async function HomePage() {
  let latestPosts = []
  try {
    const data = await getPublicPosts({ limit: 3 })
    latestPosts = data.posts || []
  } catch (error) {
    console.error('Home blog posts skipped:', error?.message || error)
  }

  return (
    <>
      <HomeClient />
      <HomeSeoArticle latestPosts={latestPosts} />
    </>
  )
}
