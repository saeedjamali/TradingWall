import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Symbol, { SYMBOL_CATEGORIES } from '@/models/Symbol'
import { requireAdmin } from '@/utils/adminAuth'
import { seedDefaultSymbols } from '@/utils/symbolSeed'

// GET - List all symbols (admin)
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const adminUserId = searchParams.get('adminUserId')
    const category = searchParams.get('category')
    const q = (searchParams.get('q') || '').trim()

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const query = {}
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

    return NextResponse.json({
      success: true,
      symbols,
      categories: SYMBOL_CATEGORIES,
      total: symbols.length,
    })
  } catch (error) {
    console.error('Admin Symbols GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

// POST - Create symbol OR seed defaults
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { adminUserId, action } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (action === 'seed') {
      const result = await seedDefaultSymbols(Symbol, {
        onlyIfEmpty: body.onlyIfEmpty === true,
      })
      return NextResponse.json({ success: true, ...result })
    }

    const { code, name, nameFa, category, isActive, sortOrder } = body
    if (!code?.trim() || !name?.trim() || !category) {
      return NextResponse.json(
        { error: 'کد، نام و دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }
    if (!SYMBOL_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'دسته‌بندی نامعتبر' }, { status: 400 })
    }

    const normalized = code.trim().toUpperCase()
    const exists = await Symbol.findOne({ code: normalized })
    if (exists) {
      return NextResponse.json({ error: 'این نماد از قبل وجود دارد' }, { status: 400 })
    }

    const symbol = await Symbol.create({
      code: normalized,
      name: name.trim(),
      nameFa: (nameFa || '').trim(),
      category,
      isActive: isActive !== false,
      sortOrder: Number(sortOrder) || 0,
    })

    return NextResponse.json({
      success: true,
      message: 'نماد ایجاد شد',
      symbol,
    })
  } catch (error) {
    console.error('Admin Symbols POST Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

// PUT - Update symbol
export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { adminUserId, symbolId, code, name, nameFa, category, isActive, sortOrder } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (!symbolId) {
      return NextResponse.json({ error: 'شناسه نماد الزامی است' }, { status: 400 })
    }

    const symbol = await Symbol.findById(symbolId)
    if (!symbol) {
      return NextResponse.json({ error: 'نماد یافت نشد' }, { status: 404 })
    }

    if (code !== undefined) {
      const normalized = code.trim().toUpperCase()
      const clash = await Symbol.findOne({ code: normalized, _id: { $ne: symbolId } })
      if (clash) {
        return NextResponse.json({ error: 'کد نماد تکراری است' }, { status: 400 })
      }
      symbol.code = normalized
    }
    if (name !== undefined) symbol.name = name.trim()
    if (nameFa !== undefined) symbol.nameFa = nameFa.trim()
    if (category !== undefined) {
      if (!SYMBOL_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: 'دسته‌بندی نامعتبر' }, { status: 400 })
      }
      symbol.category = category
    }
    if (isActive !== undefined) symbol.isActive = !!isActive
    if (sortOrder !== undefined) symbol.sortOrder = Number(sortOrder) || 0

    await symbol.save()

    return NextResponse.json({
      success: true,
      message: 'نماد به‌روزرسانی شد',
      symbol,
    })
  } catch (error) {
    console.error('Admin Symbols PUT Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

// DELETE - Delete symbol
export async function DELETE(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { adminUserId, symbolId } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (!symbolId) {
      return NextResponse.json({ error: 'شناسه نماد الزامی است' }, { status: 400 })
    }

    const deleted = await Symbol.findByIdAndDelete(symbolId)
    if (!deleted) {
      return NextResponse.json({ error: 'نماد یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'نماد حذف شد' })
  } catch (error) {
    console.error('Admin Symbols DELETE Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
