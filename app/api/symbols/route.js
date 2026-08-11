import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Symbol from '@/models/Symbol'
import { seedDefaultSymbols } from '@/utils/symbolSeed'

/**
 * GET /api/symbols
 * Public list of active symbols for trade forms
 * Optional: ?category=&q=
 * Auto-seeds defaults if table is empty
 */
export async function GET(request) {
  try {
    await connectDB()

    const count = await Symbol.countDocuments()
    if (count === 0) {
      await seedDefaultSymbols(Symbol, { onlyIfEmpty: true })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const q = (searchParams.get('q') || '').trim()
    const includeInactive = searchParams.get('includeInactive') === '1'

    const query = includeInactive ? {} : { isActive: true }
    if (category) query.category = category
    if (q) {
      query.$or = [
        { code: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { nameFa: { $regex: q, $options: 'i' } },
      ]
    }

    const symbols = await Symbol.find(query)
      .sort({ category: 1, sortOrder: 1, code: 1 })
      .lean()

    return NextResponse.json({ success: true, symbols })
  } catch (error) {
    console.error('Symbols GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
