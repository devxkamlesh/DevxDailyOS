'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from '@/components/LogoutButton'

export default function Header() {
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
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return (
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 bg-background rounded w-48 animate-pulse mb-2" />
          <div className="h-4 bg-background rounded w-32 animate-pulse" />
        </div>
        <div className="h-10 bg-background rounded w-20 animate-pulse" />
      </header>
    )
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">{getGreeting()}, {userName} 👋</h1>
        <p className="text-foreground-muted mt-1">{currentDate}</p>
      </div>
      <LogoutButton />
    </header>
  )
}