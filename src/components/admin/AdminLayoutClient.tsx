'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, BarChart3, Trophy, ShoppingBag, 
  Settings, ChevronLeft, ChevronRight, Shield, Bell,
  Target, Ticket, Coins, Zap, Menu, X, IndianRupee, Activity,
  CreditCard, Mail
} from 'lucide-react'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/user-tracking', label: 'User Tracking', icon: Activity },
  { href: '/admin/contacts', label: 'Contact Messages', icon: Mail },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/habits', label: 'Habits Data', icon: Target },
  { href: '/admin/challenges', label: 'Challenges', icon: Trophy },
  { href: '/admin/shop', label: 'Shop Items', icon: ShoppingBag },
  { href: '/admin/packages', label: 'Coin Packages', icon: IndianRupee },
  { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/rewards', label: 'Rewards', icon: Coins },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface rounded-lg border border-border-subtle"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-surface border-r border-border-subtle transition-all duration-300
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Shield size={20} className="text-red-400" />
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Admin Panel</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-1.5 hover:bg-background rounded-lg transition"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-foreground-muted hover:bg-background hover:text-foreground'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Back to App */}
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition"
          >
            <Zap size={20} />
            {sidebarOpen && <span className="font-medium">Back to App</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}