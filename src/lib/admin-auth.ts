import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server-side admin authentication verification
 * Use this in admin pages that need extra security
 */
export async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Check if user is authenticated
  if (error || !user) {
    redirect('/login')
  }

  // Check if user email is in admin whitelist
  const allowedEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || []
  const userEmail = user.email?.toLowerCase()
  
  if (!userEmail || !allowedEmails.includes(userEmail)) {
    redirect('/dashboard') // Redirect unauthorized users
  }

  return {
    user,
    isAdmin: true
  }
}

/**
 * Client-side admin check hook
 * Use this in client components for UI protection
 */
export function useAdminAuth() {
  return {
    // This would be implemented with a context provider
    // For now, the layout handles the protection
    isAdmin: true // Assuming if component renders, user is admin
  }
}