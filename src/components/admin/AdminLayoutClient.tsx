'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ErrorBoundary from '@/components/ErrorBoundary'
import { 
  LayoutDashboard, Users, BarChart3, Trophy, ShoppingBag, 
  Settings, ChevronLeft, ChevronRight, Shield, Bell,
  Target, Ticket, Coins, Zap, Menu, X, IndianRupee, Activity,
  CreditCard, Mail, Award, ChevronDown, MessageSquare, Megaphone,
  FileText, ScrollText
} from 'lucide-react'

const adminNavSections = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
    ]
  },
  {
    title: 'User Management',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/user-tracking', label: 'User Tracking', icon: Activity },
      { href: '/admin/contacts', label: 'Contact Messages', icon: Mail },
      { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    ]
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/habits', label: 'Habits Data', icon: Target },
      { href: '/admin/weekly-challenges', label: 'Weekly Challenges', icon: Award },
      { href: '/admin/badges', label: 'Badges', icon: Award },
    ]
  },
  {
    title: 'Shop & Rewards',
    items: [
      { href: '/admin/shop', label: 'Shop Items', icon: ShoppingBag },
      { href: '/admin/packages', label: 'Coin Packages', icon: IndianRupee },
      { href: '/admin/rewards', label: 'Rewards', icon: Coins },
      { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    ]
  },
  {
    title: 'Transactions',
    items: [
      { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
    ]
  },
  {
    title: 'System',
    items: [
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/admin/logs', label: 'System Logs', icon: ScrollText },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  }
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>([])

  // Auto-open section with active page
  useEffect(() => {
    const activeSection = adminNavSections.find(section =>
      section.items.some(item => 
        pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
      )
    )
    if (activeSection) {
      setOpenSections([activeSection.title])
    }
  }, [pathname])

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

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
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">Admin</span>
                <span className="text-[10px] text-foreground-muted leading-tight">Panel</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-1.5 hover:bg-background rounded-lg transition"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] admin-sidebar-scrollbar">
          {adminNavSections.map((section) => {
            const isOpen = openSections.includes(section.title)
            const hasActivePage = section.items.some(item => 
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            )
            
            return (
              <div key={section.title}>
                {sidebarOpen ? (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 hover:bg-background ${
                      hasActivePage ? 'text-red-400' : 'text-foreground-muted'
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {section.title}
                    </span>
                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
                      <ChevronDown size={14} />
                    </div>
                  </button>
                ) : (
                  <div className="h-px bg-border-subtle my-2" />
                )}
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    sidebarOpen ? (isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0') : 'max-h-96 opacity-100'
                  }`}
                >
                  <div className="space-y-0.5 mt-1 mb-2">
                    {section.items.map(item => {
                      const isActive = pathname === item.href || 
                        (item.href !== '/admin' && pathname.startsWith(item.href))
                      const Icon = item.icon
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-red-500/20 text-red-400'
                              : 'text-foreground-muted hover:bg-background hover:text-foreground'
                          }`}
                          title={!sidebarOpen ? item.label : undefined}
                        >
                          <Icon size={18} />
                          {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
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
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <div className="p-6 lg:p-8 max-w-full">
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Admin Panel Error:', error, errorInfo)
            }}
          >
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
