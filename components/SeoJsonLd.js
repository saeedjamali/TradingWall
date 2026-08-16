import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_NAME_FA,
  SITE_TAGLINE,
  absoluteUrl,
  getSiteUrl,
} from '@/utils/site'

/**
 * JSON-LD for Organization, WebSite, and SoftwareApplication.
 * Rendered in root layout for crawlers.
 */
export default function SeoJsonLd() {
  const siteUrl = getSiteUrl()

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: SITE_NAME_FA,
    url: siteUrl,
    logo: absoluteUrl('/icons/tradingwall-icon-512x512.png'),
    description: SITE_DESCRIPTION,
    email: 'info@tradingwall.ir',
    sameAs: ['https://t.me/tradingwall'],
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: SITE_NAME_FA,
    url: siteUrl,
    description: SITE_TAGLINE,
    inLanguage: ['fa-IR', 'en'],
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/icons/tradingwall-icon-512x512.png'),
      },
    },
    keywords: SITE_KEYWORDS.join(', '),
    hasPart: [
      {
        '@type': 'CollectionPage',
        name: 'ابزار معامله',
        url: absoluteUrl('/tools'),
      },
      {
        '@type': 'WebPage',
        name: 'بک‌تست معاملاتی',
        url: absoluteUrl('/backtest'),
      },
      {
        '@type': 'WebPage',
        name: 'لیدربورد تریدرها',
        url: absoluteUrl('/leaderboards'),
      },
    ],
  }

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IRR',
    },
    description: SITE_DESCRIPTION,
    url: siteUrl,
    inLanguage: 'fa-IR',
    featureList: [
      'ژورنال معاملاتی',
      'تقویم معاملاتی',
      'لیدربورد وین‌ریت و سود',
      'دیوار عمومی تریدرها',
      'ابزار معامله فارکس',
      'بک‌تست معاملاتی',
      'ماشین‌حساب ریسک و پیپ',
      'ساعت سشن‌های بازار',
    ],
    hasPart: [
      {
        '@type': 'WebApplication',
        name: 'ابزار معامله Trading Wall',
        url: absoluteUrl('/tools'),
        description:
          'ساعت سشن، همپوشانی بازارها، ماشین‌حساب ریسک و پیپ، راهنمای جفت‌ارز',
      },
      {
        '@type': 'WebApplication',
        name: 'بک‌تست Trading Wall',
        url: absoluteUrl('/backtest'),
        description:
          'ثبت بک‌تست روزانه، گزارش TP/SL و عملکرد ستاپ‌ها',
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  )
}
