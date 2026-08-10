import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'template' or 'sample'
    const format = searchParams.get('format') || 'xlsx' // 'xlsx' or 'csv'

    if (type === 'sample' && format === 'csv') {
      // Return the sample CSV file
      const samplePath = process.cwd() + '/public/templates/sample-trades.csv'
      const fs = require('fs')
      
      if (fs.existsSync(samplePath)) {
        const fileBuffer = fs.readFileSync(samplePath)
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="sample-trades.csv"',
          },
        })
      }
    }

    // Create empty template Excel file
    const workbook = XLSX.utils.book_new()
    
    // Create worksheet with headers (MetaTrader format)
    const headers = [
      'Time',
      'Position',
      'Symbol',
      'Type',
      'Volume',
      'Price',
      'S / L',
      'T / P',
      'Time',
      'Price',
      'Commission',
      'Swap',
      'Profit'
    ]

    // Create full MetaTrader-style data with header rows
    const fullData = type === 'template' ? [
      // User info rows
      ['Trade History Report', '', '', 'Your Name'],
      ['Account:', '', '', 'Account Number (USD, Broker, real, Hedge)'],
      ['Company:', '', '', 'Your Broker Name'],
      ['Date:', '', '', new Date().toISOString().split('T')[0]],
      ['Positions'],
      // Headers
      headers,
    ] : [
      // User info rows
      ['Trade History Report', '', '', 'John Trader'],
      ['Account:', '', '', '12345678 (USD, MetaTrader, real, Hedge)'],
      ['Company:', '', '', 'Example Broker Ltd'],
      ['Date:', '', '', '2024.01.15'],
      ['Positions'],
      // Headers
      headers,
      // Sample trades
      [
        '2024.01.15 10:15:23',
        '245045871',
        'US30_i',
        'buy',
        '0.10',
        '43500.50',
        '43450.00',
        '43600.00',
        '2024.01.15 10:45:18',
        '43550.75',
        '-2.50',
        '0.00',
        '50.25'
      ],
      [
        '2024.01.15 11:20:45',
        '245045873',
        'EURUSD_i',
        'sell',
        '0.05',
        '1.08450',
        '1.08550',
        '1.08350',
        '2024.01.15 12:10:32',
        '1.08520',
        '-1.50',
        '0.00',
        '-35.00'
      ],
      [
        '2024.01.15 14:30:10',
        '245045875',
        'GBPUSD_i',
        'buy',
        '0.03',
        '1.27200',
        '1.27100',
        '1.27300',
        '2024.01.15 15:45:55',
        '1.27350',
        '-1.20',
        '0.00',
        '45.00'
      ],
      [
        '2024.01.16 08:15:20',
        '245045877',
        'US30_i',
        'sell',
        '0.15',
        '43600.00',
        '43650.00',
        '43550.00',
        '2024.01.16 09:30:45',
        '43575.25',
        '-3.00',
        '0.00',
        '37.13'
      ],
      [
        '2024.01.16 13:45:12',
        '245045879',
        'XAUUSD_i',
        'buy',
        '0.02',
        '2050.30',
        '2045.00',
        '2055.00',
        '2024.01.16 14:20:08',
        '2055.80',
        '-1.00',
        '0.00',
        '11.00'
      ],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(fullData)
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Time (Open)
      { wch: 12 }, // Position
      { wch: 12 }, // Symbol
      { wch: 10 }, // Type
      { wch: 10 }, // Volume
      { wch: 12 }, // Price (Open)
      { wch: 12 }, // S / L
      { wch: 12 }, // T / P
      { wch: 20 }, // Time (Close)
      { wch: 12 }, // Price (Close)
      { wch: 12 }, // Commission
      { wch: 10 }, // Swap
      { wch: 12 }, // Profit
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const filename = type === 'template' 
      ? 'trading-template-empty.xlsx'
      : 'trading-template-sample.xlsx'

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Download Template Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
