'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle2, Rocket, Camera, Briefcase } from 'lucide-react'
import Link from 'next/link'

interface Activity {
  id: string
  type: 'habit' | 'task' | 'project' | 'instagram' | 'freelance'
  title: string
  timestamp: string
  icon: any
  color: string
  link: string
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivity = useCallback(async () => {
    let mounted = true
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return
        
        if (!user) {
          setLoading(false)
          return
        }

        const activities: Activity[] = []

        // Fetch recent habit logs - use explicit FK reference to avoid ambiguity
        const { data: habitLogs, error: habitLogsError } = await supabase
          .from('habit_logs')
          .select('*, habits!habit_logs_habit_id_fkey(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)

        if (habitLogsError) {
          console.error('Error fetching habit logs:', habitLogsError.message, habitLogsError.code, habitLogsError.details)
        }

        habitLogs?.forEach(log => {
          if (log.habits) {
            activities.push({
              id: log.id,
              type: 'habit',
              title: `Completed: ${log.habits.name}`,
              timestamp: log.created_at,
              icon: CheckCircle2,
              color: 'text-accent-success',
              link: '/habits'
            })
          }
        })

        // Fetch recent projects
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2)

        if (projectsError) {
          console.error('Error fetching projects:', projectsError)
        }

        projects?.forEach(project => {
          activities.push({
            id: project.name,
            type: 'project',
            title: `New project: ${project.name}`,
            timestamp: project.created_at,
            icon: Rocket,
            color: 'text-blue-400',
            link: '/projects'
          })
        })

        // Fetch recent Instagram posts
        const { data: posts, error: postsError } = await supabase
          .from('instagram_posts')
          .select('title, hook, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2)

        if (postsError) {
          console.error('Error fetching posts:', postsError)
        }

        posts?.forEach(post => {
          activities.push({
            id: post.title || post.hook || '',
            type: 'instagram',
            title: `New post: ${post.title || post.hook?.slice(0, 30) || 'Untitled'}`,
            timestamp: post.created_at,
            icon: Camera,
            color: 'text-purple-400',
            link: '/instagram'
          })
        })

        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      if (mounted) {
        setActivities(activities.slice(0, 5))
        setLoading(false)
      }
    } catch (error) {
      console.error('Error in fetchActivity:', error)
      if (mounted) setLoading(false)
    }
    
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    fetchActivity()
    
    // Listen for habit updates to refresh activity in realtime
    const handleHabitUpdate = () => fetchActivity()
    window.addEventListener('habitUpdated', handleHabitUpdate)
    
    // Fallback timeout
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('habitUpdated', handleHabitUpdate)
    }
  }, [fetchActivity])

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diff = now.getTime() - then.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out" style={{ zIndex: 1 }}>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-accent-primary" />
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <div className="w-9 h-9 bg-background rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-background rounded animate-pulse mb-2" />
                <div className="h-3 w-16 bg-background rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-foreground-muted text-sm mb-2">No recent activity</p>
          <p className="text-xs text-foreground-muted">Start by adding a habit or project</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 3).map((activity, index) => {
            const Icon = activity.icon
            return (
              <Link
                key={`${activity.type}-${index}`}
                href={activity.link}
                className="flex items-start gap-3 p-3 bg-background rounded-lg hover:bg-background/80 transition group"
              >
                <div className={`p-2 rounded-lg bg-surface ${activity.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-accent-primary transition">
                    {activity.title}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
