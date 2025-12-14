'use client'

import Link from 'next/link'
import { Calendar, Target, Zap, Trophy, BookOpen, Camera } from 'lucide-react'

export default function QuickActions() {
  const actions = [
    {
      icon: Target,
      label: 'Add Habit',
      href: '/habits',
      color: 'text-green-400',
      bg: 'bg-green-500/10 hover:bg-green-500/20'
    },
    {
      icon: Zap,
      label: 'Focus Session',
      href: '/focus',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20'
    },
    {
      icon: BookOpen,
      label: 'Journal',
      href: '/journal',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 hover:bg-purple-500/20'
    },
    {
      icon: Calendar,
      label: 'Calendar',
      href: '/calendar',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 hover:bg-orange-500/20'
    },
    {
      icon: Trophy,
      label: 'Achievements',
      href: '/achievements',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 hover:bg-yellow-500/20'
    },
    {
      icon: Camera,
      label: 'Instagram',
      href: '/instagram',
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 hover:bg-pink-500/20'
    }
  ]

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={20} className="text-accent-primary" />
        <h2 className="text-lg font-semibold">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 p-3 rounded-lg transition-all ${action.bg} group`}
            >
              <Icon size={16} className={action.color} />
              <span className="text-sm font-medium group-hover:text-accent-primary transition">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}