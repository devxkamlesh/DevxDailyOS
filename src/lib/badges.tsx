'use client'

import {
  Sparkles, Rocket, Flame, Trophy, Zap, Video, Code, Youtube,
  Briefcase, Palette, Laptop, BookOpen, Crown, CheckCircle2, Award,
  Star, Shield, Heart, Target, Medal
} from 'lucide-react'

// Badge icon mapping
export const badgeIcons: Record<string, any> = {
  sparkles: Sparkles,
  rocket: Rocket,
  flame: Flame,
  trophy: Trophy,
  zap: Zap,
  video: Video,
  code: Code,
  youtube: Youtube,
  briefcase: Briefcase,
  palette: Palette,
  laptop: Laptop,
  book: BookOpen,
  crown: Crown,
  'check-circle': CheckCircle2,
  award: Award,
  star: Star,
  shield: Shield,
  heart: Heart,
  target: Target,
  medal: Medal,
}

// Badge color mapping
export const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/50' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500/50' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/50' },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/50' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/50' },
  red: { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/50' },
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-500', border: 'border-cyan-500/50' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-500', border: 'border-amber-500/50' },
  pink: { bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500/50' },
  indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-500', border: 'border-indigo-500/50' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500/50' },
  gold: { bg: 'bg-yellow-500/30', text: 'text-yellow-400', border: 'border-yellow-400/50' },
}

export interface Badge {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  badge_type: 'achievement' | 'purchasable' | 'special' | 'auto'
  price_inr: number
  is_active?: boolean
  display_order?: number
  criteria?: Record<string, any>
}

export interface UserBadge {
  id: string
  badge_id: string
  is_primary: boolean
  acquired_at: string
  expires_at: string | null
  badge: Badge
}

// Badge component
export function BadgeDisplay({ 
  badge, 
  size = 'md',
  showName = true 
}: { 
  badge: Badge | { name: string; icon: string; color: string } | null
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}) {
  if (!badge) return null

  const Icon = badgeIcons[badge.icon] || Award
  const colors = badgeColors[badge.color] || badgeColors.blue
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  }
  
  const iconSizes = { sm: 12, md: 14, lg: 18 }

  return (
    <span className={`inline-flex items-center rounded-full border ${colors.bg} ${colors.border} ${sizeClasses[size]}`}>
      <Icon size={iconSizes[size]} className={colors.text} />
      {showName && <span className={colors.text}>{badge.name}</span>}
    </span>
  )
}

// Multiple badges display
export function BadgeList({ 
  badges, 
  max = 3,
  size = 'sm' 
}: { 
  badges: UserBadge[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const visibleBadges = badges.slice(0, max)
  const remaining = badges.length - max

  return (
    <div className="flex flex-wrap gap-1">
      {visibleBadges.map(ub => (
        <BadgeDisplay key={ub.id} badge={ub.badge} size={size} />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-foreground-muted">+{remaining}</span>
      )}
    </div>
  )
}
