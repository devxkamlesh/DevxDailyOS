'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Lightbulb, Camera } from 'lucide-react'

interface QuickAddIdeaProps {
  onAdd: () => void
}

export default function QuickAddIdea({ onAdd }: QuickAddIdeaProps) {
  const [projectIdea, setProjectIdea] = useState('')
  const [igHook, setIgHook] = useState('')
  const [loadingProject, setLoadingProject] = useState(false)
  const [loadingIg, setLoadingIg] = useState(false)
  const supabase = createClient()

  const addProjectIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectIdea.trim()) return
    setLoadingProject(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('projects').insert({
        user_id: user.id,
        name: projectIdea.trim(),
        status: 'idea'
      })
      setProjectIdea('')
      onAdd()
    } catch (error) {
      console.error('Error adding project:', error)
    } finally {
      setLoadingProject(false)
    }
  }

  const addIgHook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!igHook.trim()) return
    setLoadingIg(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('instagram_posts').insert({
        user_id: user.id,
        hook: igHook.trim(),
        status: 'idea',
        format: 'reel'
      })
      setIgHook('')
      onAdd()
    } catch (error) {
      console.error('Error adding IG hook:', error)
    } finally {
      setLoadingIg(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <form onSubmit={addProjectIdea} className="flex gap-2">
        <div className="flex-1 relative">
          <Lightbulb size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={projectIdea}
            onChange={(e) => setProjectIdea(e.target.value)}
            placeholder="Add project idea..."
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary text-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={loadingProject || !projectIdea.trim()}
          className="px-4 py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          <Plus size={20} />
        </button>
      </form>

      <form onSubmit={addIgHook} className="flex gap-2">
        <div className="flex-1 relative">
          <Camera size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={igHook}
            onChange={(e) => setIgHook(e.target.value)}
            placeholder="Add IG hook..."
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary text-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={loadingIg || !igHook.trim()}
          className="px-4 py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          <Plus size={20} />
        </button>
      </form>
    </div>
  )
}
