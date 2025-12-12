'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Coins, ShoppingCart, Crown, Check, Lock, X, 
  User, Heart, Star, Zap, Trophy, Target, Flame, Shield,
  Diamond, Gem, Palette, Music, Gamepad2, Coffee,
  Rocket, Headphones, Laptop, Smartphone, Watch, Car,
  Plane, Home, Gift, Briefcase, Book, Lightbulb,
  Smile, Sun, Moon, Bot, Battery, Wand2,
  Ghost, Swords, Medal, Skull, Cat, Dog, Bird
} from 'lucide-react'
import { useTheme, ThemeId } from '@/components/ThemeProvider'

interface UserRewards {
  coins: number
  gems: number
  current_theme: string
  current_avatar: string
  unlocked_themes: string[]
  unlocked_avatars: string[]
}

interface Theme {
  id: string
  name: string
  price: number
  gradient: string
}

interface ProfileIcon {
  id: string
  name: string
  icon: any
  price: number
  free: boolean
  category: 'basic' | 'premium' | 'exclusive'
}

interface CoinPackage {
  id: string
  name: string
  coins: number
  bonus: number
  price: number
  popular: boolean
}

interface PopupState {
  show: boolean
  type: 'success' | 'error' | 'info'
  title: string
  message: string
}

export default function ShopPage() {
  const [rewards, setRewards] = useState<UserRewards>({
    coins: 0, gems: 0, current_theme: 'default', current_avatar: 'user',
    unlocked_themes: ['default'], unlocked_avatars: ['user']
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'themes' | 'icons' | 'coins'>('icons')
  const [popup, setPopup] = useState<PopupState>({ show: false, type: 'info', title: '', message: '' })
  const [showConfetti, setShowConfetti] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const { setTheme } = useTheme()


  // Themes - 3x more coins
  const themes: Theme[] = [
    { id: 'default', name: 'Default', price: 0, gradient: 'from-zinc-800 to-zinc-900' },
    { id: 'ocean', name: 'Ocean Blue', price: 300, gradient: 'from-blue-600 to-cyan-600' },
    { id: 'sunset', name: 'Sunset', price: 450, gradient: 'from-orange-500 to-pink-500' },
    { id: 'forest', name: 'Forest', price: 360, gradient: 'from-green-600 to-emerald-600' },
    { id: 'purple', name: 'Royal Purple', price: 600, gradient: 'from-purple-600 to-indigo-600' },
    { id: 'gold', name: 'Golden', price: 900, gradient: 'from-yellow-500 to-orange-400' },
    { id: 'rose', name: 'Rose Gold', price: 750, gradient: 'from-pink-500 to-rose-400' },
    { id: 'midnight', name: 'Midnight', price: 540, gradient: 'from-slate-900 to-blue-900' },
  ]

  // Profile Icons with Lucide React icons - LARGER AND CLEARER
  const profileIcons: ProfileIcon[] = [
    // Free Basic Icons (user icon removed - it's default for everyone)
    { id: 'smile', name: 'Smile', icon: Smile, price: 0, free: true, category: 'basic' },
    { id: 'heart', name: 'Heart', icon: Heart, price: 0, free: true, category: 'basic' },
    { id: 'star', name: 'Star', icon: Star, price: 0, free: true, category: 'basic' },
    { id: 'sun', name: 'Sun', icon: Sun, price: 0, free: true, category: 'basic' },
    { id: 'moon', name: 'Moon', icon: Moon, price: 0, free: true, category: 'basic' },
    
    // Premium Icons
    { id: 'zap', name: 'Lightning', icon: Zap, price: 50, free: false, category: 'premium' },
    { id: 'trophy', name: 'Trophy', icon: Trophy, price: 75, free: false, category: 'premium' },
    { id: 'target', name: 'Target', icon: Target, price: 60, free: false, category: 'premium' },
    { id: 'flame', name: 'Fire', icon: Flame, price: 80, free: false, category: 'premium' },
    { id: 'shield', name: 'Shield', icon: Shield, price: 90, free: false, category: 'premium' },
    { id: 'diamond', name: 'Diamond', icon: Diamond, price: 120, free: false, category: 'premium' },
    { id: 'gem', name: 'Gem', icon: Gem, price: 100, free: false, category: 'premium' },
    { id: 'crown', name: 'Crown', icon: Crown, price: 150, free: false, category: 'premium' },
    { id: 'rocket', name: 'Rocket', icon: Rocket, price: 110, free: false, category: 'premium' },
    { id: 'coffee', name: 'Coffee', icon: Coffee, price: 70, free: false, category: 'premium' },
    { id: 'music', name: 'Music', icon: Music, price: 85, free: false, category: 'premium' },
    { id: 'gamepad', name: 'Gaming', icon: Gamepad2, price: 95, free: false, category: 'premium' },
    { id: 'bot', name: 'Robot', icon: Bot, price: 100, free: false, category: 'premium' },
    { id: 'battery', name: 'Battery', icon: Battery, price: 80, free: false, category: 'premium' },
    { id: 'wand', name: 'Wizard', icon: Wand2, price: 90, free: false, category: 'premium' },
    { id: 'ghost', name: 'Ghost', icon: Ghost, price: 85, free: false, category: 'premium' },
    
    // Exclusive Icons
    { id: 'headphones', name: 'Headphones', icon: Headphones, price: 200, free: false, category: 'exclusive' },
    { id: 'laptop', name: 'Laptop', icon: Laptop, price: 180, free: false, category: 'exclusive' },
    { id: 'smartphone', name: 'Phone', icon: Smartphone, price: 160, free: false, category: 'exclusive' },
    { id: 'watch', name: 'Watch', icon: Watch, price: 220, free: false, category: 'exclusive' },
    { id: 'car', name: 'Car', icon: Car, price: 250, free: false, category: 'exclusive' },
    { id: 'plane', name: 'Plane', icon: Plane, price: 300, free: false, category: 'exclusive' },
    { id: 'home', name: 'Home', icon: Home, price: 190, free: false, category: 'exclusive' },
    { id: 'briefcase', name: 'Business', icon: Briefcase, price: 210, free: false, category: 'exclusive' },
    { id: 'book', name: 'Book', icon: Book, price: 170, free: false, category: 'exclusive' },
    { id: 'lightbulb', name: 'Idea', icon: Lightbulb, price: 240, free: false, category: 'exclusive' },
    { id: 'swords', name: 'Warrior', icon: Swords, price: 280, free: false, category: 'exclusive' },
    { id: 'medal', name: 'Medal', icon: Medal, price: 260, free: false, category: 'exclusive' },
    { id: 'skull', name: 'Skull', icon: Skull, price: 300, free: false, category: 'exclusive' },
    { id: 'cat', name: 'Cat', icon: Cat, price: 200, free: false, category: 'exclusive' },
    { id: 'dog', name: 'Dog', icon: Dog, price: 200, free: false, category: 'exclusive' },
    { id: 'bird', name: 'Bird', icon: Bird, price: 180, free: false, category: 'exclusive' },
  ]

  // Coin Packages
  const coinPackages: CoinPackage[] = [
    { id: 'starter', name: 'Starter Pack', coins: 100, bonus: 0, price: 49, popular: false },
    { id: 'popular', name: 'Popular Pack', coins: 250, bonus: 50, price: 99, popular: true },
    { id: 'value', name: 'Value Pack', coins: 500, bonus: 150, price: 199, popular: false },
    { id: 'mega', name: 'Mega Pack', coins: 1000, bonus: 400, price: 399, popular: false },
  ]

  useEffect(() => { fetchUserRewards() }, [])

  const fetchUserRewards = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('user_rewards').select('*').eq('user_id', user.id).single()
      if (data) {
        // Remove duplicates from arrays
        const unlockedAvatars = [...new Set(data.unlocked_avatars || ['user'])] as string[]
        const unlockedThemes = [...new Set(data.unlocked_themes || ['default'])] as string[]
        
        setRewards({
          coins: data.coins || 0,
          gems: data.gems || 0,
          current_theme: data.current_theme || 'default',
          current_avatar: data.current_avatar || 'user',
          unlocked_themes: unlockedThemes,
          unlocked_avatars: unlockedAvatars
        })
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
    } finally {
      setLoading(false)
    }
  }


  const purchaseItem = async (type: 'theme' | 'avatar', item: Theme | ProfileIcon) => {
    if (type === 'theme') {
      const theme = item as Theme
      if (rewards.unlocked_themes.includes(theme.id)) {
        await updateUserRewards({ current_theme: theme.id })
        setTheme(theme.id as ThemeId) // Apply theme immediately
        showPopup('success', 'Theme Equipped!', `${theme.name} theme is now active`)
        return
      }
      if (rewards.coins < theme.price) {
        showPopup('error', 'Insufficient Coins', `You need ${theme.price - rewards.coins} more coins`)
        return
      }
      const newUnlockedThemes = [...new Set([...rewards.unlocked_themes, theme.id])]
      await updateUserRewards({
        coins: rewards.coins - theme.price,
        unlocked_themes: newUnlockedThemes,
        current_theme: theme.id
      })
      setTheme(theme.id as ThemeId) // Apply theme immediately
      showPopup('success', 'Theme Purchased!', `${theme.name} theme unlocked and equipped`)
      triggerConfetti()
    } else {
      const icon = item as ProfileIcon
      if (rewards.unlocked_avatars.includes(icon.id)) {
        await updateUserRewards({ current_avatar: icon.id })
        showPopup('success', 'Icon Equipped!', `${icon.name} icon is now active`)
        return
      }
      if (icon.free) {
        const newUnlockedAvatars = [...new Set([...rewards.unlocked_avatars, icon.id])]
        await updateUserRewards({ unlocked_avatars: newUnlockedAvatars, current_avatar: icon.id })
        showPopup('success', 'Icon Unlocked!', `${icon.name} icon equipped`)
        return
      }
      if (rewards.coins < icon.price) {
        showPopup('error', 'Insufficient Coins', `You need ${icon.price - rewards.coins} more coins`)
        return
      }
      const newUnlockedAvatars = [...new Set([...rewards.unlocked_avatars, icon.id])]
      await updateUserRewards({
        coins: rewards.coins - icon.price,
        unlocked_avatars: newUnlockedAvatars,
        current_avatar: icon.id
      })
      showPopup('success', 'Icon Purchased!', `${icon.name} icon unlocked and equipped`)
      triggerConfetti()
    }
  }

  const updateUserRewards = async (updates: Partial<UserRewards>) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      await supabase.from('user_rewards').upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
      
      // Sync avatar to profiles table for leaderboard using robust sync function
      if (updates.current_avatar) {
        const { syncProfileIcon } = await import('@/lib/profile-sync')
        const success = await syncProfileIcon(user.id, updates.current_avatar)
        if (!success) {
          console.warn('Profile icon sync partially failed, but continuing...')
        }
      }
      
      setRewards(prev => ({ ...prev, ...updates }))
    } catch (error) {
      console.error('Error updating rewards:', error)
    }
  }

  const handleBuyCoins = async (pkg: CoinPackage) => {
    setProcessingPayment(true)
    setTimeout(() => {
      const totalCoins = pkg.coins + pkg.bonus
      updateUserRewards({ coins: rewards.coins + totalCoins })
      showPopup('success', 'Coins Purchased!', `${totalCoins} coins added to your wallet`)
      triggerConfetti()
      setProcessingPayment(false)
    }, 1500)
  }

  const showPopup = (type: PopupState['type'], title: string, message: string) => {
    setPopup({ show: true, type, title, message })
  }

  const closePopup = () => setPopup({ show: false, type: 'info', title: '', message: '' })

  const triggerConfetti = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-surface rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <ShoppingCart className="text-purple-500" size={32} />
            </div>
            Premium Shop
          </h1>
          <p className="text-foreground-muted mt-2">Customize your experience with themes and icons</p>
        </div>
        
        {/* Wallet - Only Coins */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
          <Coins className="text-yellow-500" size={28} />
          <div>
            <div className="text-xs text-foreground-muted">Your Coins</div>
            <div className="text-2xl font-bold text-yellow-500">{rewards.coins.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface p-1.5 rounded-xl border border-border-subtle">
        {[
          { id: 'icons', label: 'Profile Icons', icon: User },
          { id: 'themes', label: 'Themes', icon: Palette },
          { id: 'coins', label: 'Buy Coins', icon: Coins, highlight: true }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? tab.highlight
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg'
                    : 'bg-accent-primary text-white shadow-lg'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'icons' && <IconsSection profileIcons={profileIcons} rewards={rewards} purchaseItem={purchaseItem} />}
      {activeTab === 'themes' && <ThemesSection themes={themes} rewards={rewards} purchaseItem={purchaseItem} />}
      {activeTab === 'coins' && <CoinsSection coinPackages={coinPackages} handleBuyCoins={handleBuyCoins} processingPayment={processingPayment} />}

      {/* Professional Popup */}
      {popup.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div 
            className="relative bg-surface rounded-2xl max-w-sm w-full shadow-xl border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Status Bar */}
            <div className={`h-1 w-full ${
              popup.type === 'success' ? 'bg-accent-success' :
              popup.type === 'error' ? 'bg-red-500' : 'bg-accent-primary'
            }`} />

            {/* Content */}
            <div className="p-6">
              {/* Close Button */}
              <button 
                onClick={closePopup} 
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-background transition-colors"
              >
                <X size={18} className="text-foreground-muted" />
              </button>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                popup.type === 'success' ? 'bg-accent-success/10' :
                popup.type === 'error' ? 'bg-red-500/10' : 'bg-accent-primary/10'
              }`}>
                {popup.type === 'success' ? (
                  <Check size={24} className="text-accent-success" />
                ) : popup.type === 'error' ? (
                  <X size={24} className="text-red-500" />
                ) : (
                  <Zap size={24} className="text-accent-primary" />
                )}
              </div>

              {/* Title & Message */}
              <h3 className="text-xl font-semibold mb-2 text-foreground pr-6">
                {popup.title}
              </h3>
              <p className="text-sm text-foreground-muted mb-6">
                {popup.message}
              </p>

              {/* Action Button */}
              <button
                onClick={closePopup}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                  popup.type === 'success' 
                    ? 'bg-accent-success hover:bg-accent-success/90 text-white' :
                  popup.type === 'error' 
                    ? 'bg-red-500 hover:bg-red-600 text-white' : 
                    'bg-accent-primary hover:bg-accent-primary/90 text-white'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -top-20 left-0 text-3xl animate-bounce opacity-80">✨</div>
            <div className="absolute -top-16 right-0 text-3xl animate-bounce animation-delay-200 opacity-80">⭐</div>
            <div className="absolute top-0 -left-16 text-3xl animate-bounce animation-delay-400 opacity-80">💫</div>
            <div className="absolute top-0 -right-16 text-3xl animate-bounce animation-delay-600 opacity-80">✨</div>
          </div>
        </div>
      )}
    </div>
  )
}


// Icons Section - Purple for Premium, Gold for Exclusive
function IconsSection({ profileIcons, rewards, purchaseItem }: any) {
  const categories = [
    { id: 'basic', label: 'Free Icons', desc: 'Available for everyone', color: 'green', icons: profileIcons.filter((i: ProfileIcon) => i.category === 'basic') },
    { id: 'premium', label: 'Premium Icons', desc: 'Unlock with coins', color: 'purple', icons: profileIcons.filter((i: ProfileIcon) => i.category === 'premium') },
    { id: 'exclusive', label: 'Exclusive Icons', desc: 'Rare and exclusive', color: 'yellow', icons: profileIcons.filter((i: ProfileIcon) => i.category === 'exclusive') },
  ]

  return (
    <div className="space-y-8">
      {categories.map(category => (
        <div key={category.id} className={`bg-surface p-6 rounded-2xl border ${
          category.color === 'green' ? 'border-green-500/30' :
          category.color === 'purple' ? 'border-purple-500/30' : 'border-yellow-500/30'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${
              category.color === 'green' ? 'bg-green-500/10' :
              category.color === 'purple' ? 'bg-purple-500/10' : 'bg-yellow-500/10'
            }`}>
              {category.color === 'green' ? <Gift className="text-green-500" size={28} /> :
               category.color === 'purple' ? <Star className="text-purple-500" size={28} /> :
               <Crown className="text-yellow-500" size={28} />}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${
                category.color === 'green' ? 'text-green-400' :
                category.color === 'purple' ? 'text-purple-400' : 'text-yellow-400'
              }`}>{category.label}</h3>
              <p className="text-sm text-foreground-muted">{category.desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {category.icons.map((icon: ProfileIcon) => {
              const Icon = icon.icon
              const isUnlocked = rewards.unlocked_avatars.includes(icon.id)
              const isEquipped = rewards.current_avatar === icon.id
              const catColor = category.color
              
              return (
                <button
                  key={icon.id}
                  onClick={() => purchaseItem('avatar', icon)}
                  className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 group ${
                    isEquipped
                      ? 'border-accent-primary bg-accent-primary/20 scale-105 shadow-lg shadow-accent-primary/30'
                      : isUnlocked
                      ? 'border-green-500/50 bg-green-500/5 hover:border-accent-primary/50'
                      : catColor === 'purple' 
                        ? 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5'
                        : catColor === 'yellow'
                        ? 'border-yellow-500/30 hover:border-yellow-500/60 bg-yellow-500/5'
                        : 'border-border-subtle hover:border-green-500/50 bg-background/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-xl transition-all ${
                      isEquipped ? 'bg-accent-primary/30' : 
                      isUnlocked ? 'bg-green-500/10' : 
                      catColor === 'purple' ? 'bg-purple-500/10 group-hover:bg-purple-500/20' :
                      catColor === 'yellow' ? 'bg-yellow-500/10 group-hover:bg-yellow-500/20' :
                      'bg-background group-hover:bg-green-500/10'
                    }`}>
                      <Icon 
                        size={32} 
                        strokeWidth={2}
                        className={`${
                          isEquipped ? 'text-accent-primary' : 
                          isUnlocked ? 'text-green-400' : 
                          catColor === 'purple' ? 'text-purple-400 group-hover:text-purple-300' :
                          catColor === 'yellow' ? 'text-yellow-400 group-hover:text-yellow-300' :
                          'text-foreground-muted group-hover:text-green-400'
                        }`} 
                      />
                    </div>
                    <div className="text-xs text-center font-medium truncate w-full">
                      {icon.name}
                    </div>
                  </div>
                  
                  {isEquipped && (
                    <div className="absolute -top-2 -right-2 p-1.5 bg-accent-primary rounded-full shadow-lg">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                  
                  {isUnlocked && !isEquipped && (
                    <div className="absolute -top-2 -right-2 p-1.5 bg-green-500 rounded-full shadow-lg">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                  
                  {!isUnlocked && !icon.free && (
                    <>
                      <div className="absolute top-2 right-2">
                        <Lock size={14} className="text-foreground-muted" />
                      </div>
                      <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full shadow-lg ${
                        catColor === 'purple' ? 'bg-purple-500 text-white' : 'bg-yellow-500 text-black'
                      }`}>
                        <Coins size={12} /> {icon.price}
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}


// Themes Section
function ThemesSection({ themes, rewards, purchaseItem }: any) {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/10 rounded-xl">
          <Palette className="text-purple-500" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Dashboard Themes</h2>
          <p className="text-foreground-muted">Transform your workspace with beautiful themes</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {themes.map((theme: Theme) => {
          const isUnlocked = rewards.unlocked_themes.includes(theme.id)
          const isEquipped = rewards.current_theme === theme.id
          
          return (
            <button
              key={theme.id}
              onClick={() => purchaseItem('theme', theme)}
              className={`group relative p-5 rounded-2xl border-2 transition-all hover:scale-105 ${
                isEquipped
                  ? 'border-accent-primary bg-accent-primary/10 shadow-lg shadow-accent-primary/20'
                  : isUnlocked
                  ? 'border-green-500/50 hover:border-accent-primary/50'
                  : 'border-border-subtle hover:border-yellow-500/50'
              }`}
            >
              <div className={`w-full h-24 rounded-xl mb-4 bg-gradient-to-br ${theme.gradient} shadow-inner`} />
              <div className="text-base font-bold mb-2">{theme.name}</div>
              {isEquipped ? (
                <div className="flex items-center justify-center gap-1.5 text-sm text-accent-primary font-bold">
                  <Check size={16} /> Equipped
                </div>
              ) : isUnlocked ? (
                <div className="flex items-center justify-center gap-1.5 text-sm text-green-500 font-medium">
                  <Check size={16} /> Owned
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-yellow-500">
                  <Coins size={16} /> {theme.price}
                </div>
              )}
              {!isUnlocked && theme.price > 0 && (
                <div className="absolute top-3 right-3">
                  <Lock size={18} className="text-foreground-muted" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Coins Section - Simple Design
function CoinsSection({ coinPackages, handleBuyCoins, processingPayment }: any) {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-yellow-500/10 rounded-xl">
          <Coins className="text-yellow-500" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Buy Coins</h2>
          <p className="text-foreground-muted">Get coins to unlock themes and icons</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {coinPackages.map((pkg: CoinPackage) => (
          <div
            key={pkg.id}
            className={`relative p-5 rounded-xl border-2 transition-all hover:scale-105 ${
              pkg.popular
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-border-subtle bg-background/50'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                BEST VALUE
              </div>
            )}
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-1">
                {pkg.coins.toLocaleString()}
              </div>
              {pkg.bonus > 0 && (
                <div className="text-sm text-accent-success font-medium mb-1">
                  +{pkg.bonus} bonus
                </div>
              )}
              <div className="text-sm text-foreground-muted mb-4">{pkg.name}</div>

              <button
                onClick={() => handleBuyCoins(pkg)}
                disabled={processingPayment}
                className={`w-full py-2.5 rounded-lg font-bold transition-all ${
                  pkg.popular
                    ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                    : 'bg-accent-primary text-white hover:bg-accent-primary/90'
                } disabled:opacity-50`}
              >
                {processingPayment ? '...' : `₹${pkg.price}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-sm text-foreground-muted">
        🔒 Secure payments via Razorpay
      </div>
    </div>
  )
}
