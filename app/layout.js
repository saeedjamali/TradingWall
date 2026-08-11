import "./globals.css";
import { Vazirmatn, Orbitron } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import ActiveSessionGuard from "@/components/ActiveSessionGuard";

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

export const metadata = {
  title: "Trading Wall | دیوار معاملاتی",
  description: "پلتفرم تحلیل و مدیریت معاملات",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      {
        url: "/icons/tradingwall-icon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icons/tradingwall-icon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icons/tradingwall-icon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      { url: "/icons/tradingwall-icon-dark.png", type: "image/svg+xml" },
    ],
    apple: [
      {
        url: "/icons/tradingwall-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta name="theme-color" content="#1e3a8a" />
      </head>
      <body
        className={`${vazir.variable} ${orbitron.variable} antialiased min-h-screen flex flex-col`}
      >
        <ActiveSessionGuard />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
