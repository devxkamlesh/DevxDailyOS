import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { ThemeProvider } from '@/components/ThemeProvider'
import ErrorBoundary from '@/components/ErrorBoundary'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <Sidebar />
        <main className="md:ml-64 p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}
