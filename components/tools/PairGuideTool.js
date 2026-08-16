'use client'

import { useMemo, useState } from 'react'

const INSTRUMENTS = [
  // ——— Majors ———
  {
    group: 'جفت‌های اصلی',
    symbol: 'EURUSD',
    name: 'یورو / دلار',
    sessions: ['لندن', 'نیویورک', 'همپوشانی لندن–نیویورک'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'نقدشونده‌ترین جفت؛ بهترین عملکرد در سشن اروپا و آمریکا',
  },
  {
    group: 'جفت‌های اصلی',
    symbol: 'GBPUSD',
    name: 'پوند / دلار',
    sessions: ['لندن', 'همپوشانی لندن–نیویورک'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'نوسان بالاتر از EUR؛ حساس به اخبار انگلیس و آمریکا',
  },
  {
    group: 'جفت‌های اصلی',
    symbol: 'USDJPY',
    name: 'دلار / ین',
    sessions: ['توکیو', 'لندن', 'نیویورک'],
    timeframes: ['M15', 'H1', 'H4'],
    note: 'سشن آسیا مهم است؛ واکنش قوی به نرخ بهره و مداخلات',
  },
  {
    group: 'جفت‌های اصلی',
    symbol: 'USDCHF',
    name: 'دلار / فرانک',
    sessions: ['لندن', 'نیویورک'],
    timeframes: ['M30', 'H1', 'H4'],
    note: 'نوسان معمولاً متعادل‌تر؛ همبستگی معکوس تقریبی با EURUSD',
  },
  {
    group: 'جفت‌های اصلی',
    symbol: 'AUDUSD',
    name: 'دلار استرالیا / دلار',
    sessions: ['سیدنی', 'توکیو', 'همپوشانی آسیا'],
    timeframes: ['M30', 'H1', 'H4'],
    note: 'مناسب سشن اقیانوس آرام؛ مرتبط با کالا و چین',
  },
  {
    group: 'جفت‌های اصلی',
    symbol: 'USDCAD',
    name: 'دلار / دلار کانادا',
    sessions: ['نیویورک', 'همپوشانی لندن–نیویورک'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'تحت تأثیر نفت و داده‌های کانادا/آمریکا',
  },
  {
    group: 'جفت‌های اصلی',
    symbol: 'NZDUSD',
    name: 'دلار نیوزیلند / دلار',
    sessions: ['سیدنی', 'توکیو'],
    timeframes: ['M30', 'H1', 'H4'],
    note: 'نقدینگی کمتر از AUD؛ مناسب سشن آسیا/اقیانوس آرام',
  },
  // ——— Crosses ———
  {
    group: 'کراس‌ها',
    symbol: 'EURJPY',
    name: 'یورو / ین',
    sessions: ['توکیو', 'لندن'],
    timeframes: ['M30', 'H1', 'H4'],
    note: 'ترکیب آسیا و اروپا؛ روندها روی H1/H4 واضح‌ترند',
  },
  {
    group: 'کراس‌ها',
    symbol: 'GBPJPY',
    name: 'پوند / ین',
    sessions: ['توکیو', 'لندن', 'همپوشانی'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'نوسان بالا؛ اسپرد و ریسک را جدی بگیرید',
  },
  {
    group: 'کراس‌ها',
    symbol: 'EURGBP',
    name: 'یورو / پوند',
    sessions: ['لندن'],
    timeframes: ['M30', 'H1', 'H4'],
    note: 'عمدتاً سشن لندن؛ حرکت‌های خبری اروپا مهم است',
  },
  {
    group: 'کراس‌ها',
    symbol: 'AUDJPY',
    name: 'دلار استرالیا / ین',
    sessions: ['سیدنی', 'توکیو'],
    timeframes: ['M30', 'H1', 'H4'],
    note: 'ریسک‌آن / ریسک‌آف آسیا؛ مناسب سشن توکیو',
  },
  {
    group: 'کراس‌ها',
    symbol: 'EURCHF',
    name: 'یورو / فرانک',
    sessions: ['لندن'],
    timeframes: ['H1', 'H4'],
    note: 'نوسان نسبتاً کم؛ بیشتر برای تایم‌فریم بالاتر',
  },
  {
    group: 'کراس‌ها',
    symbol: 'CADJPY',
    name: 'دلار کانادا / ین',
    sessions: ['توکیو', 'نیویورک'],
    timeframes: ['M30', 'H1', 'H4'],
    note: 'ترکیب نفت و ریسک‌آف؛ overlap آسیا–آمریکا مفید است',
  },
  // ——— Metals / Energy ———
  {
    group: 'فلزات و انرژی',
    symbol: 'XAUUSD',
    name: 'طلا',
    sessions: ['لندن', 'نیویورک', 'همپوشانی'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'نقدینگی بالا در لندن و نیویورک؛ حساس به نرخ بهره و دلار',
  },
  {
    group: 'فلزات و انرژی',
    symbol: 'XAGUSD',
    name: 'نقره',
    sessions: ['لندن', 'نیویورک'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'نوسان بیشتر از طلا؛ اسپرد و لغزش را در نظر بگیرید',
  },
  {
    group: 'فلزات و انرژی',
    symbol: 'USOIL',
    name: 'نفت آمریکا (WTI)',
    sessions: ['نیویورک', 'لندن'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'بهترین نقدینگی در سشن آمریکا؛ مراقب گزارش موجودی EIA',
  },
  {
    group: 'فلزات و انرژی',
    symbol: 'UKOIL',
    name: 'نفت برنت',
    sessions: ['لندن', 'نیویورک'],
    timeframes: ['M30', 'H1', 'H4'],
    note: 'همبستگی با WTI؛ اخبار ژئوپلیتیک و OPEC مهم است',
  },
  // ——— Indices ———
  {
    group: 'شاخص‌ها',
    symbol: 'US30',
    name: 'داوجونز (Dow Jones)',
    sessions: ['نیویورک', 'پیش‌بازار آمریکا'],
    timeframes: ['M5', 'M15', 'M30'],
    note: 'بهترین حرکت در باز بودن بازار سهام آمریکا؛ حساس به داده‌های اقتصادی US',
  },
  {
    group: 'شاخص‌ها',
    symbol: 'NAS100',
    name: 'نزدک ۱۰۰ (Nasdaq)',
    sessions: ['نیویورک', 'پیش‌بازار آمریکا'],
    timeframes: ['M5', 'M15', 'M30'],
    note: 'نوسان بالاتر از داو؛ وابسته به سهام تکنولوژی و نرخ بهره',
  },
  {
    group: 'شاخص‌ها',
    symbol: 'SPX500',
    name: 'اس‌اندپی ۵۰۰ (S&P 500)',
    sessions: ['نیویورک'],
    timeframes: ['M5', 'M15', 'H1'],
    note: 'شاخص معیار بازار آمریکا؛ نقدینگی عالی در سشن NY',
  },
  {
    group: 'شاخص‌ها',
    symbol: 'GER40',
    name: 'داکس آلمان (DAX)',
    sessions: ['لندن', 'فرانکفورت'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'بهترین عملکرد در سشن اروپا؛ همبستگی با EUR و اخبار آلمان',
  },
  {
    group: 'شاخص‌ها',
    symbol: 'UK100',
    name: 'فوتسی ۱۰۰ (FTSE)',
    sessions: ['لندن'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'سشن لندن؛ حساس به اخبار انگلیس و GBP',
  },
  {
    group: 'شاخص‌ها',
    symbol: 'JPN225',
    name: 'نیکی ۲۲۵ (Nikkei)',
    sessions: ['توکیو'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'سشن آسیا؛ تأثیر USDJPY و سیاست بانک ژاپن',
  },
  {
    group: 'شاخص‌ها',
    symbol: 'HK50',
    name: 'هنگ‌سنگ (Hang Seng)',
    sessions: ['توکیو', 'هنگ‌کنگ'],
    timeframes: ['M15', 'M30', 'H1'],
    note: 'سشن آسیا؛ وابسته به اخبار چین و ریسک بازارهای نوظهور',
  },
]

const GROUPS = [...new Set(INSTRUMENTS.map((i) => i.group))]

export default function PairGuideTool() {
  const [symbol, setSymbol] = useState('EURUSD')
  const pair = useMemo(
    () => INSTRUMENTS.find((p) => p.symbol === symbol) || INSTRUMENTS[0],
    [symbol],
  )

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <h2 className="text-lg font-bold text-white mb-1">
          پیشنهاد سشن و تایم‌فریم
        </h2>
        <p className="text-sm text-white/55 mb-4">
          جفت‌های اصلی، کراس، فلزات/انرژی و شاخص‌ها — راهنمای کلی نقدینگی، نه
          جایگزین استراتژی شخصی
        </p>

        <label className="block text-xs text-white/50 mb-1">نماد</label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full sm:max-w-md bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white mb-5"
        >
          {GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {INSTRUMENTS.filter((p) => p.group === group).map((p) => (
                <option key={p.symbol} value={p.symbol}>
                  {p.symbol} — {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="text-[11px] text-white/40 mb-3">{pair.group}</div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-4">
            <div className="text-xs text-cyan-200/80 mb-2">سشن‌های مناسب</div>
            <ul className="space-y-1.5">
              {pair.sessions.map((s) => (
                <li key={s} className="text-sm text-white font-medium">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-4">
            <div className="text-xs text-violet-200/80 mb-2">
              تایم‌فریم پیشنهادی
            </div>
            <div className="flex flex-wrap gap-2">
              {pair.timeframes.map((tf) => (
                <span
                  key={tf}
                  className="px-2.5 py-1 rounded-lg bg-black/30 text-white text-sm font-mono"
                >
                  {tf}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-white/55 mt-4 leading-relaxed">{pair.note}</p>
      </section>
    </div>
  )
}
