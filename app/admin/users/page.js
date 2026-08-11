'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'
import AdminHeader from '@/components/AdminHeader'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { UserName } from '@/components/VerifiedBadge'
import { formatDate } from '@/utils/dateHelpers'

export default function AdminUsersPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    search: '',
    verified: '',
    role: '',
    isActive: '',
  })
  const [tempPasswordInfo, setTempPasswordInfo] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const tokenExpiry = localStorage.getItem('tokenExpiry')

    if (!userData || !tokenExpiry || Date.now() >= parseInt(tokenExpiry)) {
      localStorage.removeItem('user')
      localStorage.removeItem('tokenExpiry')
      router.push('/auth/login')
      return
    }

    const parsed = JSON.parse(userData)
    if (parsed.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setUser(parsed)
    fetchUsers(parsed.id, 1)
  }, [router])

  const fetchUsers = async (adminUserId, page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        adminUserId,
        page: String(page),
        limit: '20',
      })
      if (filters.search) params.set('search', filters.search)
      if (filters.verified) params.set('verified', filters.verified)
      if (filters.role) params.set('role', filters.role)
      if (filters.isActive) params.set('isActive', filters.isActive)

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        alert(data.error || 'خطا در دریافت کاربران')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('خطا در دریافت کاربران')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (userId, verified) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user.id, verified }),
      })
      const data = await response.json()
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, verified } : u))
        )
      } else {
        alert(data.error || 'خطا')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در به‌روزرسانی')
    }
  }

  const handleRoleChange = async (userId, role) => {
    if (!confirm(`آیا از تغییر نقش کاربر به ${role === 'admin' ? 'مدیر' : 'کاربر عادی'} مطمئن هستید؟`)) {
      return
    }
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user.id, userId, role }),
      })
      const data = await response.json()
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role } : u))
        )
      } else {
        alert(data.error || 'خطا')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در تغییر نقش')
    }
  }

  const handleToggleActive = async (targetUser) => {
    const nextActive = targetUser.isActive === false
    const label = nextActive ? 'فعال' : 'غیرفعال'
    if (
      !confirm(
        `آیا از ${label} کردن کاربر «${targetUser.publicName || targetUser.phone}» مطمئن هستید؟`
      )
    ) {
      return
    }

    setActionLoadingId(targetUser._id)
    try {
      const response = await fetch(`/api/admin/users/${targetUser._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          isActive: nextActive,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === targetUser._id ? { ...u, isActive: nextActive } : u
          )
        )
      } else {
        alert(data.error || 'خطا')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در تغییر وضعیت کاربر')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleResetPassword = async (targetUser) => {
    if (
      !confirm(
        `رمز عبور «${targetUser.publicName || targetUser.phone}» ریست شود؟ رمز موقت فقط یک‌بار نمایش داده می‌شود.`
      )
    ) {
      return
    }

    setActionLoadingId(targetUser._id)
    try {
      const response = await fetch(
        `/api/admin/users/${targetUser._id}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminUserId: user.id }),
        }
      )
      const data = await response.json()
      if (data.success) {
        setTempPasswordInfo({
          publicName: targetUser.publicName,
          phone: targetUser.phone,
          tempPassword: data.tempPassword,
        })
      } else {
        alert(data.error || 'خطا در ریست رمز')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در ریست رمز')
    } finally {
      setActionLoadingId(null)
    }
  }

  const copyTempPassword = async () => {
    if (!tempPasswordInfo?.tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPasswordInfo.tempPassword)
      alert('رمز موقت کپی شد')
    } catch {
      alert('کپی نشد؛ رمز را دستی بردارید')
    }
  }

  if (!user) {
    return <Loading text="در حال بارگذاری..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">مدیریت کاربران</h2>
            <p className="text-gray-500 text-sm mt-1">{pagination.total} کاربر</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input
              placeholder="جستجو نام یا شماره..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <select
              value={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg text-gray-900"
            >
              <option value="">همه تاییدها</option>
              <option value="true">تایید شده</option>
              <option value="false">تایید نشده</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg text-gray-900"
            >
              <option value="">همه نقش‌ها</option>
              <option value="user">کاربر</option>
              <option value="admin">مدیر</option>
            </select>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg text-gray-900"
            >
              <option value="">همه حساب‌ها</option>
              <option value="true">فعال</option>
              <option value="false">غیرفعال</option>
            </select>
            <Button onClick={() => fetchUsers(user.id, 1)}>اعمال فیلتر</Button>
          </div>
        </div>

        {tempPasswordInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" dir="rtl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">رمز موقت جدید</h3>
              <p className="text-sm text-gray-600 mb-4">
                برای {tempPasswordInfo.publicName || 'کاربر'} ({tempPasswordInfo.phone})
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center mb-4">
                <p className="text-xs text-gray-500 mb-1">این رمز فقط یک‌بار نمایش داده می‌شود</p>
                <p className="text-2xl font-mono font-bold tracking-wider text-gray-900" dir="ltr">
                  {tempPasswordInfo.tempPassword}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={copyTempPassword} className="flex-1">
                  کپی رمز
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setTempPasswordInfo(null)}
                >
                  بستن
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <Loading text="در حال بارگذاری کاربران..." />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden" dir="ltr">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">کاربر</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">تلفن</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">نقش</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">معاملات</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">سود/زیان</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">تاریخ عضویت</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          کاربری یافت نشد
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr
                          key={u._id}
                          className={`hover:bg-gray-50 ${u.isActive === false ? 'bg-rose-50/40' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <UserName
                                name={u.publicName || '—'}
                                verified={u.verified}
                                className="font-medium text-gray-900"
                                badgeClassName="w-4 h-4 text-blue-500"
                              />
                              {u.isActive === false && (
                                <span className="inline-flex w-fit text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                  غیرفعال
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dir-ltr">{u.phone}</td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              disabled={u._id === user.id}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="user">کاربر</option>
                              <option value="admin">مدیر</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{u.tradeCount || 0}</td>
                          <td className={`px-4 py-3 text-sm font-medium ${
                            (u.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${(u.totalProfit || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5" dir="rtl">
                              <Link
                                href={`/wall/${u._id}`}
                                target="_blank"
                                className="px-2.5 py-1 rounded text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                              >
                                مشاهده دیوار
                              </Link>
                              <button
                                onClick={() => handleVerify(u._id, !u.verified)}
                                disabled={actionLoadingId === u._id}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                  u.verified
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                {u.verified ? 'لغو تیک آبی' : 'اعطای تیک آبی'}
                              </button>
                              <button
                                onClick={() => handleResetPassword(u)}
                                disabled={actionLoadingId === u._id}
                                className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                              >
                                ریست رمز
                              </button>
                              <button
                                onClick={() => handleToggleActive(u)}
                                disabled={actionLoadingId === u._id || u._id === user.id}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                                  u.isActive === false
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                }`}
                              >
                                {u.isActive === false ? 'فعال کردن' : 'غیرفعال کردن'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4 bg-white rounded-lg shadow p-4" dir="rtl">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(user.id, pagination.page - 1)}
                >
                  قبلی
                </Button>
                <span className="text-gray-700">
                  صفحه {pagination.page} از {pagination.pages}
                </span>
                <Button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchUsers(user.id, pagination.page + 1)}
                >
                  بعدی
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
