import User from '@/models/User'

/**
 * Verify that the requester is an admin.
 * Returns the admin user or null.
 */
export async function requireAdmin(adminUserId) {
  if (!adminUserId) return null
  const admin = await User.findById(adminUserId).select('-password')
  if (!admin || admin.role !== 'admin') return null
  if (admin.isActive === false) return null
  return admin
}
