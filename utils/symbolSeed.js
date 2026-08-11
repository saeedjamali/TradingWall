/**
 * Default trading symbols seed — MT/broker-style codes
 */

export const CATEGORY_LABELS = {
  forex_major: 'فارکس — جفت‌ارزهای اصلی',
  forex_minor: 'فارکس — جفت‌ارزهای فرعی',
  forex_exotic: 'فارکس — اگزاتیک',
  metals: 'فلزات گران‌بها',
  energy: 'انرژی و نفتی‌ها',
  indices: 'شاخص‌ها',
  crypto: 'رمز ارزها',
  stocks: 'سهام محبوب',
  commodities: 'کالاها',
  other: 'سایر',
}

/** @type {Array<{ code: string, name: string, nameFa: string, category: string, sortOrder?: number }>} */
export const DEFAULT_SYMBOLS = [
  // —— Indices ——
  { code: 'US30', name: 'Dow Jones 30', nameFa: 'داوجونز ۳۰', category: 'indices', sortOrder: 10 },
  { code: 'US30_i', name: 'Dow Jones 30 CFD', nameFa: 'داوجونز ۳۰', category: 'indices', sortOrder: 11 },
  { code: 'US500', name: 'S&P 500', nameFa: 'اس‌اند‌پی ۵۰۰', category: 'indices', sortOrder: 20 },
  { code: 'SPX500', name: 'S&P 500', nameFa: 'اس‌اند‌پی ۵۰۰', category: 'indices', sortOrder: 21 },
  { code: 'NAS100', name: 'Nasdaq 100', nameFa: 'نزدک ۱۰۰', category: 'indices', sortOrder: 30 },
  { code: 'USTEC', name: 'US Tech 100', nameFa: 'نزدک / تک ۱۰۰', category: 'indices', sortOrder: 31 },
  { code: 'GER40', name: 'DAX 40', nameFa: 'داکس آلمان', category: 'indices', sortOrder: 40 },
  { code: 'DE40', name: 'Germany 40', nameFa: 'شاخص آلمان ۴۰', category: 'indices', sortOrder: 41 },
  { code: 'UK100', name: 'FTSE 100', nameFa: 'فوتسی ۱۰۰', category: 'indices', sortOrder: 50 },
  { code: 'FRA40', name: 'CAC 40', nameFa: 'کک ۴۰ فرانسه', category: 'indices', sortOrder: 60 },
  { code: 'EU50', name: 'Euro Stoxx 50', nameFa: 'یورو استوکس ۵۰', category: 'indices', sortOrder: 70 },
  { code: 'JP225', name: 'Nikkei 225', nameFa: 'نیکی ۲۲۵', category: 'indices', sortOrder: 80 },
  { code: 'HK50', name: 'Hang Seng 50', nameFa: 'هنگ‌سنگ', category: 'indices', sortOrder: 90 },
  { code: 'AUS200', name: 'ASX 200', nameFa: 'شاخص استرالیا', category: 'indices', sortOrder: 100 },
  { code: 'CHINA50', name: 'China A50', nameFa: 'چین A50', category: 'indices', sortOrder: 110 },
  { code: 'VIX', name: 'Volatility Index', nameFa: 'شاخص نوسان VIX', category: 'indices', sortOrder: 120 },

  // —— Energy ——
  { code: 'XTIUSD', name: 'WTI Crude Oil', nameFa: 'نفت خام WTI', category: 'energy', sortOrder: 10 },
  { code: 'USOIL', name: 'US Oil (WTI)', nameFa: 'نفت آمریکا', category: 'energy', sortOrder: 11 },
  { code: 'WTI', name: 'WTI Crude', nameFa: 'نفت WTI', category: 'energy', sortOrder: 12 },
  { code: 'XBRUSD', name: 'Brent Crude Oil', nameFa: 'نفت برنت', category: 'energy', sortOrder: 20 },
  { code: 'UKOIL', name: 'UK Oil (Brent)', nameFa: 'نفت برنت', category: 'energy', sortOrder: 21 },
  { code: 'BRENT', name: 'Brent Oil', nameFa: 'برنت', category: 'energy', sortOrder: 22 },
  { code: 'XNGUSD', name: 'Natural Gas', nameFa: 'گاز طبیعی', category: 'energy', sortOrder: 30 },
  { code: 'NATGAS', name: 'Natural Gas', nameFa: 'گاز طبیعی', category: 'energy', sortOrder: 31 },

  // —— Metals ——
  { code: 'XAUUSD', name: 'Gold vs USD', nameFa: 'طلا', category: 'metals', sortOrder: 10 },
  { code: 'GOLD', name: 'Gold', nameFa: 'طلا', category: 'metals', sortOrder: 11 },
  { code: 'XAGUSD', name: 'Silver vs USD', nameFa: 'نقره', category: 'metals', sortOrder: 20 },
  { code: 'SILVER', name: 'Silver', nameFa: 'نقره', category: 'metals', sortOrder: 21 },
  { code: 'XPTUSD', name: 'Platinum vs USD', nameFa: 'پلاتین', category: 'metals', sortOrder: 30 },
  { code: 'XPDUSD', name: 'Palladium vs USD', nameFa: 'پالادیوم', category: 'metals', sortOrder: 40 },
  { code: 'COPPER', name: 'Copper', nameFa: 'مس', category: 'metals', sortOrder: 50 },

  // —— Crypto ——
  { code: 'BTCUSD', name: 'Bitcoin', nameFa: 'بیت‌کوین', category: 'crypto', sortOrder: 10 },
  { code: 'ETHUSD', name: 'Ethereum', nameFa: 'اتریوم', category: 'crypto', sortOrder: 20 },
  { code: 'BNBUSD', name: 'BNB', nameFa: 'بایننس کوین', category: 'crypto', sortOrder: 30 },
  { code: 'SOLUSD', name: 'Solana', nameFa: 'سولانا', category: 'crypto', sortOrder: 40 },
  { code: 'XRPUSD', name: 'Ripple', nameFa: 'ریپل', category: 'crypto', sortOrder: 50 },
  { code: 'ADAUSD', name: 'Cardano', nameFa: 'کاردانو', category: 'crypto', sortOrder: 60 },
  { code: 'DOGEUSD', name: 'Dogecoin', nameFa: 'دوج‌کوین', category: 'crypto', sortOrder: 70 },
  { code: 'DOTUSD', name: 'Polkadot', nameFa: 'پولکادات', category: 'crypto', sortOrder: 80 },
  { code: 'AVAXUSD', name: 'Avalanche', nameFa: 'آوالانچ', category: 'crypto', sortOrder: 90 },
  { code: 'LINKUSD', name: 'Chainlink', nameFa: 'چین‌لینک', category: 'crypto', sortOrder: 100 },
  { code: 'MATICUSD', name: 'Polygon', nameFa: 'پالیگان', category: 'crypto', sortOrder: 110 },
  { code: 'LTCUSD', name: 'Litecoin', nameFa: 'لایت‌کوین', category: 'crypto', sortOrder: 120 },
  { code: 'ATOMUSD', name: 'Cosmos', nameFa: 'کازموس', category: 'crypto', sortOrder: 130 },
  { code: 'UNIUSD', name: 'Uniswap', nameFa: 'یونی‌سواپ', category: 'crypto', sortOrder: 140 },
  { code: 'NEARUSD', name: 'NEAR Protocol', nameFa: 'نیر', category: 'crypto', sortOrder: 150 },

  // —— Forex majors ——
  { code: 'EURUSD', name: 'Euro vs US Dollar', nameFa: 'یورو / دلار', category: 'forex_major', sortOrder: 10 },
  { code: 'GBPUSD', name: 'British Pound vs USD', nameFa: 'پوند / دلار', category: 'forex_major', sortOrder: 20 },
  { code: 'USDJPY', name: 'US Dollar vs Yen', nameFa: 'دلار / ین', category: 'forex_major', sortOrder: 30 },
  { code: 'USDCHF', name: 'US Dollar vs Franc', nameFa: 'دلار / فرانک', category: 'forex_major', sortOrder: 40 },
  { code: 'AUDUSD', name: 'Aussie vs USD', nameFa: 'دلار استرالیا / دلار', category: 'forex_major', sortOrder: 50 },
  { code: 'USDCAD', name: 'US Dollar vs CAD', nameFa: 'دلار / دلار کانادا', category: 'forex_major', sortOrder: 60 },
  { code: 'NZDUSD', name: 'Kiwi vs USD', nameFa: 'دلار نیوزیلند / دلار', category: 'forex_major', sortOrder: 70 },

  // —— Forex minors ——
  { code: 'EURGBP', name: 'Euro vs Pound', nameFa: 'یورو / پوند', category: 'forex_minor', sortOrder: 10 },
  { code: 'EURJPY', name: 'Euro vs Yen', nameFa: 'یورو / ین', category: 'forex_minor', sortOrder: 20 },
  { code: 'GBPJPY', name: 'Pound vs Yen', nameFa: 'پوند / ین', category: 'forex_minor', sortOrder: 30 },
  { code: 'AUDJPY', name: 'Aussie vs Yen', nameFa: 'استرالیا / ین', category: 'forex_minor', sortOrder: 40 },
  { code: 'EURAUD', name: 'Euro vs Aussie', nameFa: 'یورو / استرالیا', category: 'forex_minor', sortOrder: 50 },
  { code: 'EURCAD', name: 'Euro vs CAD', nameFa: 'یورو / کانادا', category: 'forex_minor', sortOrder: 60 },
  { code: 'EURCHF', name: 'Euro vs Franc', nameFa: 'یورو / فرانک', category: 'forex_minor', sortOrder: 70 },
  { code: 'GBPCHF', name: 'Pound vs Franc', nameFa: 'پوند / فرانک', category: 'forex_minor', sortOrder: 80 },
  { code: 'GBPAUD', name: 'Pound vs Aussie', nameFa: 'پوند / استرالیا', category: 'forex_minor', sortOrder: 90 },
  { code: 'AUDCAD', name: 'Aussie vs CAD', nameFa: 'استرالیا / کانادا', category: 'forex_minor', sortOrder: 100 },
  { code: 'AUDNZD', name: 'Aussie vs Kiwi', nameFa: 'استرالیا / نیوزیلند', category: 'forex_minor', sortOrder: 110 },
  { code: 'CADJPY', name: 'CAD vs Yen', nameFa: 'کانادا / ین', category: 'forex_minor', sortOrder: 120 },
  { code: 'CHFJPY', name: 'Franc vs Yen', nameFa: 'فرانک / ین', category: 'forex_minor', sortOrder: 130 },
  { code: 'NZDJPY', name: 'Kiwi vs Yen', nameFa: 'نیوزیلند / ین', category: 'forex_minor', sortOrder: 140 },

  // —— Forex exotic ——
  { code: 'USDTRY', name: 'USD vs Turkish Lira', nameFa: 'دلار / لیر ترکیه', category: 'forex_exotic', sortOrder: 10 },
  { code: 'USDZAR', name: 'USD vs Rand', nameFa: 'دلار / رند', category: 'forex_exotic', sortOrder: 20 },
  { code: 'USDSEK', name: 'USD vs Krona', nameFa: 'دلار / کرون سوئد', category: 'forex_exotic', sortOrder: 30 },
  { code: 'USDNOK', name: 'USD vs Krone', nameFa: 'دلار / کرون نروژ', category: 'forex_exotic', sortOrder: 40 },
  { code: 'USDMXN', name: 'USD vs Peso', nameFa: 'دلار / پزو مکزیک', category: 'forex_exotic', sortOrder: 50 },
  { code: 'USDSGD', name: 'USD vs Singapore Dollar', nameFa: 'دلار / دلار سنگاپور', category: 'forex_exotic', sortOrder: 60 },
  { code: 'USDHKD', name: 'USD vs Hong Kong Dollar', nameFa: 'دلار / دلار هنگ‌کنگ', category: 'forex_exotic', sortOrder: 70 },
  { code: 'EURTRY', name: 'Euro vs Lira', nameFa: 'یورو / لیر', category: 'forex_exotic', sortOrder: 80 },

  // —— Popular stocks (CFD) ——
  { code: 'AAPL', name: 'Apple', nameFa: 'اپل', category: 'stocks', sortOrder: 10 },
  { code: 'MSFT', name: 'Microsoft', nameFa: 'مایکروسافت', category: 'stocks', sortOrder: 20 },
  { code: 'GOOGL', name: 'Alphabet', nameFa: 'گوگل', category: 'stocks', sortOrder: 30 },
  { code: 'AMZN', name: 'Amazon', nameFa: 'آمازون', category: 'stocks', sortOrder: 40 },
  { code: 'TSLA', name: 'Tesla', nameFa: 'تسلا', category: 'stocks', sortOrder: 50 },
  { code: 'NVDA', name: 'NVIDIA', nameFa: 'انویدیا', category: 'stocks', sortOrder: 60 },
  { code: 'META', name: 'Meta Platforms', nameFa: 'متا', category: 'stocks', sortOrder: 70 },
  { code: 'NFLX', name: 'Netflix', nameFa: 'نتفلیکس', category: 'stocks', sortOrder: 80 },

  // —— Commodities ——
  { code: 'WHEAT', name: 'Wheat', nameFa: 'گندم', category: 'commodities', sortOrder: 10 },
  { code: 'CORN', name: 'Corn', nameFa: 'ذرت', category: 'commodities', sortOrder: 20 },
  { code: 'SOYBEAN', name: 'Soybean', nameFa: 'سویا', category: 'commodities', sortOrder: 30 },
  { code: 'COFFEE', name: 'Coffee', nameFa: 'قهوه', category: 'commodities', sortOrder: 40 },
  { code: 'COCOA', name: 'Cocoa', nameFa: 'کاکائو', category: 'commodities', sortOrder: 50 },
  { code: 'SUGAR', name: 'Sugar', nameFa: 'شکر', category: 'commodities', sortOrder: 60 },
  { code: 'COTTON', name: 'Cotton', nameFa: 'پنبه', category: 'commodities', sortOrder: 70 },
]

export async function seedDefaultSymbols(SymbolModel, { onlyIfEmpty = true } = {}) {
  if (onlyIfEmpty) {
    const count = await SymbolModel.countDocuments()
    if (count > 0) {
      return { inserted: 0, skipped: count, message: 'جدول نمادها از قبل پر است' }
    }
  }

  let inserted = 0
  let skipped = 0

  for (const item of DEFAULT_SYMBOLS) {
    const code = item.code.toUpperCase()
    const existing = await SymbolModel.findOne({ code })
    if (existing) {
      skipped += 1
      continue
    }
    await SymbolModel.create({
      code,
      name: item.name,
      nameFa: item.nameFa || '',
      category: item.category,
      isActive: true,
      sortOrder: item.sortOrder ?? 0,
    })
    inserted += 1
  }

  return {
    inserted,
    skipped,
    message: `${inserted} نماد اضافه شد${skipped ? `، ${skipped} تکراری رد شد` : ''}`,
  }
}

export async function assertActiveSymbol(SymbolModel, code) {
  if (!code || typeof code !== 'string') {
    return { ok: false, error: 'نماد معاملاتی الزامی است' }
  }
  const normalized = code.trim().toUpperCase()
  const symbol = await SymbolModel.findOne({ code: normalized, isActive: true }).lean()
  if (!symbol) {
    return { ok: false, error: `نماد «${normalized}» در سیستم تعریف نشده یا غیرفعال است` }
  }
  return { ok: true, symbol, code: normalized }
}
