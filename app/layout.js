import "./globals.css";
import { Vazirmatn, Orbitron } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import ActiveSessionGuard from "@/components/ActiveSessionGuard";
import SiteLogTracker from "@/components/SiteLogTracker";
import SeoJsonLd from "@/components/SeoJsonLd";
import {
  HOME_TITLE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME_FA,
  SITE_TAGLINE,
  getSiteUrl,
} from "@/utils/site";

const vazir = Vazirmatn({
  subsets: ["latin", "arabic"],
  variable: "--font-vazir",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const siteUrl = getSiteUrl();
const googleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME_FA}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME_FA,
  authors: [{ name: SITE_NAME_FA, url: siteUrl }],
  creator: SITE_NAME_FA,
  publisher: SITE_NAME_FA,
  category: "finance",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    alternateLocale: ["en_US"],
    url: siteUrl,
    siteName: SITE_NAME_FA,
    title: HOME_TITLE,
    description: SITE_TAGLINE,
    images: [
      {
        url: "/icons/tradingwall-icon-512x512.png",
        width: 512,
        height: 512,
        alt: SITE_NAME_FA,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: SITE_TAGLINE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icons/tradingwall-icon-dark.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: [{ url: "/icons/tradingwall-icon-dark.png", type: "image/png" }],
    apple: [{ url: "/icons/tradingwall-icon-dark.png", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
    { media: "(prefers-color-scheme: light)", color: "#1e3a8a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${vazir.variable} ${orbitron.variable} antialiased min-h-screen flex flex-col`}
      >
        <SeoJsonLd />
        <ActiveSessionGuard />
        <SiteLogTracker />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
