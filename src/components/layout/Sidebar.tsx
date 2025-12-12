'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Target, 
  FolderKanban, 
  Instagram, 
  Briefcase, 
  Settings,
  Menu,
  X,
  Calendar,
  BarChart3,
  Sparkles,
  Trophy,
  BookOpen,
  ShoppingCart,
  Medal,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navSections = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'Habits & Goals',
    items: [
      { href: '/habits', label: 'Habits', icon: Target },
      { href: '/journal', label: 'Journal', icon: BookOpen },
      { href: '/templates', label: 'Templates', icon: Sparkles },
    ]
  },
  {
    title: 'Gamification',
    items: [
      { href: '/achievements', label: 'Achievements', icon: Trophy },
      { href: '/shop', label: 'Shop', icon: ShoppingCart },
      { href: '/leaderboard', label: 'Leaderboard', icon: Medal },
    ]
  },
  {
    title: 'Work & Projects',
    items: [
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/instagram', label: 'Instagram', icon: Instagram },
      { href: '/freelance', label: 'Freelance', icon: Briefcase },
    ]
  },
  {
    title: 'Settings',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>([])

  // Auto-collapse: only keep the section with active page open
  useEffect(() => {
    const activeSection = navSections.find(section =>
      section.items.some(item => pathname === item.href)
    )
    if (activeSection) {
      setOpenSections([activeSection.title])
    }
  }, [pathname])

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title] // Allow multiple sections open
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-surface border border-border-subtle rounded-lg"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-surface border-r border-border-subtle z-40
        transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-accent-primary">DevX Daily OS</h1>
        </div>

        <nav className="px-3 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {navSections.map((section) => {
            const isOpen = openSections.includes(section.title)
            const hasActivePage = section.items.some(item => pathname === item.href)
            
            return (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-200 hover:bg-background ${
                    hasActivePage ? 'text-accent-primary' : 'text-foreground-muted'
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {section.title}
                  </span>
                  <div className={`transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
                    <ChevronDown size={14} />
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="space-y-1 mt-1 mb-2">
                    {section.items.map(item => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`
                            flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                            ${isActive 
                              ? 'bg-accent-primary/10 text-accent-primary' 
                              : 'text-foreground-muted hover:bg-background hover:text-foreground'
                            }
                          `}
                        >
                          <Icon size={18} />
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
