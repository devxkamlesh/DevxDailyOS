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
  Sparkles
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/habits', label: 'Habits', icon: Target },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/instagram', label: 'Instagram', icon: Instagram },
  { href: '/freelance', label: 'Freelance', icon: Briefcase },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/templates', label: 'Templates', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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

        <nav className="px-3">
          {navItems.map(item => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition
                  ${isActive 
                    ? 'bg-accent-primary/10 text-accent-primary' 
                    : 'text-foreground-muted hover:bg-background hover:text-foreground'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
