'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

export default function MonthlyChart({ trades, currentMonth }) {
  // Get days in month
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Prepare data for chart
  const chartData = []
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Filter trades for this day
    const dayTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.closeTime)
      return tradeDate.getDate() === day &&
             tradeDate.getMonth() === month &&
             tradeDate.getFullYear() === year
    })
    
    const profit = dayTrades.reduce((sum, trade) => sum + trade.profit, 0)
    const tradesCount = dayTrades.length
    
    chartData.push({
      day: day,
      profit: profit,
      tradesCount: tradesCount,
      isWeekend: isWeekend,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
  }
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="font-bold text-sm">{data.date}</p>
          <p className={`text-sm ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            P/L: ${data.profit.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600">{data.tradesCount} trades</p>
          {data.isWeekend && (
            <p className="text-xs text-red-500">Weekend</p>
          )}
        </div>
      )
    }
    return null
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">Monthly Performance Chart</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 12 }}
            interval={2}
            label={{ value: 'Day of Month', position: 'insideBottom', offset: -10, fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Profit/Loss ($)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#6b7280" strokeWidth={2} />
          <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={
                  entry.isWeekend 
                    ? '#d1d5db'  // Gray for weekends
                    : entry.profit > 0 
                    ? '#10b981'  // Green for profit
                    : entry.profit < 0 
                    ? '#ef4444'  // Red for loss
                    : '#fbbf24'  // Yellow for break-even
                } 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span>Break-even</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Weekend / No Trades</span>
        </div>
      </div>
    </div>
  )
}
