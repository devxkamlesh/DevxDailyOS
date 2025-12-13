'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Clock, Target, Briefcase, 
  Camera, DollarSign, MoreVertical, 
  Coffee, Zap, CheckCircle2
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface TimeBlock {
  id: string
  title: string
  type: 'habit' | 'task' | 'instagram' | 'freelance' | 'break' | 'focus'
  startTime: string
  endTime: string
  duration: number // in minutes
  completed: boolean
  color: string
  description?: string
  pomodoroCount?: number
  priority: 'low' | 'medium' | 'high'
}



const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})

const typeConfig = {
  habit: { icon: Target, color: 'bg-purple-500', lightColor: 'bg-purple-500/20', textColor: 'text-purple-400' },
  task: { icon: Briefcase, color: 'bg-blue-500', lightColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  instagram: { icon: Camera, color: 'bg-pink-500', lightColor: 'bg-pink-500/20', textColor: 'text-pink-400' },
  freelance: { icon: DollarSign, color: 'bg-green-500', lightColor: 'bg-green-500/20', textColor: 'text-green-400' },
  break: { icon: Coffee, color: 'bg-orange-500', lightColor: 'bg-orange-500/20', textColor: 'text-orange-400' },
  focus: { icon: Zap, color: 'bg-yellow-500', lightColor: 'bg-yellow-500/20', textColor: 'text-yellow-400' }
}

export default function TimelineView({ selectedDate }: { selectedDate: Date }) {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTimeBlocks()
  }, [selectedDate])



  const fetchTimeBlocks = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dateStr = selectedDate.toISOString().split('T')[0]

    // Fetch existing time blocks for the day
    const { data: blocks } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .order('start_time')

    if (blocks) {
      setTimeBlocks(blocks.map(block => ({
        id: block.id,
        title: block.title,
        type: block.type,
        startTime: block.start_time,
        endTime: block.end_time,
        duration: block.duration,
        completed: block.completed,
        color: typeConfig[block.type as keyof typeof typeConfig].color,
        description: block.description,
        pomodoroCount: block.pomodoro_count,
        priority: block.priority
      })))
    }

    setLoading(false)
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination } = result
    const draggedBlockId = result.draggableId

    // Find the dragged block
    const block = timeBlocks.find(b => b.id === draggedBlockId)
    if (!block) return

    // Calculate new time based on destination
    const newStartHour = Math.floor(destination.index / 4) // 15-minute slots
    const newStartMinute = (destination.index % 4) * 15
    const newStartTime = `${newStartHour.toString().padStart(2, '0')}:${newStartMinute.toString().padStart(2, '0')}`
    
    // Calculate end time
    const endMinutes = newStartMinute + block.duration
    const endHour = newStartHour + Math.floor(endMinutes / 60)
    const finalEndMinute = endMinutes % 60
    const newEndTime = `${endHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`

    // Update the block
    const updatedBlock = {
      ...block,
      startTime: newStartTime,
      endTime: newEndTime
    }

    // Update in database
    const { error } = await supabase
      .from('time_blocks')
      .update({
        start_time: newStartTime,
        end_time: newEndTime
      })
      .eq('id', block.id)

    if (!error) {
      setTimeBlocks(prev => 
        prev.map(b => b.id === block.id ? updatedBlock : b)
      )
    }
  }



  const getTimeSlotBlocks = (timeSlot: string) => {
    return timeBlocks.filter(block => {
      const blockStart = block.startTime
      const slotHour = parseInt(timeSlot.split(':')[0])
      const blockHour = parseInt(blockStart.split(':')[0])
      return blockHour === slotHour
    })
  }

  const toggleBlockComplete = async (blockId: string) => {
    const block = timeBlocks.find(b => b.id === blockId)
    if (!block) return

    const { error } = await supabase
      .from('time_blocks')
      .update({ completed: !block.completed })
      .eq('id', blockId)

    if (!error) {
      setTimeBlocks(prev =>
        prev.map(b => b.id === blockId ? { ...b, completed: !b.completed } : b)
      )
    }
  }

  return (
    <div className="space-y-6">

      {/* Timeline */}
      <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center justify-center">
            <h2 className="text-xl font-bold">Daily Timeline</h2>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-16 h-16 bg-background rounded animate-pulse" />
                    <div className="flex-1 h-16 bg-background rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {timeSlots.map((timeSlot, index) => {
                  const slotBlocks = getTimeSlotBlocks(timeSlot)
                  
                  return (
                    <Droppable key={timeSlot} droppableId={`slot-${index}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex gap-4 p-3 rounded-lg transition-all ${
                            snapshot.isDraggingOver ? 'bg-accent-primary/10 border-2 border-accent-primary/30' : 'hover:bg-background/50'
                          }`}
                        >
                          {/* Time Label */}
                          <div className="w-16 flex-shrink-0">
                            <div className="text-sm font-medium text-foreground-muted">
                              {timeSlot}
                            </div>
                          </div>

                          {/* Time Blocks */}
                          <div className="flex-1 min-h-[60px] relative">
                            {slotBlocks.length === 0 ? (
                              <div className="w-full h-full border-2 border-dashed border-border-subtle/30 rounded-lg" />
                            ) : (
                              <div className="space-y-2">
                                {slotBlocks.map((block, blockIndex) => {
                                  const Icon = typeConfig[block.type].icon
                                  
                                  return (
                                    <Draggable
                                      key={block.id}
                                      draggableId={block.id}
                                      index={blockIndex}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`p-4 rounded-lg border-2 transition-all cursor-move ${
                                            snapshot.isDragging 
                                              ? 'shadow-lg scale-105 rotate-2' 
                                              : 'hover:shadow-md'
                                          } ${
                                            block.completed 
                                              ? 'bg-green-100 border-green-300' 
                                              : `${typeConfig[block.type].lightColor} border-transparent`
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <div className={`p-2 rounded-lg ${typeConfig[block.type].color}`}>
                                                <Icon className="text-white" size={16} />
                                              </div>
                                              <div>
                                                <h4 className={`font-semibold ${typeConfig[block.type].textColor}`}>
                                                  {block.title}
                                                </h4>
                                                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                                                  <Clock size={12} />
                                                  <span>{block.startTime} - {block.endTime}</span>
                                                  <span>({block.duration}min)</span>
                                                  {block.pomodoroCount && block.pomodoroCount > 0 && (
                                                    <span>🍅 {block.pomodoroCount}</span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => toggleBlockComplete(block.id)}
                                                className={`p-2 rounded-lg transition ${
                                                  block.completed 
                                                    ? 'text-green-600 hover:bg-green-100' 
                                                    : 'text-foreground-muted hover:bg-background'
                                                }`}
                                                title={block.completed ? 'Mark incomplete' : 'Mark complete'}
                                              >
                                                <CheckCircle2 size={16} />
                                              </button>
                                              <button className="p-2 hover:bg-background rounded-lg transition">
                                                <MoreVertical size={16} />
                                              </button>
                                            </div>
                                          </div>

                                          {block.description && (
                                            <p className="text-sm text-foreground-muted mt-2">
                                              {block.description}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )
                })}
              </div>
            )}
          </div>
        </DragDropContext>
      </div>

    </div>
  )
}