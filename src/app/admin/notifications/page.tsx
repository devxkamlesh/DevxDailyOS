'use client'

import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { Bell, Send, Users, CheckCircle2, AlertCircle, Info } from 'lucide-react'

export default function AdminNotificationsPage() {
  const { showToast } = useToast()
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning',
    target: 'all' as 'all' | 'active' | 'inactive'
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const sentTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (sentTimerRef.current) {
        clearTimeout(sentTimerRef.current)
      }
    }
  }, [])

  const handleSend = async () => {
    if (!notification.title || !notification.message) {
      showToast('Please fill in all fields', 'warning')
      return
    }
    
    setSending(true)
    // In production, this would send to a notification service
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSending(false)
    setSent(true)
    
    // Clear existing timer if any
    if (sentTimerRef.current) {
      clearTimeout(sentTimerRef.current)
    }
    
    // Set timer with cleanup
    sentTimerRef.current = setTimeout(() => {
      setSent(false)
      sentTimerRef.current = null
    }, 3000)
    
    setNotification({ title: '', message: '', type: 'info', target: 'all' })
  }

  const typeIcons = { info: Info, success: CheckCircle2, warning: AlertCircle }
  const typeColors = { 
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    success: 'bg-green-500/20 text-green-400 border-green-500/50',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="text-yellow-400" />
          Send Notification
        </h1>
        <p className="text-foreground-muted">Broadcast messages to users</p>
      </div>

      {sent && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="text-green-400" />
          <span className="text-green-400">Notification sent successfully!</span>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border-subtle p-6 space-y-6">
        {/* Notification Type */}
        <div>
          <label className="block text-sm font-medium mb-3">Notification Type</label>
          <div className="flex gap-3">
            {(['info', 'success', 'warning'] as const).map((type) => {
              const Icon = typeIcons[type]
              return (
                <button
                  key={type}
                  onClick={() => setNotification({ ...notification, type })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition capitalize ${
                    notification.type === type ? typeColors[type] : 'border-border-subtle hover:border-foreground-muted'
                  }`}
                >
                  <Icon size={18} />
                  {type}
                </button>
              )
            })}
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium mb-3">Target Audience</label>
          <div className="flex gap-3">
            {[
              { value: 'all', label: 'All Users', icon: Users },
              { value: 'active', label: 'Active Users', icon: CheckCircle2 },
              { value: 'inactive', label: 'Inactive Users', icon: AlertCircle }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setNotification({ ...notification, target: option.value as any })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition ${
                  notification.target === option.value
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-subtle hover:border-foreground-muted'
                }`}
              >
                <option.icon size={18} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={notification.title}
            onChange={(e) => setNotification({ ...notification, title: e.target.value })}
            className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Notification title..."
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            value={notification.message}
            onChange={(e) => setNotification({ ...notification, message: e.target.value })}
            className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
            rows={4}
            placeholder="Write your message..."
          />
        </div>

        {/* Preview */}
        {(notification.title || notification.message) && (
          <div>
            <label className="block text-sm font-medium mb-2">Preview</label>
            <div className={`p-4 rounded-xl border-2 ${typeColors[notification.type]}`}>
              <div className="flex items-start gap-3">
                {(() => {
                  const Icon = typeIcons[notification.type]
                  return <Icon size={20} />
                })()}
                <div>
                  <p className="font-bold">{notification.title || 'Title'}</p>
                  <p className="text-sm opacity-80">{notification.message || 'Message'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || !notification.title || !notification.message}
          className="w-full flex items-center justify-center gap-2 py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          <Send size={18} />
          {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </div>

      {/* Recent Notifications */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6">
        <h2 className="text-lg font-bold mb-4">Recent Notifications</h2>
        <div className="space-y-3">
          <div className="p-4 bg-background rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Welcome to DevX Daily OS!</span>
              <span className="text-xs text-foreground-muted">2 days ago</span>
            </div>
            <p className="text-sm text-foreground-muted">Start your productivity journey today...</p>
          </div>
          <div className="p-4 bg-background rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">New Feature: Focus Timer</span>
              <span className="text-xs text-foreground-muted">1 week ago</span>
            </div>
            <p className="text-sm text-foreground-muted">Try our new Pomodoro-style focus timer...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
