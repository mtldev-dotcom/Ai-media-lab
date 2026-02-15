import { getCurrentUser, getSession } from '@/lib/db/client'
import type { User } from '@/types'

/**
 * Get the currently authenticated user
 * For use in server components and API routes
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return null

    // You can fetch additional user data from the users table here if needed
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: null, // TODO: Fetch from users table
      avatar_url: null, // TODO: Fetch from users table
      created_at: authUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error getting auth user:', error)
    return null
  }
}

/**
 * Get the current session
 */
export async function getAuthSession() {
  try {
    const session = await getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser()
  return !!user
}
