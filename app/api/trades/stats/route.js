import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Trade from '@/models/Trade'
import {
  calculateWinRate,
  calculateTotalProfitLoss,
  calculateAverageProfitPerTrade,
  getBestAndWorstTrades,
  calculateMaxDrawdown,
  groupTradesBySymbol,
} from '@/utils/tradeAnalysis'

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر مشخص نشده است' },
        { status: 400 }
      )
    }
    
    // Build query
    const query = { userId }
    if (startDate || endDate) {
      query.closeTime = {}
      if (startDate) query.closeTime.$gte = new Date(startDate)
      if (endDate) query.closeTime.$lte = new Date(endDate)
    }
    
    // Fetch trades
    const trades = await Trade.find(query).sort({ closeTime: 1 })
    
    if (trades.length === 0) {
      return NextResponse.json({
        success: true,
        stats: null,
        message: 'معامله‌ای یافت نشد',
      })
    }
    
    // Calculate statistics
    const winRate = calculateWinRate(trades)
    const totalProfitLoss = calculateTotalProfitLoss(trades)
    const averageProfit = calculateAverageProfitPerTrade(trades)
    const { best, worst } = getBestAndWorstTrades(trades)
    const maxDrawdown = calculateMaxDrawdown(trades)
    const tradesBySymbol = groupTradesBySymbol(trades)
    
    const stats = {
      totalTrades: trades.length,
      winRate,
      totalProfitLoss,
      averageProfit,
      winningTrades: trades.filter(t => t.profit > 0).length,
      losingTrades: trades.filter(t => t.profit < 0).length,
      breakEvenTrades: trades.filter(t => t.profit === 0).length,
      bestTrade: best ? {
        profit: best.profit,
        symbol: best.symbol,
        date: best.closeTime,
      } : null,
      worstTrade: worst ? {
        profit: worst.profit,
        symbol: worst.symbol,
        date: worst.closeTime,
      } : null,
      maxDrawdown,
      symbolsTraded: Object.keys(tradesBySymbol).length,
      tradesBySymbol: Object.entries(tradesBySymbol).map(([symbol, symbolTrades]) => ({
        symbol,
        count: symbolTrades.length,
        winRate: calculateWinRate(symbolTrades),
        totalProfit: calculateTotalProfitLoss(symbolTrades),
      })),
    }
    
    return NextResponse.json({
      success: true,
      stats,
    })
    
  } catch (error) {
    console.error('Get Stats Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
