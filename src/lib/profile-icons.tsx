'use client'

import {
  User, Heart, Star, Zap, Trophy, Target, Flame, Shield,
  Diamond, Gem, Crown, Rocket, Coffee, Music, Gamepad2,
  Headphones, Laptop, Smartphone, Watch, Car, Plane, Home,
  Gift, Briefcase, Book, Lightbulb, Smile, Sun, Moon,
  Bot, Battery, Wand2, Ghost, Swords, Medal, Skull, Cat, Dog, Bird
} from 'lucide-react'

// Map of icon IDs to Lucide components
export const iconMap: Record<string, any> = {
  user: User,
  smile: Smile,
  heart: Heart,
  star: Star,
  sun: Sun,
  moon: Moon,
  zap: Zap,
  trophy: Trophy,
  target: Target,
  flame: Flame,
  shield: Shield,
  diamond: Diamond,
  gem: Gem,
  crown: Crown,
  rocket: Rocket,
  coffee: Coffee,
  music: Music,
  gamepad: Gamepad2,
  bot: Bot,
  battery: Battery,
  wand: Wand2,
  ghost: Ghost,
  headphones: Headphones,
  laptop: Laptop,
  smartphone: Smartphone,
  watch: Watch,
  car: Car,
  plane: Plane,
  home: Home,
  briefcase: Briefcase,
  book: Book,
  lightbulb: Lightbulb,
  swords: Swords,
  medal: Medal,
  skull: Skull,
  cat: Cat,
  dog: Dog,
  bird: Bird,
  gift: Gift,
  default: User,
}

// Get icon component by ID
export function getIconComponent(iconId: string | null | undefined) {
  if (!iconId) return User
  return iconMap[iconId] || User
}

// Render profile icon
export function ProfileIcon({ 
  iconId, 
  size = 24, 
  className = '' 
}: { 
  iconId: string | null | undefined
  size?: number
  className?: string 
}) {
  const Icon = getIconComponent(iconId)
  return <Icon size={size} className={className} />
}

// All available icons for selection
export const allIcons = [
  // Free
  { id: 'user', name: 'User', free: true },
  { id: 'smile', name: 'Smile', free: true },
  { id: 'heart', name: 'Heart', free: true },
  { id: 'star', name: 'Star', free: true },
  { id: 'sun', name: 'Sun', free: true },
  { id: 'moon', name: 'Moon', free: true },
  // Premium
  { id: 'zap', name: 'Lightning', free: false },
  { id: 'trophy', name: 'Trophy', free: false },
  { id: 'target', name: 'Target', free: false },
  { id: 'flame', name: 'Fire', free: false },
  { id: 'shield', name: 'Shield', free: false },
  { id: 'diamond', name: 'Diamond', free: false },
  { id: 'gem', name: 'Gem', free: false },
  { id: 'crown', name: 'Crown', free: false },
  { id: 'rocket', name: 'Rocket', free: false },
  { id: 'coffee', name: 'Coffee', free: false },
  { id: 'music', name: 'Music', free: false },
  { id: 'gamepad', name: 'Gaming', free: false },
  { id: 'bot', name: 'Robot', free: false },
  { id: 'battery', name: 'Battery', free: false },
  { id: 'wand', name: 'Wizard', free: false },
  { id: 'ghost', name: 'Ghost', free: false },
  // Exclusive
  { id: 'headphones', name: 'Headphones', free: false },
  { id: 'laptop', name: 'Laptop', free: false },
  { id: 'smartphone', name: 'Phone', free: false },
  { id: 'watch', name: 'Watch', free: false },
  { id: 'car', name: 'Car', free: false },
  { id: 'plane', name: 'Plane', free: false },
  { id: 'home', name: 'Home', free: false },
  { id: 'briefcase', name: 'Business', free: false },
  { id: 'book', name: 'Book', free: false },
  { id: 'lightbulb', name: 'Idea', free: false },
  { id: 'swords', name: 'Warrior', free: false },
  { id: 'medal', name: 'Medal', free: false },
  { id: 'skull', name: 'Skull', free: false },
  { id: 'cat', name: 'Cat', free: false },
  { id: 'dog', name: 'Dog', free: false },
  { id: 'bird', name: 'Bird', free: false },
]

export const freeIcons = allIcons.filter(i => i.free)
