'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Announcement } from '@/types/database'
import { X, Info, AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react'

const typeConfig = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  update: { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' }
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get active announcements - simplified query
        const { data: announcementsData, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .eq('show_on_dashboard', true)
          .order('priority', { ascending: false })

        if (error) {
          console.error('Error fetching announcements:', error)
          return
        }

        if (!announcementsData || announcementsData.length === 0) {
          return
        }

        // Get dismissed announcements
        const { data: dismissals } = await supabase
          .from('announcement_dismissals')
          .select('announcement_id')
          .eq('user_id', user.id)

        const dismissedSet = new Set(dismissals?.map(d => d.announcement_id) || [])

        // Filter out expired and dismissed
        const now = new Date()
        const activeAnnouncements = announcementsData.filter(a => {
          if (dismissedSet.has(a.id)) return false
          if (a.start_date && new Date(a.start_date) > now) return false
          if (a.end_date && new Date(a.end_date) < now) return false
          return true
        })

        setAnnouncements(activeAnnouncements)
      } catch (err) {
        console.error('Announcement fetch error:', err)
      }
    }

    fetchAnnouncements()
  }, [])

  const dismissAnnouncement = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('announcement_dismissals').insert({
      user_id: user.id,
      announcement_id: id
    })

    setAnnouncements(announcements.filter(a => a.id !== id))
  }

  if (announcements.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {announcements.map(announcement => {
        const config = typeConfig[announcement.type]
        const Icon = config.icon
        return (
          <div key={announcement.id} className={`${config.bg} ${config.border} border rounded-xl p-4 flex items-start gap-3`}>
            <Icon size={20} className={`${config.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium ${config.color}`}>{announcement.title}</h4>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">{announcement.content}</p>
            </div>
            {announcement.is_dismissible && (
              <button
                onClick={() => dismissAnnouncement(announcement.id)}
                className="p-1 hover:bg-[var(--background)] rounded-lg transition flex-shrink-0"
              >
                <X size={16} className="text-[var(--foreground-muted)]" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
