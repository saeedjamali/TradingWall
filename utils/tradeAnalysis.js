/**
 * Calculate Win Rate
 * @param {Array} trades - Array of trade objects
 * @returns {number} Win rate percentage
 */
export function calculateWinRate(trades) {
  if (!trades || trades.length === 0) return 0
  
  const winningTrades = trades.filter(trade => trade.profit > 0).length
  return Number(((winningTrades / trades.length) * 100).toFixed(2))
}

/**
 * Calculate Total Profit/Loss
 * @param {Array} trades - Array of trade objects
 * @returns {number} Total profit/loss
 */
export function calculateTotalProfitLoss(trades) {
  if (!trades || trades.length === 0) return 0
  
  return trades.reduce((total, trade) => {
    return total + (trade.profit + trade.commission + trade.swap)
  }, 0)
}

/**
 * Get trades for a specific date
 * @param {Array} trades - Array of trade objects
 * @param {Date} date - Target date
 * @returns {Array} Filtered trades
 */
export function getTradesForDate(trades, date) {
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const nextDate = new Date(targetDate)
  nextDate.setDate(nextDate.getDate() + 1)
  
  return trades.filter(trade => {
    const closeTime = new Date(trade.closeTime)
    return closeTime >= targetDate && closeTime < nextDate
  })
}

/**
 * Get trades for a specific week
 * @param {Array} trades - Array of trade objects
 * @param {Date} weekStart - Start of the week
 * @returns {Array} Filtered trades
 */
export function getTradesForWeek(trades, weekStart) {
  const start = new Date(weekStart)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  
  return trades.filter(trade => {
    const closeTime = new Date(trade.closeTime)
    return closeTime >= start && closeTime < end
  })
}

/**
 * Get trades for a specific month
 * @param {Array} trades - Array of trade objects
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Array} Filtered trades
 */
export function getTradesForMonth(trades, year, month) {
  return trades.filter(trade => {
    const closeTime = new Date(trade.closeTime)
    return closeTime.getFullYear() === year && closeTime.getMonth() === month
  })
}

/**
 * Get trades for a specific year
 * @param {Array} trades - Array of trade objects
 * @param {number} year - Year
 * @returns {Array} Filtered trades
 */
export function getTradesForYear(trades, year) {
  return trades.filter(trade => {
    const closeTime = new Date(trade.closeTime)
    return closeTime.getFullYear() === year
  })
}

/**
 * Calculate average profit per trade
 * @param {Array} trades - Array of trade objects
 * @returns {number} Average profit
 */
export function calculateAverageProfitPerTrade(trades) {
  if (!trades || trades.length === 0) return 0
  
  const totalProfit = calculateTotalProfitLoss(trades)
  return Number((totalProfit / trades.length).toFixed(2))
}

/**
 * Get best and worst trades
 * @param {Array} trades - Array of trade objects
 * @returns {Object} Object with best and worst trades
 */
export function getBestAndWorstTrades(trades) {
  if (!trades || trades.length === 0) {
    return { best: null, worst: null }
  }
  
  let best = trades[0]
  let worst = trades[0]
  
  trades.forEach(trade => {
    if (trade.profit > best.profit) best = trade
    if (trade.profit < worst.profit) worst = trade
  })
  
  return { best, worst }
}

/**
 * Calculate drawdown
 * @param {Array} trades - Array of trade objects sorted by date
 * @returns {number} Maximum drawdown
 */
export function calculateMaxDrawdown(trades) {
  if (!trades || trades.length === 0) return 0
  
  let balance = 0
  let peak = 0
  let maxDrawdown = 0
  
  trades.forEach(trade => {
    balance += trade.profit + trade.commission + trade.swap
    
    if (balance > peak) {
      peak = balance
    }
    
    const drawdown = peak - balance
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  })
  
  return Number(maxDrawdown.toFixed(2))
}

/**
 * Group trades by symbol
 * @param {Array} trades - Array of trade objects
 * @returns {Object} Grouped trades by symbol
 */
export function groupTradesBySymbol(trades) {
  if (!trades || trades.length === 0) return {}
  
  return trades.reduce((groups, trade) => {
    const symbol = trade.symbol
    if (!groups[symbol]) {
      groups[symbol] = []
    }
    groups[symbol].push(trade)
    return groups
  }, {})
}
