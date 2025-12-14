import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { planId, couponCode } = await request.json()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('shop_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Get user's current coins and version for optimistic locking
    const { data: userRewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('coins, version')
      .eq('user_id', user.id)
      .single()

    if (rewardsError) {
      return NextResponse.json({ error: 'User rewards not found' }, { status: 404 })
    }

    let finalPrice = plan.coin_price
    let couponDiscount = 0
    let couponId = null

    // Validate coupon if provided - Direct database query for security
    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (couponError || !coupon) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
      }

      // Check if coupon is expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
      }

      // Check usage limits
      if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
      }

      // Check minimum purchase requirement
      if (coupon.min_purchase > 0 && plan.coin_price < coupon.min_purchase) {
        return NextResponse.json({ 
          error: `Minimum purchase of ${coupon.min_purchase} coins required for this coupon` 
        }, { status: 400 })
      }

      // Calculate discount
      if (coupon.discount_type === 'percentage') {
        couponDiscount = Math.floor((plan.coin_price * coupon.discount_value) / 100)
      } else {
        couponDiscount = coupon.discount_value
      }

      finalPrice = Math.max(0, plan.coin_price - couponDiscount)
      couponId = coupon.id

      // Update coupon usage count
      await supabase
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', coupon.id)
    }

    // Check if user has enough coins
    if (userRewards.coins < finalPrice) {
      return NextResponse.json({ 
        error: `Insufficient coins. You need ${finalPrice - userRewards.coins} more coins.` 
      }, { status: 400 })
    }

    // Start transaction with optimistic locking
    const { data: purchaseResult, error: transactionError } = await supabase.rpc('process_purchase_safe', {
      p_user_id: user.id,
      p_expected_version: userRewards.version || 0,
      p_plan_id: planId,
      p_coupon_id: couponId,
      p_original_price: plan.coin_price,
      p_coupon_discount: couponDiscount,
      p_final_price: finalPrice,
      p_coins_spent: finalPrice
    })

    if (transactionError) {
      return NextResponse.json({ error: 'Purchase failed' }, { status: 500 })
    }

    // Check if the safe function returned an error (version mismatch, insufficient funds, etc.)
    if (purchaseResult && !purchaseResult.success) {
      return NextResponse.json({ 
        error: purchaseResult.message || 'Purchase failed - please try again' 
      }, { status: 400 })
    }

    // Apply the purchased item to user
    const updates: any = {}
    
    if (plan.plan_type === 'theme') {
      // Add to unlocked themes and set as current
      const { data: currentRewards } = await supabase
        .from('user_rewards')
        .select('unlocked_themes, current_theme')
        .eq('user_id', user.id)
        .single()

      const unlockedThemes = [...new Set([...(currentRewards?.unlocked_themes || ['default']), plan.name.toLowerCase().replace(/\s+/g, '-')])]
      updates.unlocked_themes = unlockedThemes
      updates.current_theme = plan.name.toLowerCase().replace(/\s+/g, '-')
    } else if (plan.plan_type === 'avatar') {
      // Add to unlocked avatars and set as current
      const { data: currentRewards } = await supabase
        .from('user_rewards')
        .select('unlocked_avatars, current_avatar')
        .eq('user_id', user.id)
        .single()

      const unlockedAvatars = [...new Set([...(currentRewards?.unlocked_avatars || ['user']), plan.icon || plan.name.toLowerCase()])]
      updates.unlocked_avatars = unlockedAvatars
      updates.current_avatar = plan.icon || plan.name.toLowerCase()
    }

    // Update user rewards with new unlocks
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('user_rewards')
        .update(updates)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ 
      success: true, 
      message: `${plan.name} purchased successfully!`,
      finalPrice,
      couponDiscount
    })

  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}