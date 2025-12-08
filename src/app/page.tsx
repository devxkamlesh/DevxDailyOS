import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Target, Rocket, TrendingUp, CheckCircle2, Zap, Shield } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-accent-success/10" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center space-y-8">
            <div className="inline-block px-4 py-2 bg-accent-primary/10 rounded-full border border-accent-primary/20 mb-4">
              <span className="text-sm text-accent-primary font-medium">Your Personal Control Center</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground">
              DevX Daily OS
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground-muted max-w-3xl mx-auto">
              A minimal, high-demand daily operating system for developers, creators, and freelancers.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/signup"
                className="px-8 py-4 bg-accent-primary text-white rounded-lg hover:opacity-90 transition font-medium text-lg"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-surface text-foreground rounded-lg hover:bg-opacity-80 transition border border-border-subtle font-medium text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need in One Place</h2>
          <p className="text-foreground-muted text-lg">Build habits, ship projects, and grow your business</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle hover:border-accent-primary/30 transition">
            <div className="p-3 bg-accent-primary/10 rounded-lg w-fit mb-4">
              <Target size={24} className="text-accent-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Habit Tracking</h3>
            <p className="text-foreground-muted">Build and track daily habits with streaks, completion rates, and detailed analytics.</p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border-subtle hover:border-accent-primary/30 transition">
            <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-4">
              <Rocket size={24} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Project Management</h3>
            <p className="text-foreground-muted">Manage dev projects from idea to shipped with tasks, progress tracking, and tech stacks.</p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border-subtle hover:border-accent-primary/30 transition">
            <div className="p-3 bg-purple-500/10 rounded-lg w-fit mb-4">
              <TrendingUp size={24} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Content Pipeline</h3>
            <p className="text-foreground-muted">Plan and organize Instagram content with a Kanban-style workflow.</p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border-subtle hover:border-accent-primary/30 transition">
            <div className="p-3 bg-yellow-500/10 rounded-lg w-fit mb-4">
              <CheckCircle2 size={24} className="text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Freelance Pipeline</h3>
            <p className="text-foreground-muted">Track clients from leads to done with project values and next actions.</p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border-subtle hover:border-accent-primary/30 transition">
            <div className="p-3 bg-accent-success/10 rounded-lg w-fit mb-4">
              <Zap size={24} className="text-accent-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-foreground-muted">Minimal UI designed for daily use in 2-5 minutes. No clutter, just action.</p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border-subtle hover:border-accent-primary/30 transition">
            <div className="p-3 bg-red-500/10 rounded-lg w-fit mb-4">
              <Shield size={24} className="text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-foreground-muted">Your data is encrypted and secure with Supabase authentication.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-accent-primary/20 to-accent-success/20 p-12 rounded-3xl border border-accent-primary/30 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-foreground-muted text-lg mb-8">Join developers and creators building better daily routines</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-accent-primary text-white rounded-lg hover:opacity-90 transition font-medium text-lg"
          >
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-foreground-muted text-sm">
          <p>© 2024 DevX Daily OS. Built for builders.</p>
        </div>
      </footer>
    </main>
  );
}
