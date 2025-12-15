'use client'

import { ChevronLeft, ChevronRight, Calendar, RotateCcw, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { useDate } from '@/contexts/DateContext'
import { useState, useRef, useEffect } from 'react'
import { getLocalDateString, getLocalDateDaysAgo, parseLocalDate, APP_TIMEZONE } from '@/lib/date-utils'

export default function DateNavigator() {
  const { selectedDate, isToday, goToToday, goToPreviousDay, goToNextDay, displayDate, canGoForward, setDate, isDateVerified, verifiedToday, verificationStatus, isDateManipulated, refreshVerification } = useDate()
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate calendar days for current month view
  const generateCalendarDays = () => {
    const selected = parseLocalDate(selectedDate)
    // Use verified today for accurate comparison
    const today = verifiedToday || getLocalDateString()
    const year = selected.getFullYear()
    const month = selected.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; isFuture: boolean }[] = []
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      const dateStr = getLocalDateString(d)
      days.push({
        date: dateStr,
        day: d.getDate(),
        isCurrentMonth: false,
        isToday: dateStr === today,
        isSelected: dateStr === selectedDate,
        isFuture: dateStr > today
      })
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i)
      const dateStr = getLocalDateString(d)
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isSelected: dateStr === selectedDate,
        isFuture: dateStr > today
      })
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()
  const selectedParsed = parseLocalDate(selectedDate)
  const monthYear = selectedParsed.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: APP_TIMEZONE })

  const goToPrevMonth = () => {
    const current = parseLocalDate(selectedDate)
    current.setMonth(current.getMonth() - 1)
    setDate(getLocalDateString(current))
  }

  const goToNextMonth = () => {
    const current = parseLocalDate(selectedDate)
    current.setMonth(current.getMonth() + 1)
    const newDate = getLocalDateString(current)
    if (newDate <= getLocalDateString()) {
      setDate(newDate)
    }
  }

  return (
    <div className="relative" ref={calendarRef}>
      <div className="flex items-center gap-2 bg-surface/80 backdrop-blur-sm rounded-xl border border-border-subtle p-1.5">
        {/* Previous Day */}
        <button
          onClick={goToPreviousDay}
          className="p-1.5 hover:bg-background rounded-lg transition text-foreground-muted hover:text-foreground"
          title="Previous day"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Date Display / Calendar Toggle */}
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition min-w-[120px] justify-center ${
            isToday 
              ? 'bg-accent-primary/10 text-accent-primary' 
              : 'bg-background hover:bg-background/80 text-foreground'
          } ${isDateManipulated ? 'ring-1 ring-red-500/50' : ''}`}
        >
          <Calendar size={14} />
          <span className="text-sm font-medium">{displayDate}</span>
          {/* Verification indicator */}
          {verificationStatus === 'pending' && (
            <Loader2 size={10} className="animate-spin text-yellow-500" />
          )}
          {verificationStatus === 'verified' && !isDateManipulated && (
            <ShieldCheck size={10} className="text-green-500" />
          )}
          {isDateManipulated && (
            <ShieldAlert size={10} className="text-red-500" />
          )}
        </button>

        {/* Next Day */}
        <button
          onClick={goToNextDay}
          disabled={!canGoForward}
          className={`p-1.5 rounded-lg transition ${
            canGoForward 
              ? 'hover:bg-background text-foreground-muted hover:text-foreground' 
              : 'text-foreground-muted/30 cursor-not-allowed'
          }`}
          title={canGoForward ? 'Next day' : "Can't go to future"}
        >
          <ChevronRight size={18} />
        </button>

        {/* Go to Today */}
        {!isToday && (
          <button
            onClick={goToToday}
            className="p-1.5 hover:bg-accent-primary/10 rounded-lg transition text-accent-primary"
            title="Go to today"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Calendar Dropdown - positioned to the right */}
      {showCalendar && (
        <div className="absolute top-full right-0 mt-2 bg-surface border border-border-subtle rounded-xl shadow-xl p-3 z-50 min-w-[280px] animate-in fade-in zoom-in-95 duration-200">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={goToPrevMonth} className="p-1 hover:bg-background rounded-lg transition">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium">{monthYear}</span>
            <button onClick={goToNextMonth} className="p-1 hover:bg-background rounded-lg transition">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs text-foreground-muted font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!day.isFuture) {
                    setDate(day.date)
                    setShowCalendar(false)
                  }
                }}
                disabled={day.isFuture}
                className={`
                  w-8 h-8 rounded-lg text-xs font-medium transition-all
                  ${day.isSelected ? 'bg-accent-primary text-white' : ''}
                  ${day.isToday && !day.isSelected ? 'ring-1 ring-accent-primary text-accent-primary' : ''}
                  ${!day.isCurrentMonth ? 'text-foreground-muted/40' : ''}
                  ${day.isFuture ? 'text-foreground-muted/20 cursor-not-allowed' : 'hover:bg-background'}
                  ${!day.isSelected && day.isCurrentMonth && !day.isFuture ? 'text-foreground' : ''}
                `}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-border-subtle">
            <button
              onClick={() => { goToToday(); setShowCalendar(false) }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                isToday 
                  ? 'bg-accent-primary text-white' 
                  : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => { setDate(getLocalDateDaysAgo(1)); setShowCalendar(false) }}
              className="flex-1 py-1.5 text-xs font-medium bg-background text-foreground rounded-lg hover:bg-background/80 transition"
            >
              Yesterday
            </button>
            <button
              onClick={() => { setDate(getLocalDateDaysAgo(7)); setShowCalendar(false) }}
              className="flex-1 py-1.5 text-xs font-medium bg-background text-foreground rounded-lg hover:bg-background/80 transition"
            >
              Week Ago
            </button>
          </div>

          {/* Info text with verification status */}
          <div className="text-[10px] text-foreground-muted text-center mt-2 flex items-center justify-center gap-1">
            <span>View past data • IST</span>
            {verificationStatus === 'pending' && (
              <span title="Verifying date...">
                <Loader2 size={10} className="animate-spin text-yellow-500" />
              </span>
            )}
            {verificationStatus === 'verified' && !isDateManipulated && (
              <span title="Date verified with server">
                <ShieldCheck size={10} className="text-green-500" />
              </span>
            )}
            {verificationStatus === 'failed' && (
              <span title="Could not verify date">
                <ShieldAlert size={10} className="text-yellow-500" />
              </span>
            )}
          </div>
          
          {/* Date manipulation warning */}
          {isDateManipulated && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-[10px] text-red-400 text-center flex items-center justify-center gap-1">
                <ShieldAlert size={12} />
                <span>System date mismatch detected!</span>
              </p>
              <button
                onClick={refreshVerification}
                className="w-full mt-1 py-1 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
              >
                Re-verify Date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
