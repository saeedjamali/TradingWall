import User from '@/models/User'

/**
 * Ensure user exists and is not deactivated.
 * Returns { user } or { error, status }.
 */
export async function requireActiveUser(userId) {
  if (!userId) {
    return { error: 'کاربر مشخص نشده است', status: 400 }
  }

  const user = await User.findById(userId).select('-password')
  if (!user) {
    return { error: 'کاربر یافت نشد', status: 404 }
  }

  if (user.isActive === false) {
    return {
      error: 'حساب کاربری شما غیرفعال شده است',
      status: 403,
    }
  }

  return { user }
}
