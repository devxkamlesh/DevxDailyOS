'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lightbulb, Instagram, Zap } from 'lucide-react'

export default function QuickAddSection() {
  const [projectIdea, setProjectIdea] = useState('')
  const [igHook, setIgHook] = useState('')
  const [loadingProject, setLoadingProject] = useState(false)
  const [loadingIg, setLoadingIg] = useState(false)

  const addProjectIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectIdea.trim()) return
    setLoadingProject(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('projects').insert({
        user_id: user.id,
        name: projectIdea.trim(),
        status: 'idea'
      })
      setProjectIdea('')
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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('instagram_posts').insert({
        user_id: user.id,
        hook: igHook.trim(),
        status: 'idea',
        format: 'reel'
      })
      setIgHook('')
    } catch (error) {
      console.error('Error adding IG hook:', error)
    } finally {
      setLoadingIg(false)
    }
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={20} className="text-yellow-400" />
        <h2 className="text-lg font-semibold">Quick Capture</h2>
      </div>
      
      <div className="space-y-3">
        <form onSubmit={addProjectIdea}>
          <div className="relative">
            <Lightbulb size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400" />
            <input
              type="text"
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              placeholder="Project idea..."
              disabled={loadingProject}
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addProjectIdea(e)
                }
              }}
            />
          </div>
        </form>

        <form onSubmit={addIgHook}>
          <div className="relative">
            <Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              value={igHook}
              onChange={(e) => setIgHook(e.target.value)}
              placeholder="Content hook..."
              disabled={loadingIg}
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addIgHook(e)
                }
              }}
            />
          </div>
        </form>

        <p className="text-xs text-foreground-muted text-center pt-2">
          Press Enter to save
        </p>
      </div>
    </div>
  )
}
