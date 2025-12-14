'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Clock, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface TimeBlock {
  id: string
  date: string
  start_time: string
  end_time: string
  title: string
  description: string
  color: string
  completed: boolean
}

interface TimeBlockFormData {
  date: string
  start_time: string
  end_time: string
  title: string
  description: string
  color: string
}

const initialFormData: TimeBlockFormData = {
  date: '',
  start_time: '09:00',
  end_time: '10:00',
  title: '',
  description: '',
  color: '#3b82f6'
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [formData, setFormData] = useState<TimeBlockFormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  useEffect(() => {
    fetchTimeBlocks()
  }, [currentDate])

  const fetchTimeBlocks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('start_time')

      if (error) throw error
      setTimeBlocks(data || [])
    } catch (error) {
      console.error('Error fetching time blocks:', error)
      toast.error('Failed to load time blocks')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (editingBlock) {
        const { error } = await supabase
          .from('time_blocks')
          .update(formData)
          .eq('id', editingBlock.id)

        if (error) throw error
        toast.success('Time block updated')
      } else {
        const { error } = await supabase
          .from('time_blocks')
          .insert([{ ...formData, user_id: user.id }])

        if (error) throw error
        toast.success('Time block created')
      }

      setDialogOpen(false)
      setEditingBlock(null)
      setFormData(initialFormData)
      fetchTimeBlocks()
    } catch (error) {
      console.error('Error saving time block:', error)
      toast.error('Failed to save time block')
    }
  }

  const handleEdit = (block: TimeBlock) => {
    setEditingBlock(block)
    setFormData({
      date: block.date,
      start_time: block.start_time,
      end_time: block.end_time,
      title: block.title,
      description: block.description,
      color: block.color
    })
    setDialogOpen(true)
  }

  const handleDelete = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this time block?')) return

    try {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error
      toast.success('Time block deleted')
      fetchTimeBlocks()
    } catch (error) {
      console.error('Error deleting time block:', error)
      toast.error('Failed to delete time block')
    }
  }

  const toggleCompleted = async (blockId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('time_blocks')
        .update({ completed: !completed })
        .eq('id', blockId)

      if (error) throw error
      fetchTimeBlocks()
    } catch (error) {
      console.error('Error updating time block:', error)
      toast.error('Failed to update time block')
    }
  }

  const getTimeBlocksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return timeBlocks.filter(block => block.date === dateString)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setFormData(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }))
  }

  const days = getDaysInMonth(currentDate)

  return (
    <>
      <Header />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-accent-primary" size={28} />
            <h1 className="text-2xl font-bold">Calendar</h1>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-background rounded-lg transition"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h2 className="text-xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-background rounded-lg transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-foreground-muted py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dayBlocks = day ? getTimeBlocksForDate(day) : []
              return (
                <div
                  key={index}
                  onClick={() => day && handleDateClick(day)}
                  className={`
                    aspect-square flex flex-col items-center justify-start p-1 text-sm rounded-lg transition-all cursor-pointer relative
                    ${day ? 'hover:bg-background' : ''}
                    ${isToday(day) ? 'bg-accent-primary text-white font-bold' : ''}
                    ${isSelected(day) ? 'ring-2 ring-accent-primary' : ''}
                    ${day && !isToday(day) && !isSelected(day) ? 'text-foreground' : ''}
                    ${!day ? 'text-transparent cursor-default' : ''}
                  `}
                >
                  {day && (
                    <>
                      <span className="mb-1">{day.getDate()}</span>
                      {dayBlocks.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 w-full">
                          {dayBlocks.slice(0, 3).map((block, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: block.color }}
                            />
                          ))}
                          {dayBlocks.length > 3 && (
                            <div className="text-xs">+{dayBlocks.length - 3}</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Time Blocks for Selected Date */}
        {selectedDate && (
          <div className="bg-surface rounded-2xl border border-border-subtle p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingBlock(null)
                    setFormData({
                      ...initialFormData,
                      date: selectedDate.toISOString().split('T')[0]
                    })
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Block
                  </Button>
                </DialogTrigger>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingBlock ? 'Edit Time Block' : 'Create Time Block'}
                    </DialogTitle>
                    <DialogDescription>
                      Schedule a time block for focused work or activities
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_time">Start Time</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="What are you working on?"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Additional details..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-20 h-10"
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingBlock ? 'Update' : 'Create'} Time Block
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-3">
              {getTimeBlocksForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-foreground-muted">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No time blocks scheduled for this day</p>
                </div>
              ) : (
                getTimeBlocksForDate(selectedDate)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((block) => (
                    <div
                      key={block.id}
                      className={`
                        flex items-center justify-between p-4 rounded-lg border transition-all
                        ${block.completed ? 'bg-green-50 border-green-200' : 'bg-background border-border-subtle'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: block.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{block.title}</span>
                            <Badge variant={block.completed ? "default" : "secondary"}>
                              {block.completed ? 'Completed' : 'Scheduled'}
                            </Badge>
                          </div>
                          <div className="text-sm text-foreground-muted">
                            {block.start_time} - {block.end_time}
                          </div>
                          {block.description && (
                            <div className="text-sm text-foreground-muted mt-1">
                              {block.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCompleted(block.id, block.completed)}
                        >
                          {block.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(block)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(block.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}