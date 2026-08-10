/**
 * Check if trades comply with the plan rules
 * Each trade is checked individually against plan parameters
 */
export function checkPlanCompliance(trades, plan, userCapital = null) {
  // If no plan, all trades are "no plan"
  if (!plan) {
    return {
      compliant: [],
      undisciplined: [],
      noPlan: trades
    }
  }
  
  // If no trades, return empty
  if (trades.length === 0) {
    return {
      compliant: [],
      undisciplined: [],
      noPlan: []
    }
  }

  const compliant = []
  const undisciplined = []
  
  // Sort trades by closeTime to maintain order
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.closeTime) - new Date(b.closeTime)
  )

  // Check each trade individually
  sortedTrades.forEach((trade, index) => {
    let isUndisciplined = false
    
    // 1. Check Max Trades (global check)
    // If maxTrades is set and this trade exceeds the limit
    if (plan.maxTrades && (index + 1) > plan.maxTrades) {
      isUndisciplined = true
    }
    
    // 2. Check Max Loss ($) - per trade
    // If trade is a loss and loss amount exceeds maxLoss
    if (plan.maxLoss && trade.profit < 0) {
      const lossAmount = Math.abs(trade.profit)
      if (lossAmount > plan.maxLoss) {
        isUndisciplined = true
      }
    }
    
    // 3. Check Max Loss (%) - per trade
    // If trade is a loss and loss percentage exceeds maxLossPercent
    if (plan.maxLossPercent && userCapital && trade.profit < 0) {
      const lossAmount = Math.abs(trade.profit)
      const lossPercent = (lossAmount / userCapital) * 100
      if (lossPercent > plan.maxLossPercent) {
        isUndisciplined = true
      }
    }
    
    // 4. Check Target Profit ($) - per trade
    // If trade is a profit but doesn't meet target
    if (plan.targetProfit && trade.profit > 0) {
      if (trade.profit < plan.targetProfit) {
        isUndisciplined = true
      }
    }
    
    // Categorize the trade
    if (isUndisciplined) {
      undisciplined.push(trade)
    } else {
      compliant.push(trade)
    }
  })

  return {
    compliant,
    undisciplined,
    noPlan: []
  }
}

/**
 * Get plan for a specific date
 */
export function getPlanForDate(plans, date) {
  if (!plans || plans.length === 0) return null
  
  // Check for daily plan
  let plan = plans.find(p => {
    const planDate = new Date(p.date)
    return planDate.getDate() === date.getDate() &&
           planDate.getMonth() === date.getMonth() &&
           planDate.getFullYear() === date.getFullYear() &&
           p.period === 'daily'
  })
  
  if (plan) return plan
  
  // Check for weekly plan
  plan = plans.find(p => {
    if (p.period !== 'weekly') return false
    const planDate = new Date(p.date)
    const weekStart = new Date(planDate)
    const dayOfWeek = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    return date >= weekStart && date <= weekEnd
  })
  
  if (plan) return plan
  
  // Check for monthly plan
  plan = plans.find(p => {
    if (p.period !== 'monthly') return false
    const planDate = new Date(p.date)
    return planDate.getMonth() === date.getMonth() &&
           planDate.getFullYear() === date.getFullYear()
  })
  
  return plan
}

/**
 * Calculate compliance stats for multiple days
 */
export function calculateComplianceStats(days) {
  const stats = {
    totalTrades: 0,
    compliantTrades: 0,
    violatedTrades: 0,
    noPlanTrades: 0,
    daysWithPlan: 0,
    daysWithoutPlan: 0
  }
  
  days.forEach(day => {
    if (day.plan) {
      stats.daysWithPlan++
    } else if (day.trades > 0) {
      stats.daysWithoutPlan++
    }
    
    stats.totalTrades += day.trades
    stats.compliantTrades += day.compliant
    stats.violatedTrades += day.violated
    stats.noPlanTrades += day.noPlan
  })
  
  return stats
}
