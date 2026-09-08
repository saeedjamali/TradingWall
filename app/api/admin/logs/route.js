import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SiteLog from '@/models/SiteLog'
import { requireAdmin } from '@/utils/adminAuth'
import {
  getActionLabel,
  resolveLogRange,
  seriesGranularity,
} from '@/utils/siteLog'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const admin = await requireAdmin(searchParams.get('adminUserId'))
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const range = searchParams.get('range') || '7d'
    const { start, end } = resolveLogRange(
      range,
      searchParams.get('from'),
      searchParams.get('to'),
    )
    const kind = searchParams.get('kind') || ''
    const action = searchParams.get('action') || ''
    const q = (searchParams.get('q') || '').trim()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '40', 10)))

    const match = { createdAt: { $gte: start, $lte: end } }
    if (kind === 'page_view' || kind === 'action') match.kind = kind
    if (action) match.action = action
    if (q) match.path = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }

    const grain = seriesGranularity(start, end)
    const tz = 'Asia/Tehran'

    const dateParts = {
      $dateToParts: { date: '$createdAt', timezone: tz },
    }
    const seriesId =
      grain === 'hour'
        ? {
            y: '$p.year',
            m: '$p.month',
            d: '$p.day',
            h: '$p.hour',
            kind: '$kind',
          }
        : grain === 'month'
          ? {
              y: '$p.year',
              m: '$p.month',
              kind: '$kind',
            }
          : {
              y: '$p.year',
              m: '$p.month',
              d: '$p.day',
              kind: '$kind',
            }

    const [total, pageViews, actions, uniqueUsers, uniqueVisitors, byPath, byAction, byUser, seriesAgg, logs] =
      await Promise.all([
        SiteLog.countDocuments(match),
        SiteLog.countDocuments({ ...match, kind: 'page_view' }),
        SiteLog.countDocuments({ ...match, kind: 'action' }),
        SiteLog.distinct('userId', { ...match, userId: { $ne: null } }),
        SiteLog.distinct('visitorId', { ...match, visitorId: { $nin: [null, ''] } }),
        SiteLog.aggregate([
          { $match: { ...match, kind: 'page_view' } },
          { $group: { _id: '$path', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 12 },
        ]),
        SiteLog.aggregate([
          { $match: { ...match, kind: 'action' } },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 12 },
        ]),
        SiteLog.aggregate([
          { $match: { ...match, userId: { $ne: null } } },
          {
            $group: {
              _id: '$userId',
              total: { $sum: 1 },
              pageViews: {
                $sum: { $cond: [{ $eq: ['$kind', 'page_view'] }, 1, 0] },
              },
              actions: {
                $sum: { $cond: [{ $eq: ['$kind', 'action'] }, 1, 0] },
              },
              lastAt: { $max: '$createdAt' },
            },
          },
          { $sort: { total: -1, actions: -1 } },
          { $limit: 20 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              total: 1,
              pageViews: 1,
              actions: 1,
              lastAt: 1,
              publicName: '$user.publicName',
              phone: '$user.phone',
              verified: '$user.verified',
              role: '$user.role',
            },
          },
        ]),
        SiteLog.aggregate([
          { $match: match },
          { $addFields: { p: dateParts } },
          { $group: { _id: seriesId, count: { $sum: 1 } } },
        ]),
        SiteLog.find(match)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('userId', 'publicName phone role')
          .lean(),
      ])

    const seriesMap = new Map()
    for (const row of seriesAgg) {
      const id = row._id || {}
      let key
      if (grain === 'hour') {
        key = `${id.y}-${String(id.m).padStart(2, '0')}-${String(id.d).padStart(2, '0')} ${String(id.h).padStart(2, '0')}:00`
      } else if (grain === 'month') {
        key = `${id.y}-${String(id.m).padStart(2, '0')}`
      } else {
        key = `${id.y}-${String(id.m).padStart(2, '0')}-${String(id.d).padStart(2, '0')}`
      }
      if (!seriesMap.has(key)) {
        seriesMap.set(key, { t: key, pageViews: 0, actions: 0 })
      }
      const bucket = seriesMap.get(key)
      if (id.kind === 'page_view') bucket.pageViews += row.count
      else bucket.actions += row.count
    }
    const series = [...seriesMap.values()].sort((a, b) =>
      String(a.t).localeCompare(String(b.t)),
    )

    return NextResponse.json({
      success: true,
      range: { from: start, to: end, grain },
      stats: {
        total,
        pageViews,
        actions,
        uniqueUsers: uniqueUsers.filter(Boolean).length,
        uniqueVisitors: uniqueVisitors.length,
      },
      series,
      byPath: byPath.map((r) => ({ path: r._id || '/', count: r.count })),
      byAction: byAction.map((r) => ({
        action: r._id,
        label: getActionLabel(r._id),
        count: r.count,
      })),
      byUser: byUser.map((r) => ({
        id: r._id,
        publicName: r.publicName || 'کاربر',
        phone: r.phone || '',
        verified: !!r.verified,
        role: r.role || 'user',
        total: r.total,
        pageViews: r.pageViews,
        actions: r.actions,
        lastAt: r.lastAt,
      })),
      logs: logs.map((row) => ({
        id: row._id,
        kind: row.kind,
        action: row.action,
        actionLabel: getActionLabel(row.action),
        path: row.path,
        method: row.method,
        status: row.status,
        createdAt: row.createdAt,
        visitorId: row.visitorId,
        ip: row.ip,
        user: row.userId
          ? {
              id: row.userId._id,
              publicName: row.userId.publicName,
              phone: row.userId.phone,
              role: row.userId.role,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    console.error('Admin logs GET error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
