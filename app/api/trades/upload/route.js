import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Trade from '@/models/Trade'
import Symbol from '@/models/Symbol'
import Message from '@/models/Message'
import { parseMetaTraderFile } from '@/utils/parseMetaTrader'
import { seedDefaultSymbols } from '@/utils/symbolSeed'
import { findSimilarSymbols, normalizeSymbolCode } from '@/utils/symbolMatch'

async function upsertUnknownSymbolTicket({
  userId,
  code,
  count,
  similar,
  fileName,
}) {
  const similarText = similar.length
    ? similar.map((s) => s.code).join('، ')
    : '—'
  const title = `نماد جدید: ${code}`
  const body = [
    `کاربر فایلی با نماد «${code}» بارگذاری کرد.`,
    `تعداد معاملات ذخیره‌شده با این نماد: ${count}`,
    similar.length
      ? `نمادهای نزدیک در فهرست: ${similarText}`
      : 'نماد نزدیک در فهرست پیدا نشد.',
    fileName ? `نام فایل: ${fileName}` : '',
    '',
    'می‌توانید این نماد را با نام و دسته‌بندی به فهرست اضافه کنید یا معاملات مربوط را حذف کنید.',
  ]
    .filter(Boolean)
    .join('\n')

  const existing = await Message.findOne({
    type: 'site_feedback',
    category: 'add_symbol',
    fromUserId: userId,
    'meta.kind': 'unknown_symbol',
    'meta.symbolCode': code,
    $nor: [{ 'meta.resolved': 'approved' }, { 'meta.resolved': 'rejected' }],
    status: { $ne: 'closed' },
  })

  if (existing) {
    existing.title = title
    existing.body = body
    existing.meta = {
      ...(existing.meta || {}),
      kind: 'unknown_symbol',
      symbolCode: code,
      similar,
      tradeCount: (Number(existing.meta?.tradeCount) || 0) + count,
      fileName: fileName || existing.meta?.fileName || null,
      resolved: null,
    }
    existing.status = 'open'
    existing.adminUnread = true
    await existing.save()
    return existing
  }

  return Message.create({
    type: 'site_feedback',
    category: 'add_symbol',
    fromUserId: userId,
    title,
    body,
    status: 'open',
    unreadBy: [],
    adminUnread: true,
    meta: {
      kind: 'unknown_symbol',
      symbolCode: code,
      similar,
      tradeCount: count,
      fileName: fileName || null,
      resolved: null,
    },
  })
}

export async function POST(request) {
  try {
    await connectDB()

    let formData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: 'فایلی انتخاب نشده است' },
        { status: 400 }
      )
    }
    const file = formData.get('file')
    const userId = formData.get('userId')

    if (!file) {
      return NextResponse.json(
        { error: 'فایلی انتخاب نشده است' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }

    const fileName = file.name || ''
    const fileNameLower = fileName.toLowerCase()
    if (
      !fileNameLower.endsWith('.xlsx') &&
      !fileNameLower.endsWith('.xls') &&
      !fileNameLower.endsWith('.csv')
    ) {
      return NextResponse.json(
        { error: 'فقط فایل‌های Excel (.xlsx, .xls) و CSV پشتیبانی می‌شوند' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileType = fileNameLower.endsWith('.csv') ? 'csv' : 'xlsx'

    const result = parseMetaTraderFile(buffer, fileType)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'خطا در خواندن فایل. لطفاً خروجی متاتریدر را بررسی کنید.' },
        { status: 400 }
      )
    }

    if (!result.trades.length) {
      return NextResponse.json(
        {
          error:
            'هیچ معامله معتبری در فایل پیدا نشد. ستون‌های Time، Position، Symbol و نوع buy/sell را بررسی کنید.',
          skippedRows: result.skippedRows || 0,
        },
        { status: 400 }
      )
    }

    if ((await Symbol.countDocuments()) === 0) {
      await seedDefaultSymbols(Symbol, { onlyIfEmpty: true })
    }

    const official = await Symbol.find({ isActive: true })
      .select('code name nameFa category')
      .lean()
    const officialByCode = new Map(
      official.map((s) => [normalizeSymbolCode(s.code), s])
    )

    const savedTrades = []
    const errorItems = []
    const unknownMap = new Map()
    let duplicates = 0

    for (const trade of result.trades) {
      try {
        const code = normalizeSymbolCode(trade.symbol)
        if (!code) {
          errorItems.push({
            trade: trade.positionId,
            symbol: trade.symbol,
            error: 'نماد معامله خالی است',
          })
          continue
        }

        const officialHit = officialByCode.get(code)
        const similar = officialHit ? [] : findSimilarSymbols(code, official)
        const isPending = !officialHit

        const existingTrade = await Trade.findOne({
          userId,
          positionId: trade.positionId,
          openTime: trade.openTime,
        })

        if (existingTrade) {
          duplicates += 1
          continue
        }

        const newTrade = await Trade.create({
          userId,
          ...trade,
          symbol: code,
          symbolPending: isPending,
        })

        savedTrades.push(newTrade)

        if (isPending) {
          const prev = unknownMap.get(code) || { count: 0, similar }
          prev.count += 1
          prev.similar = similar
          unknownMap.set(code, prev)
        }
      } catch (err) {
        errorItems.push({
          trade: trade.positionId,
          symbol: trade.symbol,
          error: err.message || 'خطا در ذخیره معامله',
        })
      }
    }

    const unknownSymbols = []
    for (const [code, info] of unknownMap.entries()) {
      await upsertUnknownSymbolTicket({
        userId,
        code,
        count: info.count,
        similar: info.similar,
        fileName,
      })
      unknownSymbols.push({
        code,
        count: info.count,
        similar: info.similar.map((s) => s.code),
        ticketCreated: true,
      })
    }

    const totalSaved = savedTrades.length
    const parts = [`${totalSaved} معامله ذخیره شد`]
    if (duplicates) parts.push(`${duplicates} تکراری رد شد`)
    if (unknownSymbols.length) {
      parts.push(
        `${unknownSymbols.reduce((n, s) => n + s.count, 0)} معامله با نماد جدید`
      )
    }
    if (errorItems.length) parts.push(`${errorItems.length} معامله ذخیره نشد`)

    return NextResponse.json({
      success: totalSaved > 0,
      message: parts.join(' — '),
      totalParsed: result.trades.length,
      totalSaved,
      duplicates,
      skippedRows: result.skippedRows || 0,
      errors: errorItems.length,
      errorItems,
      unknownSymbols,
    })
  } catch (error) {
    console.error('Upload Trades Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور در بارگذاری فایل' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
