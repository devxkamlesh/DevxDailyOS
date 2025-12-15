'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from '@/components/LogoutButton'
import { Sun, Moon, Sunrise, Calendar } from 'lucide-react'
import DateNavigator from '@/components/ui/DateNavigator'

interface HeaderProps {
  rightContent?: React.ReactNode
}

export default function Header({ rightContent }: HeaderProps) {
  const [userName, setUserName] = useState('there')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()

        const name = profile?.full_name || user.email?.split('@')[0] || 'there'
        setUserName(name)
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'Good Morning', icon: Sunrise, color: 'text-orange-400' }
    if (hour < 18) return { text: 'Good Afternoon', icon: Sun, color: 'text-yellow-400' }
    return { text: 'Good Evening', icon: Moon, color: 'text-indigo-400' }
  }

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  if (loading) {
    return (
      <header className="flex items-center justify-between mb-8 p-4 bg-surface/50 rounded-2xl border border-border-subtle">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-background rounded-xl animate-pulse" />
          <div>
            <div className="h-6 bg-background rounded w-48 animate-pulse mb-2" />
            <div className="h-4 bg-background rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="h-9 bg-background rounded-lg w-24 animate-pulse" />
      </header>
    )
  }

  return (
    <header className="flex items-center justify-between mb-8 p-4 bg-gradient-to-r from-surface/80 to-surface/40 rounded-2xl border border-border-subtle backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* Greeting Icon */}
        <div className={`w-12 h-12 rounded-xl bg-background flex items-center justify-center ${greeting.color}`}>
          <GreetingIcon size={24} />
        </div>
        
        {/* Text Content */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            {greeting.text}, <span className="text-accent-primary">{userName}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <div className="flex items-center gap-2 text-foreground-muted text-sm mt-0.5">
            <Calendar size={14} />
            <span>{currentDate}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Date Navigator - View past dates */}
        <DateNavigator />
        {rightContent}
        <LogoutButton />
      </div>
    </header>
  )
}