'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coins, Gem, Gift, Target, Flame, Star, Check, Sparkles, Trophy, Zap, CreditCard, ShoppingCart } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface UserRewards {
  coins: number
  gems: number
  current_theme: string
  current_avatar: string
  unlocked_themes: string[]
  unlocked_avatars: string[]
}

interface Challenge {
  id: string
  title: string
  description: string
  target_type: string
  target_value: number
  coin_reward: number
  xp_reward: number
  progress: number
  completed: boolean
  claimed: boolean
}

const themes = [
  { id: 'default', name: 'Default Dark', price: 0, color: 'bg-zinc-900' },
  { id: 'ocean', name: 'Ocean Blue', price: 1000, color: 'bg-blue-900' },
  { id: 'forest', name: 'Forest Green', price: 1000, color: 'bg-green-900' },
  { id: 'sunset', name: 'Sunset Orange', price: 1500, color: 'bg-orange-900' },
  { id: 'purple', name: 'Royal Purple', price: 1500, color: 'bg-purple-900' },
  { id: 'gold', name: 'Golden', price: 2000, color: 'bg-yellow-900' },
]

const profileIcons = [
  // Free icons (always unlocked)
  { id: 'default', name: 'Default', price: 0, emoji: '👤', free: true },
  { id: 'smile', name: 'Smile', price: 0, emoji: '😊', free: true },
  { id: 'cool', name: 'Cool', price: 0, emoji: '😎', free: true },
  { id: 'star', name: 'Star', price: 0, emoji: '⭐', free: true },
  { id: 'fire', name: 'Fire', price: 0, emoji: '🔥', free: true },
  // Purchasable icons (doubled prices)
  { id: 'ninja', name: 'Ninja', price: 400, emoji: '🥷', free: false },
  { id: 'robot', name: 'Robot', price: 400, emoji: '🤖', free: false },
  { id: 'battery', name: 'Battery', price: 500, emoji: '🔋', free: false },
  { id: 'lightbulb', name: 'Lightbulb', price: 500, emoji: '💡', free: false },
  { id: 'alien', name: 'Alien', price: 600, emoji: '👽', free: false },
  { id: 'wizard', name: 'Wizard', price: 600, emoji: '🧙', free: false },
  { id: 'astronaut', name: 'Astronaut', price: 800, emoji: '👨‍🚀', free: false },
  { id: 'superhero', name: 'Superhero', price: 1000, emoji: '🦸', free: false },
  { id: 'dragon', name: 'Dragon', price: 1200, emoji: '🐉', free: false },
  { id: 'crown', name: 'Royal', price: 1600, emoji: '👑', free: false },
  { id: 'diamond', name: 'Diamond', price: 2000, emoji: '💎', free: false },
  { id: 'trophy', name: 'Trophy', price: 2400, emoji: '🏆', free: false },
]

// Coin packages for purchase
const coinPackages = [
  { id: 'starter', name: 'Starter Pack', coins: 500, price: 49, bonus: 0 },
  { id: 'popular', name: 'Popular Pack', coins: 1200, price: 99, bonus: 200, popular: true },
  { id: 'mega', name: 'Mega Pack', coins: 3000, price: 199, bonus: 500 },
  { id: 'ultimate', name: 'Ultimate Pack', coins: 7000, price: 399, bonus: 1500 },
]

export default function RewardsPage() {
  const [rewards, setRewards] = useState<UserRewards>({
    coins: 0,
    gems: 0,
    current_theme: 'default',
    current_avatar: 'default',
    unlocked_themes: ['default'],
    unlocked_avatars: ['default']
  })
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'challenges' | 'shop' | 'buy'>('challenges')
  const [showConfetti, setShowConfetti] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch or create user rewards
      let { data: rewardsData } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!rewardsData) {
        const { data: newRewards } = await supabase
          .from('user_rewards')
          .insert({ user_id: user.id })
          .select()
          .single()
        rewardsData = newRewards
      }

      if (rewardsData) {
        setRewards(rewardsData)
      }

      // Fetch weekly challenges
      const { data: challengesData } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('is_active', true)

      // Fetch user progress for challenges
      const { data: progressData } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id)

      // Calculate actual progress from habit_logs
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('user_id', user.id)
        .gte('date', weekStart.toISOString().split('T')[0])
        .eq('completed', true)

      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const completions = logs?.length || 0
      const uniqueDates = [...new Set(logs?.map(l => l.date) || [])]
      const habitCount = habits?.length || 1
      
      // Calculate perfect days
      const dateCounts = new Map<string, number>()
      logs?.forEach(log => {
        dateCounts.set(log.date, (dateCounts.get(log.date) || 0) + 1)
      })
      const perfectDays = Array.from(dateCounts.values()).filter(c => c >= habitCount).length

      // Calculate streak
      let streak = 0
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        if (uniqueDates.includes(dateStr)) {
          streak++
        } else if (i > 0) {
          break
        }
      }

      // Map challenges with progress
      const mappedChallenges: Challenge[] = (challengesData || []).map(c => {
        const userProgress = progressData?.find(p => p.challenge_id === c.id)
        let progress = 0
        
        if (c.target_type === 'completions') progress = completions
        else if (c.target_type === 'streak') progress = streak
        else if (c.target_type === 'perfect_days') progress = perfectDays

        return {
          ...c,
          progress,
          completed: progress >= c.target_value,
          claimed: userProgress?.claimed || false
        }
      })

      setChallenges(mappedChallenges)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching rewards:', error)
      setLoading(false)
    }
  }

  const claimReward = async (challenge: Challenge) => {
    if (!challenge.completed || challenge.claimed) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update user coins
      await supabase
        .from('user_rewards')
        .update({ coins: rewards.coins + challenge.coin_reward })
        .eq('user_id', user.id)

      // Mark challenge as claimed
      await supabase
        .from('user_challenge_progress')
        .upsert({
          user_id: user.id,
          challenge_id: challenge.id,
          progress: challenge.progress,
          completed: true,
          completed_at: new Date().toISOString(),
          claimed: true
        }, { onConflict: 'user_id,challenge_id' })

      // Show confetti
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error claiming reward:', error)
    }
  }

  const purchaseItem = async (type: 'theme' | 'avatar', item: { id: string; price: number; emoji?: string; free?: boolean }) => {
    // Free items or already unlocked - just equip
    if (item.free || item.price === 0 || 
        (type === 'theme' && rewards.unlocked_themes.includes(item.id)) ||
        (type === 'avatar' && rewards.unlocked_avatars.includes(item.id))) {
      await equipItem(type, item.id, item.emoji)
      return
    }

    if (rewards.coins < item.price) {
      alert('Not enough coins!')
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const updates: any = {
        coins: rewards.coins - item.price
      }

      if (type === 'theme') {
        updates.unlocked_themes = [...rewards.unlocked_themes, item.id]
        updates.current_theme = item.id
      } else {
        updates.unlocked_avatars = [...rewards.unlocked_avatars, item.id]
        updates.current_avatar = item.id
      }

      await supabase
        .from('user_rewards')
        .update(updates)
        .eq('user_id', user.id)

      // Update profile icon
      if (type === 'avatar' && item.emoji) {
        await supabase
          .from('profiles')
          .update({ profile_icon: item.emoji })
          .eq('id', user.id)
      }

      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
      fetchData()
    } catch (error) {
      console.error('Error purchasing:', error)
    }
  }

  const equipItem = async (type: 'theme' | 'avatar', itemId: string, emoji?: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const updates = type === 'theme' 
        ? { current_theme: itemId }
        : { current_avatar: itemId }

      await supabase
        .from('user_rewards')
        .update(updates)
        .eq('user_id', user.id)

      // Update profile icon
      if (type === 'avatar' && emoji) {
        await supabase
          .from('profiles')
          .update({ profile_icon: emoji })
          .eq('id', user.id)
      }

      fetchData()
    } catch (error) {
      console.error('Error equipping:', error)
    }
  }

  const handleBuyCoins = async (pkg: typeof coinPackages[0]) => {
    if (processingPayment) return
    setProcessingPayment(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please login to purchase coins')
        setProcessingPayment(false)
        return
      }

      // Create Razorpay order (you'll need to create an API route for this)
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: pkg.price * 100, // Razorpay expects amount in paise
          currency: 'INR',
          package_id: pkg.id,
          coins: pkg.coins + pkg.bonus
        })
      })

      const order = await response.json()

      if (!order.id) {
        // For demo, directly add coins (remove this in production)
        const totalCoins = pkg.coins + pkg.bonus
        await supabase
          .from('user_rewards')
          .update({ coins: rewards.coins + totalCoins })
          .eq('user_id', user.id)
        
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
        fetchData()
        alert(`🎉 Demo: Added ${totalCoins} coins!`)
        setProcessingPayment(false)
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_xxxxx', // Replace with your key
        amount: order.amount,
        currency: order.currency,
        name: 'DevX Daily OS',
        description: `${pkg.name} - ${pkg.coins + pkg.bonus} Coins`,
        order_id: order.id,
        handler: async function (response: any) {
          // Verify payment on server
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: user.id,
              coins: pkg.coins + pkg.bonus
            })
          })

          if (verifyRes.ok) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3000)
            fetchData()
            alert(`🎉 Successfully purchased ${pkg.coins + pkg.bonus} coins!`)
          } else {
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          email: user.email
        },
        theme: {
          color: '#6366f1'
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Header with Currency */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="text-accent-primary" />
            Rewards & Shop
          </h1>
          <p className="text-foreground-muted">Complete challenges and unlock rewards</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <Coins className="text-yellow-500" size={20} />
            <span className="font-bold text-yellow-500">{rewards.coins}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <Gem className="text-purple-500" size={20} />
            <span className="font-bold text-purple-500">{rewards.gems}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'challenges'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          Weekly Challenges
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'shop'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          Shop
        </button>
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'buy'
              ? 'bg-yellow-500 text-black'
              : 'text-yellow-500 hover:bg-yellow-500/10'
          }`}
        >
          <ShoppingCart size={16} />
          Buy Coins
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface p-6 rounded-xl border border-border-subtle animate-pulse">
              <div className="h-32 bg-background rounded-lg" />
            </div>
          ))}
        </div>
      ) : activeTab === 'challenges' ? (
        <>
          {/* Weekly Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map(challenge => {
              const Icon = challenge.target_type === 'completions' ? Target 
                : challenge.target_type === 'streak' ? Flame : Star
              const percentage = Math.min((challenge.progress / challenge.target_value) * 100, 100)
              
              return (
                <div
                  key={challenge.id}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    challenge.completed
                      ? challenge.claimed
                        ? 'bg-surface border-border-subtle opacity-60'
                        : 'bg-accent-success/10 border-accent-success'
                      : 'bg-surface border-border-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${
                      challenge.completed ? 'bg-accent-success/20' : 'bg-accent-primary/10'
                    }`}>
                      <Icon size={24} className={challenge.completed ? 'text-accent-success' : 'text-accent-primary'} />
                    </div>
                    {challenge.completed && !challenge.claimed && (
                      <span className="text-xs bg-accent-success text-white px-2 py-1 rounded-full animate-pulse">
                        Ready!
                      </span>
                    )}
                    {challenge.claimed && (
                      <Check size={20} className="text-foreground-muted" />
                    )}
                  </div>

                  <h3 className="font-bold text-lg mb-1">{challenge.title}</h3>
                  <p className="text-sm text-foreground-muted mb-4">{challenge.description}</p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground-muted">Progress</span>
                      <span className="font-semibold">{challenge.progress}/{challenge.target_value}</span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          challenge.completed ? 'bg-accent-success' : 'bg-accent-primary'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1 text-sm text-yellow-500">
                        <Coins size={14} /> {challenge.coin_reward}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-purple-500">
                        <Zap size={14} /> {challenge.xp_reward} XP
                      </span>
                    </div>
                    {challenge.completed && !challenge.claimed && (
                      <button
                        onClick={() => claimReward(challenge)}
                        className="px-3 py-1.5 bg-accent-success text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {challenges.length === 0 && (
            <div className="text-center py-12 text-foreground-muted">
              No active challenges. Check back next week!
            </div>
          )}
        </>
      ) : activeTab === 'shop' ? (
        <>
          {/* Shop - Themes */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="text-purple-500" />
              Themes
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {themes.map(theme => {
                const isUnlocked = rewards.unlocked_themes.includes(theme.id)
                const isEquipped = rewards.current_theme === theme.id
                
                return (
                  <button
                    key={theme.id}
                    onClick={() => purchaseItem('theme', theme)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isEquipped
                        ? 'border-accent-primary bg-accent-primary/10'
                        : isUnlocked
                        ? 'border-border-subtle hover:border-accent-primary/50'
                        : 'border-border-subtle opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-full h-12 rounded-lg mb-3 ${theme.color}`} />
                    <div className="text-sm font-medium mb-1">{theme.name}</div>
                    {isEquipped ? (
                      <span className="text-xs text-accent-primary">Equipped</span>
                    ) : isUnlocked ? (
                      <span className="text-xs text-foreground-muted">Owned</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-xs text-yellow-500">
                        <Coins size={12} /> {theme.price}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Shop - Profile Icons */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              Profile Icons
            </h2>
            
            {/* Free Icons Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground-muted mb-3">FREE ICONS</h3>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {profileIcons.filter(icon => icon.free).map(icon => {
                  const isEquipped = rewards.current_avatar === icon.id
                  
                  return (
                    <button
                      key={icon.id}
                      onClick={() => purchaseItem('avatar', icon)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isEquipped
                          ? 'border-accent-primary bg-accent-primary/10 scale-110'
                          : 'border-border-subtle hover:border-accent-primary/50 hover:scale-105'
                      }`}
                    >
                      <div className="text-3xl text-center">{icon.emoji}</div>
                      {isEquipped && (
                        <div className="text-xs text-accent-primary text-center mt-1">✓</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Purchasable Icons Section */}
            <div>
              <h3 className="text-sm font-semibold text-foreground-muted mb-3">PREMIUM ICONS</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                {profileIcons.filter(icon => !icon.free).map(icon => {
                  const isUnlocked = rewards.unlocked_avatars.includes(icon.id)
                  const isEquipped = rewards.current_avatar === icon.id
                  
                  return (
                    <button
                      key={icon.id}
                      onClick={() => purchaseItem('avatar', icon)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isEquipped
                          ? 'border-accent-primary bg-accent-primary/10 scale-110'
                          : isUnlocked
                          ? 'border-border-subtle hover:border-accent-primary/50 hover:scale-105'
                          : 'border-border-subtle opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="text-3xl text-center mb-1">
                        {isUnlocked ? icon.emoji : '🔒'}
                      </div>
                      <div className="text-xs text-foreground-muted text-center truncate mb-1">{icon.name}</div>
                      {isEquipped ? (
                        <div className="text-xs text-accent-primary text-center">✓</div>
                      ) : isUnlocked ? (
                        <div className="text-xs text-foreground-muted text-center">Owned</div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-xs text-yellow-500">
                          <Coins size={10} /> {icon.price}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* How to Earn */}
          <div className="bg-surface p-6 rounded-xl border border-accent-primary/20">
            <h3 className="font-bold mb-4">💰 How to Earn Coins</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-background p-4 rounded-lg">
                <div className="text-yellow-500 font-bold mb-1">+1 coin</div>
                <div className="text-foreground-muted">Per habit completed</div>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <div className="text-yellow-500 font-bold mb-1">+5 coins</div>
                <div className="text-foreground-muted">Per achievement unlocked</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Buy Coins Section */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6 rounded-xl border border-yellow-500/30">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <CreditCard className="text-yellow-500" />
              Buy Coins
            </h2>
            <p className="text-foreground-muted mb-6">Get coins instantly to unlock premium items</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {coinPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                    pkg.popular
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-border-subtle bg-surface'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                      POPULAR
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">💰</div>
                    <div className="text-2xl font-bold text-yellow-500">{pkg.coins.toLocaleString()}</div>
                    {pkg.bonus > 0 && (
                      <div className="text-sm text-accent-success">+{pkg.bonus} bonus!</div>
                    )}
                    <div className="text-xs text-foreground-muted mt-1">{pkg.name}</div>
                  </div>
                  
                  <button
                    onClick={() => handleBuyCoins(pkg)}
                    disabled={processingPayment}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      pkg.popular
                        ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                        : 'bg-accent-primary text-white hover:opacity-90'
                    } disabled:opacity-50`}
                  >
                    {processingPayment ? 'Processing...' : `₹${pkg.price}`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles className="text-accent-primary" />
              Why Buy Coins?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎨</div>
                <div>
                  <div className="font-semibold">Unlock Themes</div>
                  <div className="text-foreground-muted">Customize your dashboard look</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">👤</div>
                <div>
                  <div className="font-semibold">Premium Icons</div>
                  <div className="text-foreground-muted">Stand out on the leaderboard</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <div className="font-semibold">Instant Access</div>
                  <div className="text-foreground-muted">No waiting, unlock immediately</div>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Payment Badge */}
          <div className="text-center text-sm text-foreground-muted">
            <div className="flex items-center justify-center gap-2">
              <span>🔒</span>
              <span>Secure payments powered by Razorpay</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
