export function formatTradeSymbol(trade) {
  if (!trade) return ''
  const code = trade.symbol || ''
  if (trade.symbolPending) return `نماد جدید · ${code}`
  return code
}
