import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

// Admin email whitelist
const ALLOWED_ADMIN_EMAILS = process.env.ALLOWED_ADMIN_EMAILS?.split(',') || []

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is authenticated
  if (!user) {
    redirect('/login')
  }

  // Check if user email is in admin whitelist
  const userEmail = user.email
  const isAdmin = userEmail && ALLOWED_ADMIN_EMAILS.includes(userEmail)

  if (!isAdmin) {
    // Return access denied page instead of redirecting
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-surface p-8 rounded-2xl border border-border-subtle text-center">
            <div className="p-4 bg-red-500/20 rounded-full w-fit mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
            <p className="text-foreground-muted mb-6">
              You don't have permission to access the admin panel. This area is restricted to authorized administrators only.
            </p>
            <div className="space-y-3">
              <a
                href="/dashboard"
                className="block w-full px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition font-medium"
              >
                Go to Dashboard
              </a>
              <p className="text-sm text-foreground-muted">
                Signed in as: <span className="font-medium">{userEmail}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // User is admin, render the admin layout
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
