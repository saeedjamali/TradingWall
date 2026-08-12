/**
 * Demo users + annual trades for leaderboard / public trading walls.
 * Marked with User.isDemo — safe to seed/clear from admin panel.
 */

import bcrypt from 'bcryptjs'
import User from '@/models/User'
import Trade from '@/models/Trade'
import Plan from '@/models/Plan'
import Setup from '@/models/Setup'
import Activity from '@/models/Activity'
import Achievement from '@/models/Achievement'
import LeaderboardSnapshot from '@/models/LeaderboardSnapshot'
import { seedDefaultSymbols } from '@/utils/symbolSeed'

export const DEMO_PHONE_PREFIX = '09000000'
export const DEMO_PASSWORD = 'Demo@1234'

/** 10 realistic Persian trader profiles */
export const DEMO_USERS = [
  {
    phone: '09000000001',
    publicName: 'آرمان کاظمی',
    province: 'تهران',
    city: 'تهران',
    capital: 25000,
    verified: true,
    winRate: 0.62,
    avgWin: 85,
    avgLoss: -48,
  },
  {
    phone: '09000000002',
    publicName: 'سارا موسوی',
    province: 'اصفهان',
    city: 'اصفهان',
    capital: 15000,
    verified: true,
    winRate: 0.58,
    avgWin: 72,
    avgLoss: -55,
  },
  {
    phone: '09000000003',
    publicName: 'مهراد نوری',
    province: 'فارس',
    city: 'شیراز',
    capital: 20000,
    verified: false,
    winRate: 0.55,
    avgWin: 95,
    avgLoss: -60,
  },
  {
    phone: '09000000004',
    publicName: 'نیلوفر احمدی',
    province: 'خراسان رضوی',
    city: 'مشهد',
    capital: 12000,
    verified: true,
    winRate: 0.67,
    avgWin: 55,
    avgLoss: -40,
  },
  {
    phone: '09000000005',
    publicName: 'پارسا رضایی',
    province: 'آذربایجان شرقی',
    city: 'تبریز',
    capital: 30000,
    verified: false,
    winRate: 0.51,
    avgWin: 110,
    avgLoss: -70,
  },
  {
    phone: '09000000006',
    publicName: 'یاسمن کریمی',
    province: 'گیلان',
    city: 'رشت',
    capital: 18000,
    verified: true,
    winRate: 0.6,
    avgWin: 68,
    avgLoss: -45,
  },
  {
    phone: '09000000007',
    publicName: 'کیان حسینی',
    province: 'خوزستان',
    city: 'اهواز',
    capital: 22000,
    verified: false,
    winRate: 0.54,
    avgWin: 88,
    avgLoss: -62,
  },
  {
    phone: '09000000008',
    publicName: 'آتنا جعفری',
    province: 'مازندران',
    city: 'ساری',
    capital: 14000,
    verified: true,
    winRate: 0.64,
    avgWin: 60,
    avgLoss: -38,
  },
  {
    phone: '09000000009',
    publicName: 'دانیال اکبری',
    province: 'کرمان',
    city: 'کرمان',
    capital: 28000,
    verified: false,
    winRate: 0.49,
    avgWin: 130,
    avgLoss: -85,
  },
  {
    phone: '09000000010',
    publicName: 'مریم شریفی',
    province: 'البرز',
    city: 'کرج',
    capital: 16000,
    verified: true,
    winRate: 0.59,
    avgWin: 78,
    avgLoss: -50,
  },
]

const TRADE_SYMBOLS = [
  'XAUUSD',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'NAS100',
  'US30',
  'BTCUSD',
  'ETHUSD',
  'USOIL',
  'XAGUSD',
  'AUDUSD',
  'GER40',
]

const SETUP_TEMPLATES = [
  { title: 'Breakout London', description: 'شکست رنج لندن با تایید حجم' },
  { title: 'Order Block Retest', description: 'ری‌تست اوردربلاک و ورود با تأیید' },
  { title: 'Trend Pullback', description: 'پولبک در روند روزانه' },
  { title: 'News Fade', description: 'برگشت پس از اسپایک خبری' },
]

const ACTIVITY_TEMPLATES = [
  {
    title: 'مرور ژورنال هفتگی',
    description: 'بررسی اشتباهات و ستاپ‌های برنده',
    type: 'practice',
  },
  {
    title: 'دوره پرایس‌اکشن',
    description: 'تکمیل ماژول ساختار بازار',
    type: 'course',
  },
  {
    title: 'ویدیو تحلیل طلا',
    description: 'مرور سناریوهای XAUUSD',
    type: 'video',
  },
]

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function round(n, digits = 2) {
  const p = 10 ** digits
  return Math.round(n * p) / p
}

function startOfLocalDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d, days) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function isWeekend(d) {
  const day = d.getDay()
  return day === 0 || day === 6
}

function atLocalTime(day, hour, minute, second = 0) {
  const x = startOfLocalDay(day)
  x.setHours(hour, minute, second, 0)
  return x
}

/**
 * Spread ~255 closes across the year (local calendar), denser near "now"
 * so week (≥5) and month (≥20) leaderboards fill.
 */
function buildCloseTimes(rng, now = new Date()) {
  const year = now.getFullYear()
  const yearStart = new Date(year, 0, 2, 8, 0, 0)
  const monthStart = new Date(year, now.getMonth(), 1, 8, 0, 0)
  const weekStart = startOfLocalDay(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Sunday

  const times = []
  const pushDay = (day, force = false) => {
    if (!force && isWeekend(day)) return
    const h = 7 + Math.floor(rng() * 10)
    const m = Math.floor(rng() * 60)
    times.push(atLocalTime(day, h, m, Math.floor(rng() * 60)))
  }

  // Current week: at least 2 closes on each weekday so far
  for (let d = 0; d < 7; d++) {
    const day = addDays(weekStart, d)
    if (day > now) break
    if (isWeekend(day)) continue
    pushDay(day, true)
    if (rng() > 0.35) pushDay(day, true)
  }

  // Rest of current month → ~30
  let cursor = addDays(now, -1)
  while (times.length < 30 && cursor >= monthStart) {
    pushDay(cursor)
    cursor = addDays(cursor, -1)
  }

  // Rest of year → ~255
  const target = 255
  cursor = addDays(monthStart, -1)
  while (times.length < target && cursor >= yearStart) {
    if (!isWeekend(cursor) && rng() > 0.32) {
      const tradesToday = 1 + (rng() > 0.65 ? 1 : 0)
      for (let t = 0; t < tradesToday && times.length < target; t++) {
        pushDay(cursor, true)
      }
    }
    cursor = addDays(cursor, -1)
  }

  times.sort((a, b) => a - b)
  return times
}

function symbolPrice(symbol, rng) {
  const base = {
    XAUUSD: 2350,
    EURUSD: 1.085,
    GBPUSD: 1.27,
    USDJPY: 149.5,
    NAS100: 18500,
    US30: 39500,
    BTCUSD: 64000,
    ETHUSD: 3200,
    USOIL: 78,
    XAGUSD: 28,
    AUDUSD: 0.66,
    GER40: 18200,
  }[symbol] || 100

  const noise = (rng() - 0.5) * base * 0.002
  return base + noise
}

function buildTrade({
  userId,
  positionId,
  closeTime,
  profile,
  rng,
  setupIds,
}) {
  const symbol = pick(rng, TRADE_SYMBOLS)
  const type = rng() > 0.5 ? 'buy' : 'sell'
  const openPrice = round(symbolPrice(symbol, rng), symbol.includes('USD') && symbol.length === 6 && !['XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD', 'USOIL'].includes(symbol) ? 5 : 2)
  const isWin = rng() < profile.winRate
  const profitBase = isWin ? profile.avgWin : profile.avgLoss
  const profit = round(profitBase * (0.7 + rng() * 0.7), 2)
  const durationMin = 15 + Math.floor(rng() * 240)
  const openTime = new Date(closeTime.getTime() - durationMin * 60 * 1000)
  const pipMove =
    Math.abs(profit) / (10 + rng() * 40) * (type === 'buy' ? (isWin ? 1 : -1) : isWin ? -1 : 1)
  const closePrice = round(openPrice + pipMove * (openPrice > 50 ? 1 : 0.0001), openPrice > 50 ? 2 : 5)
  const volume = round(0.1 + rng() * 1.4, 2)

  const assignedSetups =
    setupIds.length && rng() > 0.35
      ? [pick(rng, setupIds)]
      : []

  return {
    userId,
    positionId,
    symbol,
    type,
    volume,
    openPrice,
    closePrice,
    stopLoss: null,
    takeProfit: null,
    openTime,
    closeTime,
    commission: round(-(0.5 + rng() * 2), 2),
    swap: round((rng() - 0.5) * 1.5, 2),
    profit,
    setupIds: assignedSetups,
    notes: isWin ? 'اجرای تمیز ستاپ' : 'خروج زودهنگام / نقض پلن',
    tradeImage: null,
  }
}

export async function getDemoDataStatus() {
  const users = await User.find({ isDemo: true })
    .select('_id phone publicName verified privacySettings createdAt')
    .lean()
  const userIds = users.map((u) => u._id)
  const [tradeCount, planCount, setupCount, activityCount] = await Promise.all([
    userIds.length ? Trade.countDocuments({ userId: { $in: userIds } }) : 0,
    userIds.length ? Plan.countDocuments({ userId: { $in: userIds } }) : 0,
    userIds.length
      ? Setup.countDocuments({ userId: { $in: userIds }, type: 'custom' })
      : 0,
    userIds.length ? Activity.countDocuments({ userId: { $in: userIds } }) : 0,
  ])

  return {
    userCount: users.length,
    tradeCount,
    planCount,
    setupCount,
    activityCount,
    users: users.map((u) => ({
      id: u._id,
      phone: u.phone,
      publicName: u.publicName,
      verified: u.verified,
      wallPublic: !!u.privacySettings?.isPublic,
    })),
  }
}

async function clearLiveLeaderboardCache() {
  await LeaderboardSnapshot.deleteMany({ isFinal: false })
}

/**
 * Remove all demo users and related documents.
 */
export async function clearDemoData() {
  const demoUsers = await User.find({ isDemo: true }).select('_id').lean()
  const ids = demoUsers.map((u) => u._id)

  if (ids.length === 0) {
    await clearLiveLeaderboardCache()
    return {
      deletedUsers: 0,
      deletedTrades: 0,
      deletedPlans: 0,
      deletedSetups: 0,
      deletedActivities: 0,
      deletedAchievements: 0,
    }
  }

  const [
    trades,
    plans,
    setups,
    activities,
    achievements,
  ] = await Promise.all([
    Trade.deleteMany({ userId: { $in: ids } }),
    Plan.deleteMany({ userId: { $in: ids } }),
    Setup.deleteMany({ userId: { $in: ids }, type: 'custom' }),
    Activity.deleteMany({ userId: { $in: ids } }),
    Achievement.deleteMany({ userId: { $in: ids } }),
  ])

  const users = await User.deleteMany({ _id: { $in: ids } })
  await clearLiveLeaderboardCache()

  return {
    deletedUsers: users.deletedCount || 0,
    deletedTrades: trades.deletedCount || 0,
    deletedPlans: plans.deletedCount || 0,
    deletedSetups: setups.deletedCount || 0,
    deletedActivities: activities.deletedCount || 0,
    deletedAchievements: achievements.deletedCount || 0,
  }
}

/**
 * Seed 10 demo users with ~255 trades each for current year + wall content.
 * @param {{ SymbolModel?: import('mongoose').Model, replace?: boolean }} opts
 */
export async function seedDemoData(opts = {}) {
  const { SymbolModel = null, replace = false } = opts

  const existing = await User.countDocuments({ isDemo: true })
  if (existing > 0 && !replace) {
    return {
      skipped: true,
      message: 'دیتای دمو از قبل وجود دارد. برای جایگزینی، گزینه «جایگزینی» را بزنید.',
      existing,
    }
  }

  if (existing > 0 && replace) {
    await clearDemoData()
  }

  // Ensure symbols exist so UI filters stay consistent
  if (SymbolModel) {
    await seedDefaultSymbols(SymbolModel, { onlyIfEmpty: true })
  }

  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, salt)
  const now = new Date()

  let createdUsers = 0
  let createdTrades = 0
  let createdPlans = 0
  let createdSetups = 0
  let createdActivities = 0

  for (let i = 0; i < DEMO_USERS.length; i++) {
    const profile = DEMO_USERS[i]
    const rng = mulberry32(1000 + i * 97)

    const user = await User.create({
      phone: profile.phone,
      password: passwordHash,
      publicName: profile.publicName,
      province: profile.province,
      city: profile.city,
      capital: profile.capital,
      role: 'user',
      verified: profile.verified,
      isActive: true,
      isDemo: true,
      privacySettings: {
        isPublic: true,
        showCalendar: true,
        showAchievements: true,
        showActivities: true,
        showSetups: true,
        allowJobOffers: i % 3 === 0,
      },
      createdAt: new Date(now.getFullYear(), 0, 5 + i),
    })
    createdUsers += 1

    const setups = await Setup.insertMany(
      SETUP_TEMPLATES.slice(0, 2 + (i % 3)).map((s) => ({
        ...s,
        type: 'custom',
        userId: user._id,
      })),
    )
    createdSetups += setups.length
    const setupIds = setups.map((s) => s._id)

    const closeTimes = buildCloseTimes(rng, now)
    const trades = closeTimes.map((closeTime, idx) =>
      buildTrade({
        userId: user._id,
        positionId: `DEMO${String(i + 1).padStart(2, '0')}${String(idx + 1).padStart(5, '0')}`,
        closeTime,
        profile,
        rng,
        setupIds,
      }),
    )
    await Trade.insertMany(trades, { ordered: false })
    createdTrades += trades.length

    // A handful of daily plans across recent months
    const planDocs = []
    for (let p = 0; p < 12; p++) {
      const day = addDays(now, -(p * 7 + Math.floor(rng() * 3)))
      if (day.getUTCFullYear() !== now.getUTCFullYear()) continue
      planDocs.push({
        userId: user._id,
        date: startOfLocalDay(day),
        period: 'daily',
        maxTrades: 3 + Math.floor(rng() * 3),
        maxLoss: 100 + Math.floor(rng() * 150),
        maxLossPercent: 1 + rng(),
        targetProfit: 150 + Math.floor(rng() * 200),
        notes: 'پلن دمو — تمرکز روی کیفیت ورود',
        mood: pick(rng, ['calm', 'focused', 'confident', 'neutral']),
      })
    }
    if (planDocs.length) {
      try {
        const inserted = await Plan.insertMany(planDocs, { ordered: false })
        createdPlans += inserted.length
      } catch (err) {
        createdPlans += err?.insertedDocs?.length || 0
      }
    }

    const activities = ACTIVITY_TEMPLATES.map((a, ai) => ({
      ...a,
      userId: user._id,
      date: addDays(now, -(ai * 10 + i)),
    }))
    await Activity.insertMany(activities)
    createdActivities += activities.length
  }

  await clearLiveLeaderboardCache()

  return {
    skipped: false,
    createdUsers,
    createdTrades,
    createdPlans,
    createdSetups,
    createdActivities,
    passwordHint: DEMO_PASSWORD,
    phones: DEMO_USERS.map((u) => u.phone),
  }
}
