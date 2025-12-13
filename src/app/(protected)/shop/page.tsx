'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Coins, ShoppingCart, Check, Lock, X, 
  User, Palette, Gift, Star, Tag, Ticket, Sparkles,
  Zap, AlertCircle, IndianRupee, Crown, Rocket, Flame, 
  Trophy, Heart, Shield, Target, Coffee, Music, Gamepad2,
  Code, Brain, Gem, Moon, Trees, Sunset, Waves,
  Volume2, BarChart2, Headphones, Bell, Wand2, Clock, MessageCircle,
  ShoppingBag
} from 'lucide-react'
import { useTheme, ThemeId } from '@/components/ThemeProvider'
import { useSystemSettings } from '@/lib/useSystemSettings'

// Icon mapping for shop items
const iconMap: Record<string, any> = {
  // Avatars
  user: User, crown: Crown, star: Star, rocket: Rocket, flame: Flame,
  gem: Gem, trophy: Trophy, zap: Zap, heart: Heart, shield: Shield,
  target: Target, coffee: Coffee, music: Music, 'gamepad-2': Gamepad2,
  code: Code, brain: Brain,
  // Golden Premium Avatars (same icons, different key)
  'gold-crown': Crown, 'gold-star': Star, 'gold-trophy': Trophy,
  'gold-gem': Gem, 'gold-flame': Flame, 'gold-shield': Shield,
  // Themes
  palette: Palette, sparkles: Sparkles,
  default: Palette, ocean: Waves, sunset: Sunset, forest: Trees,
  purple: Sparkles, gold: Coins, rose: Heart, midnight: Moon,
  // Features
  'volume-2': Volume2, 'bar-chart-2': BarChart2, headphones: Headphones,
  bell: Bell, wand: Wand2, clock: Clock, 'message-circle': MessageCircle
}

// Check if icon is golden premium
const isGoldenIcon = (icon: string | null) => icon?.startsWith('gold-')

declare global {
  interface Window {
    Razorpay: any
  }
}

interface ShopItem {
  id: string
  name: string
  description: string | null
  plan_type: 'theme' | 'avatar' | 'feature'
  coin_price: number
  icon: string | null
  is_active: boolean
}

interface CoinPackage {
  id: string
  name: string
  description: string | null
  coins: number
  bonus_coins: number
  price_inr: number
  is_popular: boolean
  badge: string | null
  sort_order: number
}

interface UserRewards {
  coins: number
  current_theme: string
  current_avatar: string
  unlocked_themes: string[]
  unlocked_avatars: string[]
}

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase: number
  max_uses: number
  used_count: number
  expires_at: string | null
  is_active: boolean
}

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([])
  const [rewards, setRewards] = useState<UserRewards>({
    coins: 0, current_theme: 'default', current_avatar: 'user',
    unlocked_themes: ['default'], unlocked_avatars: ['user']
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'buycoins' | 'avatar' | 'theme' | 'feature'>('buycoins')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; title: string; message: string }>({ 
    show: false, type: 'success', title: '', message: '' 
  })
  const { setTheme } = useTheme()
  const { settings: systemSettings, loading: settingsLoading } = useSystemSettings()
  const supabase = createClient()

  // Check if shop is disabled
  if (!settingsLoading && !systemSettings.shop_enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-4 bg-yellow-500/10 rounded-full mb-4">
          <ShoppingBag size={48} className="text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Shop Temporarily Unavailable</h1>
        <p className="text-foreground-muted max-w-md">
          The shop is currently disabled by the administrator. Please check back later.
        </p>
      </div>
    )
  }

  useEffect(() => {
    fetchData()
    loadRazorpayScript()
  }, [])

  const loadRazorpayScript = () => {
    if (document.getElementById('razorpay-script')) return
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch shop items from database (admin-added)
      const { data: shopItems } = await supabase
        .from('shop_plans')
        .select('*')
        .eq('is_active', true)
        .order('coin_price')

      // Fetch coin packages from database
      const { data: packages } = await supabase
        .from('coin_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      // Fetch user rewards
      const { data: userRewards } = await supabase
        .from('user_rewards')
        .select('coins, current_theme, current_avatar, unlocked_themes, unlocked_avatars')
        .eq('user_id', user.id)
        .single()

      setItems(shopItems || [])
      setCoinPackages(packages || [])
      if (userRewards) {
        setRewards({
          coins: userRewards.coins || 0,
          current_theme: userRewards.current_theme || 'default',
          current_avatar: userRewards.current_avatar || 'user',
          unlocked_themes: userRewards.unlocked_themes || ['default'],
          unlocked_avatars: userRewards.unlocked_avatars || ['user']
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate discount for coin packages (real money)
  const calculatePackageDiscount = (priceInr: number): number => {
    if (!appliedCoupon) return 0
    if (priceInr < appliedCoupon.min_purchase) return 0
    
    if (appliedCoupon.discount_type === 'percentage') {
      return Math.floor(priceInr * (appliedCoupon.discount_value / 100))
    }
    return Math.min(appliedCoupon.discount_value, priceInr)
  }

  const handleBuyCoins = async (pkg: CoinPackage) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setProcessingPayment(pkg.id)

    // Apply coupon discount
    const discount = calculatePackageDiscount(pkg.price_inr)
    const finalPrice = pkg.price_inr - discount

    try {
      // Create Razorpay order via API
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            package_id: pkg.id,
            package_name: pkg.name,
            coins: pkg.coins,
            bonus: pkg.bonus_coins,
            coupon_code: appliedCoupon?.code || null,
            discount_applied: discount
          }
        })
      })

      const result = await response.json()
      if (!result.success || !result.order?.id) {
        throw new Error(result.error || 'Failed to create order')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: finalPrice,
        currency: 'INR',
        name: 'DevX Daily OS',
        description: `${pkg.name} - ${pkg.coins + pkg.bonus_coins} Coins`,
        order_id: result.order.id,
        handler: async (razorpayResponse: any) => {
          // Verify payment and add coins
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
              package_id: pkg.id,
              coins: pkg.coins,
              bonus: pkg.bonus_coins
            })
          })

          const verifyResult = await verifyRes.json()
          if (verifyResult.success) {
            // Update coupon usage if applied
            if (appliedCoupon && discount > 0) {
              await supabase.from('coupons').update({ 
                used_count: appliedCoupon.used_count + 1 
              }).eq('id', appliedCoupon.id)
              setAppliedCoupon(null)
            }
            
            setRewards(prev => ({ ...prev, coins: prev.coins + pkg.coins + pkg.bonus_coins }))
            showPopup('success', 'Payment Successful!', `${pkg.coins + pkg.bonus_coins} coins added to your wallet!`)
          } else {
            showPopup('error', 'Payment Failed', verifyResult.error || 'Please contact support if amount was deducted.')
          }
        },
        prefill: { email: user.email },
        theme: { color: '#8B5CF6' }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error: any) {
      console.error('Payment error:', error)
      showPopup('error', 'Payment Error', error.message || 'Something went wrong. Please try again.')
    } finally {
      setProcessingPayment(null)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }

    setCouponError('')
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        setCouponError('Invalid coupon code')
        return
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError('This coupon has expired')
        return
      }

      // Check usage limit
      if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
        setCouponError('This coupon has reached its usage limit')
        return
      }

      setAppliedCoupon(coupon)
      setCouponCode('')
    } catch (error) {
      setCouponError('Error applying coupon')
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const purchaseItem = async (item: ShopItem) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const itemKey = item.icon || item.id // Use icon as identifier
    const finalPrice = item.coin_price // No coupon for coin purchases

    // Check if already owned
    const isOwned = item.plan_type === 'theme' 
      ? rewards.unlocked_themes.includes(itemKey)
      : item.plan_type === 'avatar'
      ? rewards.unlocked_avatars.includes(itemKey)
      : false

    if (isOwned) {
      // Just equip it
      if (item.plan_type === 'theme') {
        await supabase.from('user_rewards').update({ current_theme: itemKey }).eq('user_id', user.id)
        setRewards(prev => ({ ...prev, current_theme: itemKey }))
        setTheme(itemKey as ThemeId)
        showPopup('success', 'Theme Equipped!', `${item.name} is now active`)
      } else if (item.plan_type === 'avatar') {
        await supabase.from('user_rewards').update({ current_avatar: itemKey }).eq('user_id', user.id)
        setRewards(prev => ({ ...prev, current_avatar: itemKey }))
        showPopup('success', 'Avatar Equipped!', `${item.name} is now active`)
      }
      return
    }

    // Check coins
    if (rewards.coins < finalPrice) {
      showPopup('error', 'Insufficient Coins', `You need ${finalPrice - rewards.coins} more coins`)
      return
    }

    // Purchase
    const updates: any = { coins: rewards.coins - finalPrice }
    
    if (item.plan_type === 'theme') {
      updates.unlocked_themes = [...new Set([...rewards.unlocked_themes, itemKey])]
      updates.current_theme = itemKey
    } else if (item.plan_type === 'avatar') {
      updates.unlocked_avatars = [...new Set([...rewards.unlocked_avatars, itemKey])]
      updates.current_avatar = itemKey
    }

    await supabase.from('user_rewards').update(updates).eq('user_id', user.id)

    // Update local state
    setRewards(prev => ({ ...prev, ...updates }))
    
    if (item.plan_type === 'theme') {
      setTheme(itemKey as ThemeId)
    }

    showPopup('success', 'Purchase Successful!', `${item.name} unlocked and equipped!`)
  }

  const showPopup = (type: 'success' | 'error', title: string, message: string) => {
    setPopup({ show: true, type, title, message })
  }

  const filteredItems = items.filter(item => item.plan_type === activeTab)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-surface rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-surface rounded-2xl animate-pulse" />
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
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <ShoppingCart className="text-purple-500" size={24} />
            </div>
            Shop
          </h1>
          <p className="text-foreground-muted mt-1">Customize your experience</p>
        </div>
        
        {/* Wallet */}
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
          <Coins className="text-yellow-500" size={24} />
          <div>
            <div className="text-xs text-foreground-muted">Your Coins</div>
            <div className="text-xl font-bold text-yellow-500">{rewards.coins.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface p-1.5 rounded-xl border border-border-subtle overflow-x-auto">
        {[
          { id: 'buycoins', label: 'Buy Coins', icon: IndianRupee },
          { id: 'avatar', label: 'Avatars', icon: User },
          { id: 'theme', label: 'Themes', icon: Palette },
          { id: 'feature', label: 'Features', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon
          const count = tab.id === 'buycoins' 
            ? coinPackages.length 
            : items.filter(i => i.plan_type === tab.id).length
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-accent-primary text-white'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background'
              }`}
            >
              <Icon size={18} />
              {tab.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-background'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Buy Coins Tab */}
      {activeTab === 'buycoins' && (
        <div className="space-y-4">
          {/* Coupon Section - Only for Buy Coins */}
          <div className="bg-surface rounded-2xl border border-border-subtle p-4">
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="text-accent-primary" size={20} />
              <span className="font-medium">Have a coupon code?</span>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary uppercase"
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button
                  onClick={removeCoupon}
                  className="px-4 py-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={applyCoupon}
                  className="px-4 py-2.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition"
                >
                  Apply
                </button>
              )}
            </div>

            {couponError && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <AlertCircle size={14} /> {couponError}
              </p>
            )}

            {appliedCoupon && (
              <div className="mt-3 p-3 bg-accent-success/10 border border-accent-success/30 rounded-xl flex items-center gap-2">
                <Tag className="text-accent-success" size={18} />
                <span className="text-accent-success font-medium">
                  {appliedCoupon.discount_type === 'percentage' 
                    ? `${appliedCoupon.discount_value}% off on coin packages!` 
                    : `₹${appliedCoupon.discount_value / 100} off on coin packages!`}
                </span>
              </div>
            )}
          </div>

          {coinPackages.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-border-subtle">
              <IndianRupee size={48} className="mx-auto mb-4 text-foreground-muted opacity-50" />
              <p className="text-foreground-muted mb-2">No coin packages available</p>
              <p className="text-sm text-foreground-muted">Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {coinPackages.map((pkg) => {
                const discount = calculatePackageDiscount(pkg.price_inr)
                const finalPrice = pkg.price_inr - discount
                
                return (
                  <div
                    key={pkg.id}
                    className={`relative bg-surface rounded-2xl border-2 p-5 transition-all hover:scale-[1.02] ${
                      pkg.is_popular
                        ? 'border-yellow-500/50 bg-yellow-500/5 shadow-lg shadow-yellow-500/10'
                        : 'border-border-subtle hover:border-accent-primary/50'
                    }`}
                  >
                    {/* Badge */}
                    {pkg.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                        {pkg.badge}
                      </div>
                    )}

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-accent-success text-white text-xs font-bold rounded-full">
                        -{appliedCoupon?.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `₹${discount / 100}`}
                      </div>
                    )}

                    {/* Popular Star */}
                    {pkg.is_popular && (
                      <div className="absolute top-3 right-3">
                        <Star className="text-yellow-500 fill-yellow-500" size={20} />
                      </div>
                    )}

                    {/* Coins Display */}
                    <div className="text-center mb-4 pt-2">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl mb-3">
                        <Coins className="text-yellow-500" size={32} />
                      </div>
                      <h3 className="font-bold text-lg">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-sm text-foreground-muted mt-1">{pkg.description}</p>
                      )}
                    </div>

                    {/* Coins Info */}
                    <div className="bg-background rounded-xl p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-foreground-muted">Base Coins</span>
                        <span className="font-bold">{pkg.coins.toLocaleString()}</span>
                      </div>
                      {pkg.bonus_coins > 0 && (
                        <div className="flex items-center justify-between text-green-500">
                          <span>Bonus</span>
                          <span className="font-bold">+{pkg.bonus_coins.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-border-subtle mt-2 pt-2 flex items-center justify-between">
                        <span className="font-medium">Total</span>
                        <span className="font-bold text-yellow-500">
                          {(pkg.coins + pkg.bonus_coins).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Price & Buy Button */}
                    <button
                      onClick={() => handleBuyCoins(pkg)}
                      disabled={processingPayment === pkg.id}
                      className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                        processingPayment === pkg.id
                          ? 'bg-foreground-muted/20 cursor-wait'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90'
                      }`}
                    >
                      {processingPayment === pkg.id ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <IndianRupee size={18} />
                          {discount > 0 ? (
                            <>
                              <span className="line-through opacity-50">₹{(pkg.price_inr / 100).toFixed(0)}</span>
                              <span>₹{(finalPrice / 100).toFixed(0)}</span>
                            </>
                          ) : (
                            <span>₹{(pkg.price_inr / 100).toFixed(0)}</span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Zap className="text-blue-500" size={20} />
              </div>
              <div>
                <h4 className="font-medium mb-1">Secure Payment via Razorpay</h4>
                <p className="text-sm text-foreground-muted">
                  All payments are processed securely. Coins are added instantly after successful payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {activeTab !== 'buycoins' && (filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-border-subtle">
          <Gift size={48} className="mx-auto mb-4 text-foreground-muted opacity-50" />
          <p className="text-foreground-muted mb-2">No items available yet</p>
          <p className="text-sm text-foreground-muted">Check back later for new items!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredItems.map((item) => {
            const itemKey = item.icon || item.id
            const isOwned = item.plan_type === 'theme'
              ? rewards.unlocked_themes.includes(itemKey)
              : item.plan_type === 'avatar'
              ? rewards.unlocked_avatars.includes(itemKey)
              : false
            
            const isEquipped = item.plan_type === 'theme'
              ? rewards.current_theme === itemKey
              : item.plan_type === 'avatar'
              ? rewards.current_avatar === itemKey
              : false

            const canAfford = rewards.coins >= item.coin_price
            const IconComponent = item.icon ? (iconMap[item.icon] || User) : User
            const isGolden = isGoldenIcon(item.icon)

            return (
              <div
                key={item.id}
                className={`relative bg-surface rounded-xl border-2 p-3 transition-all hover:scale-[1.02] ${
                  isGolden
                    ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-orange-500/5'
                    : isEquipped
                    ? 'border-accent-primary bg-accent-primary/5'
                    : isOwned
                    ? 'border-accent-success/50'
                    : 'border-border-subtle hover:border-accent-primary/50'
                }`}
              >
                {/* Premium Badge */}
                {isGolden && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[10px] font-bold rounded-full">
                    PREMIUM
                  </div>
                )}

                {/* Icon */}
                <div className={`w-full aspect-square rounded-lg mb-2 flex items-center justify-center ${
                  isGolden
                    ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30'
                    : item.plan_type === 'theme' 
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                    : item.plan_type === 'avatar'
                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                    : 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                }`}>
                  <IconComponent size={28} className={
                    isGolden ? 'text-yellow-400' :
                    item.plan_type === 'theme' ? 'text-purple-400' :
                    item.plan_type === 'avatar' ? 'text-blue-400' : 'text-yellow-400'
                  } />
                </div>

                {/* Info */}
                <h3 className="font-semibold text-sm mb-0.5 truncate">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-foreground-muted mb-2 line-clamp-1">{item.description}</p>
                )}

                {/* Price & Action */}
                {isEquipped ? (
                  <div className="flex items-center justify-center gap-1 py-1.5 bg-accent-primary/20 text-accent-primary rounded-lg text-xs font-medium">
                    <Check size={12} /> Equipped
                  </div>
                ) : isOwned ? (
                  <button
                    onClick={() => purchaseItem(item)}
                    className="w-full py-1.5 bg-accent-success/20 text-accent-success rounded-lg text-xs font-medium hover:bg-accent-success/30 transition"
                  >
                    Equip
                  </button>
                ) : (
                  <button
                    onClick={() => purchaseItem(item)}
                    disabled={!canAfford}
                    className={`w-full py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
                      canAfford
                        ? 'bg-accent-primary text-white hover:opacity-90'
                        : 'bg-background text-foreground-muted cursor-not-allowed'
                    }`}
                  >
                    <Coins size={12} />
                    <span>{item.coin_price}</span>
                  </button>
                )}

                {/* Badges */}
                {isOwned && !isEquipped && (
                  <div className="absolute top-2 right-2 p-1 bg-accent-success rounded-full">
                    <Check size={10} className="text-white" />
                  </div>
                )}
                
                {!isOwned && !canAfford && (
                  <div className="absolute top-2 right-2">
                    <Lock size={12} className="text-foreground-muted" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Popup */}
      {popup.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-sm w-full border border-border-subtle overflow-hidden">
            <div className={`h-1 w-full ${popup.type === 'success' ? 'bg-accent-success' : 'bg-red-500'}`} />
            <div className="p-6">
              <button 
                onClick={() => setPopup({ ...popup, show: false })}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-background"
              >
                <X size={18} />
              </button>

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                popup.type === 'success' ? 'bg-accent-success/10' : 'bg-red-500/10'
              }`}>
                {popup.type === 'success' ? (
                  <Check size={24} className="text-accent-success" />
                ) : (
                  <X size={24} className="text-red-500" />
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">{popup.title}</h3>
              <p className="text-foreground-muted mb-6">{popup.message}</p>

              <button
                onClick={() => setPopup({ ...popup, show: false })}
                className={`w-full py-2.5 rounded-xl font-medium ${
                  popup.type === 'success' 
                    ? 'bg-accent-success text-white' 
                    : 'bg-red-500 text-white'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
