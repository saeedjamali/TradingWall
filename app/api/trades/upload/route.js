import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Trade from '@/models/Trade'
import Symbol from '@/models/Symbol'
import { parseMetaTraderFile } from '@/utils/parseMetaTrader'
import { assertActiveSymbol, seedDefaultSymbols } from '@/utils/symbolSeed'

export async function POST(request) {
  try {
    await connectDB()
    
    // Get user from session (implement later with NextAuth)
    // For now, we'll expect userId in body
    const formData = await request.formData()
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
    
    // Check file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'فقط فایل‌های Excel (.xlsx, .xls) و CSV پشتیبانی می‌شوند' },
        { status: 400 }
      )
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Determine file type
    const fileType = fileName.endsWith('.csv') ? 'csv' : 'xlsx'
    
    // Parse MetaTrader file
    const result = parseMetaTraderFile(buffer, fileType)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    // Ensure default symbols exist for validation
    if ((await Symbol.countDocuments()) === 0) {
      await seedDefaultSymbols(Symbol, { onlyIfEmpty: true })
    }

    // Save trades to database
    const savedTrades = []
    const errors = []
    
    for (const trade of result.trades) {
      try {
        const symbolCheck = await assertActiveSymbol(Symbol, trade.symbol)
        if (!symbolCheck.ok) {
          errors.push({
            trade: trade.positionId,
            error: symbolCheck.error,
          })
          continue
        }
        trade.symbol = symbolCheck.code

        // Check if trade already exists
        const existingTrade = await Trade.findOne({
          userId,
          positionId: trade.positionId,
          openTime: trade.openTime,
        })
        
        if (existingTrade) {
          continue // Skip duplicate
        }
        
        const newTrade = await Trade.create({
          userId,
          ...trade,
        })
        
        savedTrades.push(newTrade)
      } catch (err) {
        errors.push({
          trade: trade.positionId,
          error: err.message,
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${savedTrades.length} معامله با موفقیت ذخیره شد`,
      totalParsed: result.trades.length,
      totalSaved: savedTrades.length,
      duplicates: result.trades.length - savedTrades.length - errors.length,
      errors: errors.length,
    })
    
  } catch (error) {
    console.error('Upload Trades Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
