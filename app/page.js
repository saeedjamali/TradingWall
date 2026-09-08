import HomeClient from '@/components/HomeClient'
import HomeSeoArticle from '@/components/HomeSeoArticle'
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

export default function HomePage() {
  return (
    <>
      <HomeClient />
      <HomeSeoArticle />
    </>
  )
}
