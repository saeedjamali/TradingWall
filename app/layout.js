import './globals.css'
import { Vazirmatn, Orbitron } from 'next/font/google'

const vazir = Vazirmatn({ 
  subsets: ['latin', 'arabic'],
  variable: '--font-vazir',
  display: 'swap',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

export const metadata = {
  title: 'Trading Wall | دیوار معاملاتی',
  description: 'پلتفرم تحلیل و مدیریت معاملات',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
    ],
    apple: [
      {
        url: '/favicon.ico',
        sizes: '180x180',
        type: 'image/x-icon',
      },
    ],
  },
  themeColor: '#1e40af',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.variable} ${orbitron.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
