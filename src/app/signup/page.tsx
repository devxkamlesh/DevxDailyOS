'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserX } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  const [checkingSettings, setCheckingSettings] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check if registration is enabled
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('registration_enabled')
          .single()
        if (data) {
          setRegistrationEnabled(data.registration_enabled ?? true)
        }
      } catch (e) {
        // If error, assume registration is enabled
      } finally {
        setCheckingSettings(false)
      }
    }
    checkRegistration()
  }, [])

  // Show registration disabled message
  if (!checkingSettings && !registrationEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
            <UserX size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Registration Closed</h1>
          <p className="text-foreground-muted mb-6">
            New user registration is currently disabled. Please check back later or contact the administrator.
          </p>
          <Link href="/login" className="text-accent-primary hover:underline">
            Already have an account? Login
          </Link>
        </div>
      </div>
    )
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Create profile - use upsert to avoid conflicts
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              full_name: fullName,
              username: email.split('@')[0],
            },
            { onConflict: 'id' }
          )

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-foreground-muted mt-2">Start your DevX journey</p>
        </div>
        
        <div className="bg-surface p-8 rounded-2xl border border-border-subtle">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-accent-success/10 border border-accent-success/20 rounded-lg text-accent-success text-sm">
                Account created! Redirecting to dashboard...
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-foreground"
                placeholder="Kamlesh"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-foreground"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-foreground"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-foreground-muted mt-1">
                Must be at least 6 characters
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 bg-accent-primary text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-foreground-muted">Already have an account? </span>
            <Link href="/login" className="text-accent-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
