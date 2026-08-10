/**
 * Check if trades for a day follow the plan rules
 * Returns: { disciplinedTrades, undisciplinedTrades, noPlanTrades, violations }
 */
export function checkDayDiscipline(dayTrades, dayPlan) {
  if (!dayTrades || dayTrades.length === 0) {
    return {
      disciplinedTrades: 0,
      undisciplinedTrades: 0,
      noPlanTrades: 0,
      violations: []
    }
  }

  // If no plan, all trades are without plan
  if (!dayPlan) {
    return {
      disciplinedTrades: 0,
      undisciplinedTrades: 0,
      noPlanTrades: dayTrades.length,
      violations: ['No plan']
    }
  }

  const violations = []
  let disciplinedTrades = 0
  let undisciplinedTrades = 0

  // Calculate day stats
  const totalTrades = dayTrades.length
  const totalProfit = dayTrades.reduce((sum, trade) => sum + trade.profit, 0)
  const totalLoss = Math.abs(Math.min(0, totalProfit))

  // Check Max Trades
  if (dayPlan.maxTrades && totalTrades > dayPlan.maxTrades) {
    violations.push(`Max Trades: ${totalTrades}/${dayPlan.maxTrades}`)
    undisciplinedTrades += (totalTrades - dayPlan.maxTrades)
  }

  // Check Max Loss ($)
  if (dayPlan.maxLoss && totalLoss > dayPlan.maxLoss) {
    violations.push(`Max Loss: $${totalLoss.toFixed(2)}/$${dayPlan.maxLoss}`)
    // Count trades that contributed to exceeding loss
    let cumulativeLoss = 0
    dayTrades.forEach(trade => {
      if (trade.profit < 0) {
        cumulativeLoss += Math.abs(trade.profit)
        if (cumulativeLoss > dayPlan.maxLoss) {
          undisciplinedTrades++
        } else {
          disciplinedTrades++
        }
      } else {
        disciplinedTrades++
      }
    })
    return { disciplinedTrades, undisciplinedTrades, noPlanTrades: 0, violations }
  }

  // Check Max Loss (%)
  if (dayPlan.maxLossPercent && totalProfit < 0) {
    // Assuming a base capital for percentage calculation (this should be from user settings)
    // For now, we'll just check if loss exists
    violations.push(`Loss %: exceeded`)
  }

  // Check Target Profit ($)
  if (dayPlan.targetProfit && totalProfit < dayPlan.targetProfit) {
    violations.push(`Target not met: $${totalProfit.toFixed(2)}/$${dayPlan.targetProfit}`)
  }

  // If no violations in rules, all trades are disciplined
  if (violations.length === 0) {
    disciplinedTrades = totalTrades
  } else if (disciplinedTrades === 0 && undisciplinedTrades === 0) {
    // If we have violations but haven't counted trades yet
    undisciplinedTrades = totalTrades
  }

  return {
    disciplinedTrades,
    undisciplinedTrades,
    noPlanTrades: 0,
    violations
  }
}

/**
 * Get discipline stats for a period (week or month)
 */
export function getPeriodDisciplineStats(trades, plans, days, currentMonth) {
  let totalDisciplined = 0
  let totalUndisciplined = 0
  let totalNoPlan = 0

  days.forEach(day => {
    if (day === null) return

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) return // Skip weekends

    // Get trades for this day
    const dayTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.closeTime)
      return tradeDate.getDate() === day &&
             tradeDate.getMonth() === currentMonth.getMonth() &&
             tradeDate.getFullYear() === currentMonth.getFullYear()
    })

    if (dayTrades.length === 0) return

    // Find plan for this day
    let dayPlan = null

    // Check daily plan
    dayPlan = plans.find(plan => {
      const planDate = new Date(plan.date)
      return planDate.getDate() === day &&
             planDate.getMonth() === currentMonth.getMonth() &&
             planDate.getFullYear() === currentMonth.getFullYear() &&
             plan.period === 'daily'
    })

    // Check weekly plan if no daily
    if (!dayPlan) {
      dayPlan = plans.find(plan => {
        if (plan.period !== 'weekly') return false
        const planDate = new Date(plan.date)
        const weekStart = new Date(planDate)
        const dayOfWeek = weekStart.getDay()
        weekStart.setDate(weekStart.getDate() - dayOfWeek)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        return date >= weekStart && date <= weekEnd
      })
    }

    // Check monthly plan if no daily or weekly
    if (!dayPlan) {
      dayPlan = plans.find(plan => {
        if (plan.period !== 'monthly') return false
        const planDate = new Date(plan.date)
        return planDate.getMonth() === currentMonth.getMonth() &&
               planDate.getFullYear() === currentMonth.getFullYear()
      })
    }

    // Check discipline for this day
    const discipline = checkDayDiscipline(dayTrades, dayPlan)
    totalDisciplined += discipline.disciplinedTrades
    totalUndisciplined += discipline.undisciplinedTrades
    totalNoPlan += discipline.noPlanTrades
  })

  return {
    disciplined: totalDisciplined,
    undisciplined: totalUndisciplined,
    noPlan: totalNoPlan,
    total: totalDisciplined + totalUndisciplined + totalNoPlan
  }
}
