'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle2, Rocket, Instagram, Briefcase } from 'lucide-react'
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
  const supabase = createClient()

  useEffect(() => {
    const fetchActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const activities: Activity[] = []

      // Fetch recent habit logs
      const { data: habitLogs } = await supabase
        .from('habit_logs')
        .select('*, habits(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

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
      const { data: projects } = await supabase
        .from('projects')
        .select('name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2)

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
      const { data: posts } = await supabase
        .from('instagram_posts')
        .select('title, hook, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2)

      posts?.forEach(post => {
        activities.push({
          id: post.title || post.hook || '',
          type: 'instagram',
          title: `New post: ${post.title || post.hook?.slice(0, 30) || 'Untitled'}`,
          timestamp: post.created_at,
          icon: Instagram,
          color: 'text-purple-400',
          link: '/instagram'
        })
      })

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(activities.slice(0, 5))
      setLoading(false)
    }

    fetchActivity()
  }, [])

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
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-accent-primary" />
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-foreground-muted text-sm">
          Loading...
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground-muted text-sm mb-2">No recent activity</p>
          <p className="text-xs text-foreground-muted">Start by adding a habit or project</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => {
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
