'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw,
  ExternalLink, Clock, MapPin, Users, Video, LogOut, Plus,
  AlertCircle, Edit2, Trash2, X, Save, Loader2, Bell,
  Globe, Type, AlignLeft, PlusCircle, Minus, ChevronDown, Check
} from 'lucide-react'



// Custom Smooth Dropdown Component
function SmoothSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...',
  className = ''
}: { 
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useState<HTMLDivElement | null>(null)
  
  const selectedOption = options.find(opt => opt.value === value)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef[0] && !dropdownRef[0].contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div ref={(el) => { dropdownRef[0] = el }} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--accent-primary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm text-left"
      >
        <span className={selectedOption ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={16} className={`text-[var(--foreground-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 py-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-[var(--background)] transition-colors ${
                value === option.value ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'text-[var(--foreground)]'
              }`}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={14} className="text-[var(--accent-primary)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  location?: string
  hangoutLink?: string
  attendees?: { email: string; responseStatus: string }[]
  htmlLink: string
  colorId?: string
  recurrence?: string[]
}

interface GoogleCalendar {
  id: string
  summary: string
  primary?: boolean
  backgroundColor?: string
  accessRole?: string
}

interface EventFormData {
  summary: string
  description: string
  location: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  allDay: boolean
  colorId: string
  reminders: string[]
  visibility: string
  conferenceLink: string
}

const reminderOptions = [
  { value: '', label: 'No reminder' },
  { value: '0', label: 'At time of event' },
  { value: '5', label: '5 minutes before' },
  { value: '10', label: '10 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
  { value: '10080', label: '1 week before' },
]

const visibilityOptions = [
  { value: 'default', label: 'Default visibility' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const eventColors: Record<string, { bg: string; border: string; text: string; name: string }> = {
  '1': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', name: 'Lavender' },
  '2': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', name: 'Sage' },
  '3': { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', name: 'Grape' },
  '4': { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', name: 'Flamingo' },
  '5': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', name: 'Banana' },
  '6': { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', name: 'Tangerine' },
  '7': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', name: 'Peacock' },
  '8': { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-400', name: 'Graphite' },
  '9': { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400', name: 'Blueberry' },
  '10': { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400', name: 'Basil' },
  '11': { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-400', name: 'Tomato' },
  'default': { bg: 'bg-[var(--accent-primary)]/20', border: 'border-[var(--accent-primary)]/50', text: 'text-[var(--accent-primary)]', name: 'Default' }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar'

const initialFormData: EventFormData = {
  summary: '',
  description: '',
  location: '',
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '10:00',
  allDay: false,
  colorId: 'default',
  reminders: ['30'],
  visibility: 'default',
  conferenceLink: ''
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
  // Event form state
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<GoogleCalendarEvent | null>(null)
  const [formData, setFormData] = useState<EventFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']


  useEffect(() => {
    const savedToken = localStorage.getItem('google_calendar_token')
    const savedEmail = localStorage.getItem('google_calendar_email')
    const tokenExpiry = localStorage.getItem('google_calendar_expiry')
    
    if (savedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
      setAccessToken(savedToken)
      setUserEmail(savedEmail)
    } else {
      localStorage.removeItem('google_calendar_token')
      localStorage.removeItem('google_calendar_email')
      localStorage.removeItem('google_calendar_expiry')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (accessToken) fetchCalendars()
  }, [accessToken])

  useEffect(() => {
    if (accessToken && selectedCalendarId) fetchEvents()
  }, [accessToken, currentDate, selectedCalendarId])

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const token = params.get('access_token')
      const expiresIn = params.get('expires_in')
      
      if (token) {
        const expiry = Date.now() + (parseInt(expiresIn || '3600') * 1000)
        localStorage.setItem('google_calendar_token', token)
        localStorage.setItem('google_calendar_expiry', expiry.toString())
        setAccessToken(token)
        
        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json()).then(data => {
          if (data.email) {
            localStorage.setItem('google_calendar_email', data.email)
            setUserEmail(data.email)
          }
        })
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [])


  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID not configured')
      return
    }
    const redirectUri = `${window.location.origin}/calendar`
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(GOOGLE_SCOPES)}&prompt=consent`
    
    // Use popup window to prevent logout issue
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    
    const popup = window.open(
      authUrl,
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    )
    
    // Listen for the popup to redirect back with token
    const checkPopup = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(checkPopup)
          return
        }
        
        // Check if popup redirected back to our domain
        if (popup.location.origin === window.location.origin) {
          const hash = popup.location.hash
          if (hash) {
            const params = new URLSearchParams(hash.substring(1))
            const token = params.get('access_token')
            const expiresIn = params.get('expires_in')
            
            if (token) {
              const expiry = Date.now() + (parseInt(expiresIn || '3600') * 1000)
              localStorage.setItem('google_calendar_token', token)
              localStorage.setItem('google_calendar_expiry', expiry.toString())
              setAccessToken(token)
              
              // Get user email
              fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              }).then(res => res.json()).then(data => {
                if (data.email) {
                  localStorage.setItem('google_calendar_email', data.email)
                  setUserEmail(data.email)
                }
              })
            }
          }
          popup.close()
          clearInterval(checkPopup)
        }
      } catch (e) {
        // Cross-origin error - popup is still on Google's domain, keep waiting
      }
    }, 500)
  }

  const handleLogout = () => {
    localStorage.removeItem('google_calendar_token')
    localStorage.removeItem('google_calendar_email')
    localStorage.removeItem('google_calendar_expiry')
    setAccessToken(null)
    setUserEmail(null)
    setEvents([])
    setCalendars([])
  }

  const fetchCalendars = async () => {
    if (!accessToken) return
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) {
        if (response.status === 401) { handleLogout(); setError('Session expired'); return }
        throw new Error('Failed to fetch calendars')
      }
      const data = await response.json()
      setCalendars(data.items || [])
      const primary = data.items?.find((c: GoogleCalendar) => c.primary)
      if (primary) setSelectedCalendarId(primary.id)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchEvents = async () => {
    if (!accessToken || !selectedCalendarId) return
    setSyncing(true)
    setError(null)
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendarId)}/events?timeMin=${startOfMonth.toISOString()}&timeMax=${endOfMonth.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=250`
      const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!response.ok) {
        if (response.status === 401) { handleLogout(); setError('Session expired'); return }
        throw new Error('Failed to fetch events')
      }
      const data = await response.json()
      setEvents(data.items || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }


  const openCreateForm = (date?: Date) => {
    const d = date || selectedDate
    // Use local date format to avoid timezone issues
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    setFormData({ ...initialFormData, startDate: dateStr, endDate: dateStr })
    setEditingEvent(null)
    setShowEventForm(true)
  }

  const openEditForm = (event: GoogleCalendarEvent) => {
    const startDateTime = event.start.dateTime ? new Date(event.start.dateTime) : null
    const endDateTime = event.end.dateTime ? new Date(event.end.dateTime) : null
    const isAllDay = !event.start.dateTime
    
    setFormData({
      summary: event.summary || '',
      description: event.description || '',
      location: event.location || '',
      startDate: event.start.date || (startDateTime ? startDateTime.toISOString().split('T')[0] : ''),
      startTime: startDateTime ? startDateTime.toTimeString().slice(0, 5) : '09:00',
      endDate: event.end.date || (endDateTime ? endDateTime.toISOString().split('T')[0] : ''),
      endTime: endDateTime ? endDateTime.toTimeString().slice(0, 5) : '10:00',
      allDay: isAllDay,
      colorId: event.colorId || 'default',
      reminders: ['30'],
      visibility: 'default',
      conferenceLink: event.hangoutLink || ''
    })
    setEditingEvent(event)
    setShowEventForm(true)
  }

  const handleSaveEvent = async () => {
    if (!accessToken || !formData.summary.trim()) return
    setSaving(true)
    setError(null)

    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const eventBody: any = {
        summary: formData.summary,
        description: formData.description,
        location: formData.location,
      }

      if (formData.colorId !== 'default') {
        eventBody.colorId = formData.colorId
      }

      // Add visibility
      if (formData.visibility !== 'default') {
        eventBody.visibility = formData.visibility
      }

      // Add reminders (multiple)
      const validReminders = formData.reminders.filter(r => r !== '')
      if (validReminders.length > 0) {
        eventBody.reminders = {
          useDefault: false,
          overrides: validReminders.map(r => ({ method: 'popup', minutes: parseInt(r) }))
        }
      }

      // Add conference link to description if provided
      if (formData.conferenceLink) {
        eventBody.description = formData.description 
          ? `${formData.description}\n\n📹 Video Call: ${formData.conferenceLink}`
          : `📹 Video Call: ${formData.conferenceLink}`
      }

      if (formData.allDay) {
        eventBody.start = { date: formData.startDate }
        eventBody.end = { date: formData.endDate || formData.startDate }
      } else {
        eventBody.start = { dateTime: `${formData.startDate}T${formData.startTime}:00`, timeZone }
        eventBody.end = { dateTime: `${formData.endDate || formData.startDate}T${formData.endTime}:00`, timeZone }
      }

      let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendarId)}/events`
      let method = 'POST'

      if (editingEvent) {
        url += `/${editingEvent.id}`
        method = 'PUT'
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || 'Failed to save event')
      }

      setShowEventForm(false)
      setEditingEvent(null)
      setFormData(initialFormData)
      fetchEvents()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }


  const handleDeleteEvent = async () => {
    if (!accessToken || !editingEvent) return
    if (!confirm('Delete this event from Google Calendar?')) return
    
    setDeleting(true)
    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendarId)}/events/${editingEvent.id}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete event')
      }
      setShowEventForm(false)
      setEditingEvent(null)
      fetchEvents()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const getEventsForDate = (date: Date) => {
    // Use local date format to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    return events.filter(event => {
      if (event.start.dateTime) {
        const eventDate = new Date(event.start.dateTime)
        const eYear = eventDate.getFullYear()
        const eMonth = String(eventDate.getMonth() + 1).padStart(2, '0')
        const eDay = String(eventDate.getDate()).padStart(2, '0')
        return `${eYear}-${eMonth}-${eDay}` === dateStr
      }
      return event.start.date === dateStr
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day))
    return days
  }

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(prev.getMonth() + (dir === 'prev' ? -1 : 1))
      return d
    })
  }

  const isToday = (date: Date | null) => date?.toDateString() === new Date().toDateString()
  const isSelected = (date: Date | null) => date?.toDateString() === selectedDate?.toDateString()
  const formatTime = (dt: string) => new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const getColorClass = (colorId?: string) => {
    const c = eventColors[colorId || 'default']
    return `${c.bg} ${c.border} ${c.text}`
  }

  const days = getDaysInMonth(currentDate)
  const selectedDateEvents = getEventsForDate(selectedDate)


  if (loading) {
    return (
      <>
        <Header />
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-[var(--surface)]/50 rounded-2xl border border-[var(--border-subtle)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--background)] animate-pulse" />
              <div>
                <div className="h-6 w-40 bg-[var(--background)] rounded animate-pulse mb-2" />
                <div className="h-4 w-28 bg-[var(--background)] rounded animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-36 bg-[var(--background)] rounded-xl animate-pulse" />
          </div>

          {/* Connect Prompt Skeleton */}
          <div className="bg-[var(--surface)]/50 rounded-2xl border border-[var(--border-subtle)] p-12">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[var(--background)] rounded-xl animate-pulse mb-4" />
              <div className="h-6 w-64 bg-[var(--background)] rounded animate-pulse mb-2" />
              <div className="h-4 w-80 bg-[var(--background)] rounded animate-pulse mb-6" />
              <div className="h-11 w-44 bg-[var(--background)] rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="space-y-6">
        {/* Header - Styled like dashboard */}
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-gradient-to-r from-[var(--surface)]/80 to-[var(--surface)]/40 rounded-2xl border border-[var(--border-subtle)] backdrop-blur-sm animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out">
          <div className="flex items-center gap-4">
            {/* Calendar Icon */}
            <div className="w-12 h-12 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent-primary)]">
              <CalendarIcon size={24} />
            </div>
            
            {/* Text Content */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                Google <span className="text-[var(--accent-primary)]">Calendar</span>
              </h1>
              <div className="flex items-center gap-2 text-[var(--foreground-muted)] text-sm mt-0.5">
                {accessToken ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Connected as <span className="text-[var(--foreground)]">{userEmail || 'Google Account'}</span></span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span>Not connected</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {accessToken ? (
              <>
                <button onClick={() => openCreateForm()} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition font-medium text-sm">
                  <Plus size={16} /> New Event
                </button>
                <button onClick={fetchEvents} disabled={syncing} className="flex items-center gap-2 px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--accent-primary)]/50 transition disabled:opacity-50 text-sm">
                  <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition text-sm">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <button onClick={handleGoogleLogin} className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition font-medium shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Connect Google
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <div><p className="font-medium text-red-400">Error</p><p className="text-sm text-[var(--foreground-muted)]">{error}</p></div>
          </div>
        )}


        {!accessToken && !error && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-12 text-center animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out">
            <CalendarIcon size={48} className="mx-auto mb-4 text-[var(--foreground-muted)] opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Google Calendar</h2>
            <p className="text-[var(--foreground-muted)] mb-6 max-w-md mx-auto">Sign in with Google to sync, create, and edit your calendar events.</p>
            <button onClick={handleGoogleLogin} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition font-medium shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Connect with Google
            </button>
          </div>
        )}

        {accessToken && (
          <>
            {calendars.length > 1 && (
              <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
                <span className="text-sm text-[var(--foreground-muted)]">Calendar:</span>
                <SmoothSelect
                  value={selectedCalendarId}
                  onChange={setSelectedCalendarId}
                  options={calendars.map(cal => ({ value: cal.id, label: `${cal.summary}${cal.primary ? ' (Primary)' : ''}` }))}
                  className="min-w-[280px]"
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-[var(--background)] rounded-lg transition"><ChevronLeft size={20} /></button>
                  <h2 className="text-xl font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                  <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-[var(--background)] rounded-lg transition"><ChevronRight size={20} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => <div key={day} className="text-center text-xs font-medium text-[var(--foreground-muted)] py-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, i) => {
                    const dayEvents = day ? getEventsForDate(day) : []
                    const hasEvents = dayEvents.length > 0
                    const firstEventColor = hasEvents ? eventColors[dayEvents[0].colorId || 'default'] : null
                    return (
                      <div key={i} onClick={() => day && setSelectedDate(day)} onDoubleClick={() => day && openCreateForm(day)}
                        className={`h-[90px] text-sm rounded-xl transition-all cursor-pointer border relative
                          ${day ? 'hover:bg-[var(--background)] hover:border-[var(--border-subtle)]' : 'cursor-default'}
                          ${isToday(day) ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]' : 'border-transparent'}
                          ${isSelected(day) ? 'ring-2 ring-[var(--accent-primary)] ring-offset-1 ring-offset-[var(--surface)]' : ''}`}>
                        {day && (
                          <>
                            {/* Date number - positioned at top when has events */}
                            <div className={`absolute flex items-center justify-center ${hasEvents ? 'top-1 left-0 right-0' : 'inset-0'}`}>
                              <span className={`font-semibold ${
                                isToday(day) 
                                  ? 'text-[var(--accent-primary)] text-lg' 
                                  : hasEvents && firstEventColor
                                    ? `${firstEventColor.text} text-sm` 
                                    : 'text-[var(--foreground-muted)] text-lg'
                              }`}>
                                {day.getDate()}
                              </span>
                            </div>
                            {/* Events overlay */}
                            {hasEvents && (
                              <div className="absolute inset-x-0 bottom-0 p-1.5">
                                <div className="space-y-0.5">
                                  {dayEvents.slice(0, 2).map((e, j) => (
                                    <div key={j} className={`text-[10px] px-1.5 py-0.5 rounded-md truncate border font-medium ${getColorClass(e.colorId)}`}>
                                      {e.summary}
                                    </div>
                                  ))}
                                  {dayEvents.length > 2 && (
                                    <div className={`text-[10px] text-center font-medium ${firstEventColor}`}>
                                      +{dayEvents.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>


              {/* Selected Date Events */}
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out delay-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                  <button onClick={() => openCreateForm()} className="p-2 hover:bg-[var(--background)] rounded-lg transition text-[var(--accent-primary)]"><Plus size={18} /></button>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8 text-[var(--foreground-muted)]">
                      <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No events</p>
                      <button onClick={() => openCreateForm()} className="text-[var(--accent-primary)] text-sm mt-2 hover:underline">Create event</button>
                    </div>
                  ) : (
                    selectedDateEvents.map(event => (
                      <div key={event.id} onClick={() => openEditForm(event)} className={`p-3 rounded-xl border cursor-pointer hover:opacity-80 transition ${getColorClass(event.colorId)}`}>
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{event.summary}</h4>
                          <Edit2 size={14} className="opacity-50" />
                        </div>
                        {event.start.dateTime && <div className="flex items-center gap-1 text-xs mt-2 opacity-80"><Clock size={12} />{formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime!)}</div>}
                        {event.location && <div className="flex items-center gap-1 text-xs mt-1 opacity-80"><MapPin size={12} /><span className="truncate">{event.location}</span></div>}
                        {event.hangoutLink && <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs mt-1 hover:underline"><Video size={12} />Join Meet</a>}
                        {event.attendees && event.attendees.length > 0 && <div className="flex items-center gap-1 text-xs mt-1 opacity-80"><Users size={12} />{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</div>}
                        <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs mt-2 hover:underline opacity-60"><ExternalLink size={12} />Open in Google</a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Event Form Modal */}
        {showEventForm && (
          <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {/* Compact Header */}
              <div className="relative bg-gradient-to-r from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/5 px-4 py-3 border-b border-[var(--border-subtle)]">
                <button 
                  onClick={() => { setShowEventForm(false); setEditingEvent(null); setFormData(initialFormData); }} 
                  className="absolute top-2.5 right-3 p-1.5 hover:bg-black/10 rounded-full transition"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${eventColors[formData.colorId]?.bg || 'bg-[var(--accent-primary)]/20'}`}>
                    <CalendarIcon size={18} className={eventColors[formData.colorId]?.text || 'text-[var(--accent-primary)]'} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select date'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--border-subtle)] scrollbar-track-transparent hover:scrollbar-thumb-[var(--foreground-muted)]/30" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border-subtle) transparent' }}>
                {/* Title Input */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                    <Type size={16} />
                  </div>
                  <input
                    type="text"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Add title"
                    className="w-full pl-10 pr-3 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent font-medium placeholder:text-[var(--foreground-muted)] transition-all"
                  />
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[var(--foreground-muted)]" />
                    <span className="text-sm font-medium">All day</span>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, allDay: !formData.allDay })}
                    className={`relative w-10 h-6 rounded-full transition-colors ${formData.allDay ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-subtle)]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${formData.allDay ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">Start</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value, endDate: formData.endDate || e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm"
                    />
                    {!formData.allDay && (
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">End</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm"
                    />
                    {!formData.allDay && (
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm"
                      />
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                    <MapPin size={16} />
                  </div>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Add location"
                    className="w-full pl-10 pr-3 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm"
                  />
                </div>

                {/* Video Conference Link */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                    <Video size={16} />
                  </div>
                  <input
                    type="url"
                    value={formData.conferenceLink}
                    onChange={(e) => setFormData({ ...formData, conferenceLink: e.target.value })}
                    placeholder="Video call link (Meet, Zoom)"
                    className="w-full pl-10 pr-3 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm"
                  />
                </div>

                {/* Description */}
                <div className="relative">
                  <div className="absolute left-3 top-3 text-[var(--foreground-muted)]">
                    <AlignLeft size={16} />
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add description"
                    rows={2}
                    className="w-full pl-10 pr-3 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none transition-all text-sm"
                  />
                </div>

                {/* Reminders - Multiple */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
                      <Bell size={14} /> Reminders
                    </label>
                    {formData.reminders.length < 5 && (
                      <button
                        onClick={() => setFormData({ ...formData, reminders: [...formData.reminders, '30'] })}
                        className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline"
                      >
                        <PlusCircle size={14} /> Add reminder
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {formData.reminders.map((reminder, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <SmoothSelect
                          value={reminder}
                          onChange={(value) => {
                            const newReminders = [...formData.reminders]
                            newReminders[index] = value
                            setFormData({ ...formData, reminders: newReminders })
                          }}
                          options={reminderOptions}
                          className="flex-1"
                        />
                        {formData.reminders.length > 1 && (
                          <button
                            onClick={() => {
                              const newReminders = formData.reminders.filter((_, i) => i !== index)
                              setFormData({ ...formData, reminders: newReminders })
                            }}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          >
                            <Minus size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
                    <Globe size={14} /> Visibility
                  </label>
                  <SmoothSelect
                    value={formData.visibility}
                    onChange={(value) => setFormData({ ...formData, visibility: value })}
                    options={visibilityOptions}
                  />
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(eventColors).map(([id, color]) => (
                      <button
                        key={id}
                        onClick={() => setFormData({ ...formData, colorId: id })}
                        className={`relative w-7 h-7 rounded-lg border transition-all duration-150 ${color.bg} 
                          ${formData.colorId === id 
                            ? 'ring-2 ring-[var(--accent-primary)] scale-110 border-white/40' 
                            : 'border-transparent hover:scale-105 hover:border-white/20'}`}
                        title={color.name}
                      >
                        {formData.colorId === id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}
              </div>

              {/* Compact Actions Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--background)]/50">
                <div>
                  {editingEvent && (
                    <button
                      onClick={handleDeleteEvent}
                      disabled={deleting}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 text-sm font-medium"
                    >
                      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowEventForm(false); setEditingEvent(null); setFormData(initialFormData); }}
                    className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--background)] transition-all text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    disabled={saving || !formData.summary.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 text-sm font-semibold"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {editingEvent ? 'Save' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}