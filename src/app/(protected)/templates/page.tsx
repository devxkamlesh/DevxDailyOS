'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Target, Briefcase, Instagram, DollarSign, 
  Plus, Check, Sunrise, Moon, Heart, Dumbbell,
  Code, Palette, Megaphone, FileText, Zap
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  type: 'habit' | 'project' | 'instagram' | 'freelance'
  icon: any
  color: string
  items: any[]
}

const habitTemplates: Template[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Start your day right with these essential habits',
    type: 'habit',
    icon: Sunrise,
    color: 'orange',
    items: [
      { name: 'Wake up at 6 AM', category: 'morning', type: 'boolean' },
      { name: 'Drink water', category: 'health', type: 'numeric', target_value: 500, target_unit: 'ml' },
      { name: 'Morning meditation', category: 'morning', type: 'numeric', target_value: 10, target_unit: 'min' },
      { name: 'Exercise', category: 'health', type: 'numeric', target_value: 30, target_unit: 'min' },
      { name: 'Healthy breakfast', category: 'health', type: 'boolean' },
      { name: 'Review daily goals', category: 'focus', type: 'boolean' }
    ]
  },
  {
    id: 'fitness-journey',
    name: 'Fitness Journey',
    description: 'Complete workout and nutrition tracking',
    type: 'habit',
    icon: Dumbbell,
    color: 'red',
    items: [
      { name: 'Morning workout', category: 'health', type: 'numeric', target_value: 45, target_unit: 'min' },
      { name: 'Drink 8 glasses of water', category: 'health', type: 'numeric', target_value: 8, target_unit: 'glasses' },
      { name: 'Track calories', category: 'health', type: 'boolean' },
      { name: 'Protein intake', category: 'health', type: 'numeric', target_value: 150, target_unit: 'g' },
      { name: 'Evening stretch', category: 'night', type: 'numeric', target_value: 15, target_unit: 'min' },
      { name: 'Sleep 8 hours', category: 'night', type: 'boolean' }
    ]
  },
  {
    id: 'productivity-master',
    name: 'Productivity Master',
    description: 'Maximize your daily output and focus',
    type: 'habit',
    icon: Zap,
    color: 'yellow',
    items: [
      { name: 'Plan the day', category: 'morning', type: 'boolean' },
      { name: 'Deep work session', category: 'work', type: 'numeric', target_value: 90, target_unit: 'min' },
      { name: 'No social media before noon', category: 'focus', type: 'boolean' },
      { name: 'Pomodoro sessions', category: 'work', type: 'numeric', target_value: 4, target_unit: 'sessions' },
      { name: 'Review accomplishments', category: 'night', type: 'boolean' },
      { name: 'Prepare tomorrow', category: 'night', type: 'boolean' }
    ]
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness & Wellness',
    description: 'Mental health and self-care routine',
    type: 'habit',
    icon: Heart,
    color: 'pink',
    items: [
      { name: 'Morning gratitude', category: 'morning', type: 'boolean' },
      { name: 'Meditation', category: 'focus', type: 'numeric', target_value: 20, target_unit: 'min' },
      { name: 'Journaling', category: 'focus', type: 'numeric', target_value: 10, target_unit: 'min' },
      { name: 'Read for pleasure', category: 'night', type: 'numeric', target_value: 30, target_unit: 'min' },
      { name: 'Digital detox hour', category: 'night', type: 'boolean' },
      { name: 'Evening reflection', category: 'night', type: 'boolean' }
    ]
  },
  {
    id: 'night-routine',
    name: 'Night Routine',
    description: 'Wind down and prepare for quality sleep',
    type: 'habit',
    icon: Moon,
    color: 'indigo',
    items: [
      { name: 'No screens 1 hour before bed', category: 'night', type: 'boolean' },
      { name: 'Evening skincare', category: 'night', type: 'boolean' },
      { name: 'Read before bed', category: 'night', type: 'numeric', target_value: 20, target_unit: 'min' },
      { name: 'Prepare clothes for tomorrow', category: 'night', type: 'boolean' },
      { name: 'Set 3 priorities for tomorrow', category: 'night', type: 'boolean' },
      { name: 'In bed by 10 PM', category: 'night', type: 'boolean' }
    ]
  }
]

const projectTemplates: Template[] = [
  {
    id: 'web-app',
    name: 'Web Application',
    description: 'Full-stack web app development workflow',
    type: 'project',
    icon: Code,
    color: 'blue',
    items: [
      { name: 'Project setup & initialization', status: 'idea' },
      { name: 'Database schema design', status: 'idea' },
      { name: 'API endpoints development', status: 'idea' },
      { name: 'Frontend UI components', status: 'idea' },
      { name: 'Authentication system', status: 'idea' },
      { name: 'Testing & QA', status: 'idea' },
      { name: 'Deployment & CI/CD', status: 'idea' },
      { name: 'Documentation', status: 'idea' }
    ]
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: 'React Native or Flutter app template',
    type: 'project',
    icon: Briefcase,
    color: 'purple',
    items: [
      { name: 'App architecture planning', status: 'idea' },
      { name: 'UI/UX design mockups', status: 'idea' },
      { name: 'Core features development', status: 'idea' },
      { name: 'API integration', status: 'idea' },
      { name: 'Push notifications setup', status: 'idea' },
      { name: 'App store optimization', status: 'idea' },
      { name: 'Beta testing', status: 'idea' },
      { name: 'Launch & marketing', status: 'idea' }
    ]
  },
  {
    id: 'saas-product',
    name: 'SaaS Product',
    description: 'Complete SaaS product launch checklist',
    type: 'project',
    icon: Zap,
    color: 'green',
    items: [
      { name: 'Market research & validation', status: 'idea' },
      { name: 'MVP feature list', status: 'idea' },
      { name: 'Landing page & branding', status: 'idea' },
      { name: 'Core product development', status: 'idea' },
      { name: 'Payment integration', status: 'idea' },
      { name: 'User onboarding flow', status: 'idea' },
      { name: 'Analytics & tracking', status: 'idea' },
      { name: 'Customer support setup', status: 'idea' },
      { name: 'Marketing campaign', status: 'idea' }
    ]
  }
]

const instagramTemplates: Template[] = [
  {
    id: 'content-creator',
    name: 'Content Creator Pack',
    description: '30-day content calendar for creators',
    type: 'instagram',
    icon: Instagram,
    color: 'pink',
    items: [
      { title: 'Introduction post', format: 'post', status: 'idea' },
      { title: 'Behind the scenes', format: 'reel', status: 'idea' },
      { title: 'Tutorial/How-to', format: 'reel', status: 'idea' },
      { title: 'Day in the life', format: 'story', status: 'idea' },
      { title: 'Tips & tricks', format: 'post', status: 'idea' },
      { title: 'Q&A session', format: 'story', status: 'idea' },
      { title: 'Transformation/Before-After', format: 'post', status: 'idea' },
      { title: 'Collaboration post', format: 'reel', status: 'idea' }
    ]
  },
  {
    id: 'business-brand',
    name: 'Business Brand',
    description: 'Professional business content strategy',
    type: 'instagram',
    icon: Briefcase,
    color: 'blue',
    items: [
      { title: 'Company introduction', format: 'post', status: 'idea' },
      { title: 'Product showcase', format: 'reel', status: 'idea' },
      { title: 'Customer testimonial', format: 'post', status: 'idea' },
      { title: 'Team spotlight', format: 'story', status: 'idea' },
      { title: 'Industry insights', format: 'post', status: 'idea' },
      { title: 'Special offer announcement', format: 'reel', status: 'idea' },
      { title: 'FAQ answers', format: 'story', status: 'idea' }
    ]
  },
  {
    id: 'influencer',
    name: 'Influencer Growth',
    description: 'Viral content ideas for growth',
    type: 'instagram',
    icon: Megaphone,
    color: 'orange',
    items: [
      { title: 'Trending audio reel', format: 'reel', status: 'idea' },
      { title: 'Controversial opinion', format: 'post', status: 'idea' },
      { title: 'Life hack/tip', format: 'reel', status: 'idea' },
      { title: 'Relatable meme', format: 'post', status: 'idea' },
      { title: 'Challenge participation', format: 'reel', status: 'idea' },
      { title: 'Poll/engagement story', format: 'story', status: 'idea' },
      { title: 'Giveaway announcement', format: 'post', status: 'idea' }
    ]
  }
]

const freelanceTemplates: Template[] = [
  {
    id: 'proposal-template',
    name: 'Project Proposal',
    description: 'Professional freelance proposal structure',
    type: 'freelance',
    icon: FileText,
    color: 'green',
    items: [
      { name: 'Client research', stage: 'lead' },
      { name: 'Initial consultation call', stage: 'in_talk' },
      { name: 'Scope definition', stage: 'in_talk' },
      { name: 'Proposal draft', stage: 'proposal' },
      { name: 'Pricing & timeline', stage: 'proposal' },
      { name: 'Contract negotiation', stage: 'proposal' },
      { name: 'Project kickoff', stage: 'active' },
      { name: 'Final delivery', stage: 'done' }
    ]
  },
  {
    id: 'client-onboarding',
    name: 'Client Onboarding',
    description: 'Smooth client onboarding process',
    type: 'freelance',
    icon: DollarSign,
    color: 'emerald',
    items: [
      { name: 'Welcome email', stage: 'active' },
      { name: 'Contract signing', stage: 'active' },
      { name: 'Initial payment', stage: 'active' },
      { name: 'Project brief review', stage: 'active' },
      { name: 'Communication setup', stage: 'active' },
      { name: 'Timeline confirmation', stage: 'active' },
      { name: 'First milestone delivery', stage: 'active' }
    ]
  }
]

export default function TemplatesPage() {
  const [selectedType, setSelectedType] = useState<'all' | 'habit' | 'project' | 'instagram' | 'freelance'>('all')
  const [applying, setApplying] = useState<string | null>(null)
  const supabase = createClient()

  const allTemplates = [...habitTemplates, ...projectTemplates, ...instagramTemplates, ...freelanceTemplates]
  const filteredTemplates = selectedType === 'all' 
    ? allTemplates 
    : allTemplates.filter(t => t.type === selectedType)

  const applyTemplate = async (template: Template) => {
    setApplying(template.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please log in to apply templates')
      setApplying(null)
      return
    }

    try {
      if (template.type === 'habit') {
        // Insert habits
        const habits = template.items.map(item => ({
          user_id: user.id,
          name: item.name,
          category: item.category,
          type: item.type,
          target_value: item.target_value || null,
          target_unit: item.target_unit || null,
          is_active: true,
          emoji: item.category
        }))
        
        const { error } = await supabase.from('habits').insert(habits)
        if (error) throw error
        
      } else if (template.type === 'project') {
        // Create project with tasks
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: template.name,
            description: template.description,
            status: 'idea'
          })
          .select()
          .single()
        
        if (projectError) throw projectError
        
        if (project) {
          const tasks = template.items.map(item => ({
            user_id: user.id,
            project_id: project.id,
            title: item.name,
            status: 'pending',
            priority: 'medium'
          }))
          
          const { error: tasksError } = await supabase.from('tasks').insert(tasks)
          if (tasksError) throw tasksError
        }
        
      } else if (template.type === 'instagram') {
        // Insert instagram posts
        const posts = template.items.map(item => ({
          user_id: user.id,
          title: item.title,
          format: item.format,
          status: item.status
        }))
        
        const { error } = await supabase.from('instagram_posts').insert(posts)
        if (error) throw error
        
      } else if (template.type === 'freelance') {
        // Insert freelance client template
        const { error } = await supabase.from('freelance_clients').insert({
          user_id: user.id,
          name: `${template.name} - New Client`,
          platform: 'other',
          stage: 'lead',
          notes: template.description
        })
        if (error) throw error
      }

      alert(`✅ ${template.name} template applied successfully!`)
    } catch (error: any) {
      console.error('Error applying template:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setApplying(null)
    }
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
      red: 'from-red-500/10 to-red-500/5 border-red-500/20',
      yellow: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20',
      pink: 'from-pink-500/10 to-pink-500/5 border-pink-500/20',
      indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20',
      blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
      purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
      green: 'from-green-500/10 to-green-500/5 border-green-500/20',
      emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Templates & Presets</h1>
        <p className="text-foreground-muted">Quick start with pre-built templates</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg transition ${
            selectedType === 'all'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          All Templates
        </button>
        <button
          onClick={() => setSelectedType('habit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            selectedType === 'habit'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          <Target size={16} />
          Habits
        </button>
        <button
          onClick={() => setSelectedType('project')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            selectedType === 'project'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          <Briefcase size={16} />
          Projects
        </button>
        <button
          onClick={() => setSelectedType('instagram')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            selectedType === 'instagram'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          <Instagram size={16} />
          Instagram
        </button>
        <button
          onClick={() => setSelectedType('freelance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            selectedType === 'freelance'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          <DollarSign size={16} />
          Freelance
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => {
          const Icon = template.icon
          return (
            <div
              key={template.id}
              className={`bg-gradient-to-br ${getColorClasses(template.color)} rounded-2xl p-6 border`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-${template.color}-500/20 rounded-xl`}>
                  <Icon size={28} className={`text-${template.color}-500`} />
                </div>
                <span className="px-3 py-1 bg-surface rounded-full text-xs font-medium capitalize">
                  {template.type}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2">{template.name}</h3>
              <p className="text-sm text-foreground-muted mb-4">{template.description}</p>

              <div className="mb-4">
                <div className="text-xs font-medium text-foreground-muted mb-2">
                  Includes {template.items.length} items:
                </div>
                <div className="space-y-1 max-h-48 overflow-hidden">
                  {template.items.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-accent-success flex-shrink-0" />
                      <span className="truncate">
                        {item.name || item.title}
                      </span>
                    </div>
                  ))}
                  {template.items.length > 6 && (
                    <div className="text-xs text-foreground-muted pl-6">
                      +{template.items.length - 6} more items
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => applyTemplate(template)}
                disabled={applying === template.id}
                className="w-full py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {applying === template.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Apply Template
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-foreground-muted">
          <Palette size={48} className="mx-auto mb-4 opacity-50" />
          <p>No templates found for this category</p>
        </div>
      )}
    </div>
  )
}
