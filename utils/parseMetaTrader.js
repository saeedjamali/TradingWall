import * as XLSX from 'xlsx'

/**
 * Parse MetaTrader Excel/CSV file
 * @param {Buffer} fileBuffer - Excel/CSV file buffer
 * @param {string} fileType - File extension (xlsx, xls, csv)
 * @returns {Object} Parsed data with trades array
 */
export function parseMetaTraderFile(fileBuffer, fileType = 'xlsx') {
  try {
    // Read workbook (supports xlsx, xls, csv)
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      // For CSV files
      raw: fileType === 'csv'
    })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // Find header row (contains "Time", "Position", etc.)
    let headerRowIndex = -1
    for (let i = 0; i < data.length; i++) {
      if (data[i].includes('Time') && data[i].includes('Position') && data[i].includes('Symbol')) {
        headerRowIndex = i
        break
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('فرمت فایل نامعتبر است. فایل باید خروجی متاتریدر باشد.')
    }
    
    // Extract user info
    const userInfo = {
      name: data[0]?.[3] || '',
      account: data[1]?.[3] || '',
      company: data[2]?.[3] || '',
      date: data[3]?.[3] || '',
    }
    
    // Parse trades
    const trades = []
    const headers = data[headerRowIndex]
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i]
      
      // Skip empty rows or summary rows
      if (!row || row.length === 0 || !row[0]) continue
      
      // Skip if row doesn't have enough data
      if (!row || row.length < 13) continue
      
      // Map row data to trade object
      const trade = {
        openTime: parseMetaTraderDate(row[0]),
        positionId: row[1]?.toString() || '',
        symbol: row[2] || '',
        type: (row[3] && typeof row[3] === 'string') ? row[3].toLowerCase() : '',
        volume: parseFloat(row[4]) || 0,
        openPrice: parseFloat(row[5]) || 0,
        stopLoss: parseFloat(row[6]) || null,
        takeProfit: parseFloat(row[7]) || null,
        closeTime: parseMetaTraderDate(row[8]),
        closePrice: parseFloat(row[9]) || 0,
        commission: parseFloat(row[10]) || 0,
        swap: parseFloat(row[11]) || 0,
        profit: parseFloat(row[12]) || 0,
      }
      
      // Validate trade - must have essential fields
      if (trade.positionId && 
          trade.symbol && 
          trade.openTime && 
          trade.closeTime &&
          (trade.type === 'buy' || trade.type === 'sell')) {
        trades.push(trade)
      }
    }
    
    return {
      success: true,
      userInfo,
      trades,
      totalTrades: trades.length,
    }
  } catch (error) {
    console.error('Error parsing MetaTrader file:', error)
    return {
      success: false,
      error: error.message || 'خطا در پردازش فایل. لطفاً از فرمت صحیح متاتریدر استفاده کنید.',
      trades: [],
    }
  }
}

/**
 * Parse MetaTrader date format (YYYY.MM.DD HH:MM:SS)
 * @param {string|number} dateString - Date string from MetaTrader
 * @returns {Date} JavaScript Date object
 */
function parseMetaTraderDate(dateString) {
  if (!dateString) return null
  
  try {
    // Convert to string if it's a number
    const dateStr = String(dateString).trim()
    
    // Check if it's a number (Excel serial date)
    if (!isNaN(dateStr) && !dateStr.includes('.') && !dateStr.includes(':')) {
      // Excel serial date number
      const excelDate = parseFloat(dateStr)
      // Excel epoch is 1900-01-01, but actually 1899-12-30
      const date = new Date((excelDate - 25569) * 86400 * 1000)
      return date
    }
    
    // Format: 2026.07.02 15:54:19
    const parts = dateStr.split(' ')
    if (parts.length !== 2) return null
    
    const dateParts = parts[0].split('.')
    const timeParts = parts[1].split(':')
    
    if (dateParts.length !== 3 || timeParts.length !== 3) return null
    
    const year = parseInt(dateParts[0])
    const month = parseInt(dateParts[1]) - 1 // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2])
    const hour = parseInt(timeParts[0])
    const minute = parseInt(timeParts[1])
    const second = parseInt(timeParts[2])
    
    return new Date(year, month, day, hour, minute, second)
  } catch (error) {
    console.error('Error parsing date:', dateString, error)
    return null
  }
}

/**
 * Create template Excel file for download
 * @returns {Buffer} Excel file buffer
 */
export function createTemplateFile() {
  const data = [
    ['Trade History Report', '', '', 'Your Name', '', '', '', '', '', '', '', '', ''],
    ['Account:', '', '', 'Account Number (USD, Broker, real, Hedge)', '', '', '', '', '', '', '', '', ''],
    ['Company:', '', '', 'Broker Name', '', '', '', '', '', '', '', '', ''],
    ['Date:', '', '', new Date().toISOString().split('T')[0], '', '', '', '', '', '', '', '', ''],
    ['Positions', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Time', 'Position', 'Symbol', 'Type', 'Volume', 'Price', 'S / L', 'T / P', 'Time', 'Price', 'Commission', 'Swap', 'Profit'],
    // Sample trade
    ['2026.07.02 15:54:19', '1228274951', 'US30_i', 'sell', '0.29', '52653.3', '52719.6', '52601.7', '2026.07.02 15:58:01', '52601.7', '0', '0', '14.96'],
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades')
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}
