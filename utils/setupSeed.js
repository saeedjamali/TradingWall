/**
 * Default standard trading setups — shared across all users
 */

/** @type {Array<{ title: string, description: string }>} */
export const DEFAULT_STANDARD_SETUPS = [
  {
    title: 'Breakout',
    description: 'شکست سطح حمایت/مقاومت یا رنج با تأیید حجم و ادامه حرکت',
  },
  {
    title: 'Pullback',
    description: 'ورود در پولبک به روند اصلی پس از اصلاح کوتاه‌مدت',
  },
  {
    title: 'Trend Continuation',
    description: 'ادامه روند با ساختار HH/HL یا LH/LL و ورود در جهت روند',
  },
  {
    title: 'Reversal',
    description: 'بازگشت از ناحیه اشباع با تأیید کندل یا واگرایی',
  },
  {
    title: 'Support / Resistance Bounce',
    description: 'واکنش به سطح افقی حمایت یا مقاومت و ورود در جهت برگشت',
  },
  {
    title: 'Order Block',
    description: 'ورود از اوردربلاک نهادی پس از بازگشت قیمت به ناحیه',
  },
  {
    title: 'Fair Value Gap (FVG)',
    description: 'پر کردن گپ ارزش منصفانه و ورود در جهت ایمبالانس',
  },
  {
    title: 'Liquidity Sweep',
    description: 'جمع‌آوری نقدینگی بالای های/لو و برگشت سریع قیمت',
  },
  {
    title: 'London Open',
    description: 'ستاپ‌های مرتبط با باز شدن سشن لندن و گسترش رنج آسیا',
  },
  {
    title: 'New York Open',
    description: 'حرکت‌های پرنوسان ابتدای سشن نیویورک و شکست رنج لندن',
  },
  {
    title: 'Asian Range Break',
    description: 'شکست رنج آسیایی در سشن اروپا یا آمریکا',
  },
  {
    title: 'News Spike Fade',
    description: 'برگشت پس از اسپایک خبری و ورود در خلاف جهت اسپایک اولیه',
  },
  {
    title: 'Scalp Momentum',
    description: 'ورود کوتاه‌مدت روی مومنتوم قوی با تارگت کوچک',
  },
  {
    title: 'Swing Structure',
    description: 'معامله بر اساس سوئینگ‌های بالاتر/پایین‌تر در تایم‌فریم بالاتر',
  },
  {
    title: 'Supply / Demand Zone',
    description: 'ورود از زون عرضه یا تقاضا با تأیید ریجکت کندلی',
  },
  {
    title: 'Fibonacci Retracement',
    description: 'ورود در سطوح اصلاح فیبوناچی (۳۸٫۲٪ / ۵۰٪ / ۶۱٫۸٪) در جهت روند',
  },
  {
    title: 'Moving Average Bounce',
    description: 'واکنش به میانگین متحرک پویا (مثلاً ۵۰/۲۰۰) به‌عنوان حمایت/مقاومت',
  },
  {
    title: 'Double Top / Bottom',
    description: 'الگوی سقف/کف دوقلو و ورود پس از شکست خط گردن',
  },
  {
    title: 'Flag / Pennant',
    description: 'ادامه روند پس از فشردگی پرچم یا پرچم سه‌گوش',
  },
  {
    title: 'Range Mean Reversion',
    description: 'معامله داخل رنج از لبه‌ها به سمت میانگین رنج',
  },
]

/**
 * Insert missing standard setups (matched by title, case-insensitive).
 * @param {import('mongoose').Model} SetupModel
 * @param {{ onlyIfEmpty?: boolean }} [opts]
 */
export async function seedDefaultSetups(SetupModel, { onlyIfEmpty = false } = {}) {
  if (onlyIfEmpty) {
    const count = await SetupModel.countDocuments({ type: 'standard' })
    if (count > 0) {
      return {
        inserted: 0,
        skipped: count,
        message: 'ستاپ‌های استاندارد از قبل وجود دارند',
      }
    }
  }

  let inserted = 0
  let skipped = 0

  for (const item of DEFAULT_STANDARD_SETUPS) {
    const title = item.title.trim()
    const existing = await SetupModel.findOne({
      type: 'standard',
      title: { $regex: `^${escapeRegex(title)}$`, $options: 'i' },
    })
    if (existing) {
      skipped += 1
      continue
    }
    await SetupModel.create({
      title,
      description: item.description || '',
      type: 'standard',
      userId: null,
    })
    inserted += 1
  }

  return {
    inserted,
    skipped,
    totalDefaults: DEFAULT_STANDARD_SETUPS.length,
    message: `${inserted} ستاپ استاندارد اضافه شد${
      skipped ? `، ${skipped} مورد از قبل وجود داشت` : ''
    }`,
  }
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
