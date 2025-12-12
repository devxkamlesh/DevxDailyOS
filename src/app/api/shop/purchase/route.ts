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

    // Get user's current coins
    const { data: userRewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('coins')
      .eq('user_id', user.id)
      .single()

    if (rewardsError) {
      return NextResponse.json({ error: 'User rewards not found' }, { status: 404 })
    }

    let finalPrice = plan.coin_price
    let couponDiscount = 0
    let couponId = null

    // Validate coupon if provided
    if (couponCode) {
      const couponValidation = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          userId: user.id,
          planType: plan.plan_type,
          purchaseAmount: plan.coin_price
        })
      })

      const couponResult = await couponValidation.json()
      
      if (!couponResult.valid) {
        return NextResponse.json({ error: couponResult.error }, { status: 400 })
      }

      finalPrice = couponResult.finalAmount
      couponDiscount = couponResult.discount
      couponId = couponResult.coupon.id
    }

    // Check if user has enough coins
    if (userRewards.coins < finalPrice) {
      return NextResponse.json({ 
        error: `Insufficient coins. You need ${finalPrice - userRewards.coins} more coins.` 
      }, { status: 400 })
    }

    // Start transaction
    const { error: transactionError } = await supabase.rpc('process_purchase', {
      p_user_id: user.id,
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