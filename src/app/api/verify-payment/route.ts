import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      coins
    } = await request.json()

    console.log('Verify payment request:', { razorpay_order_id, razorpay_payment_id, user_id, coins })

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id || !coins) {
      console.error('Missing fields:', { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, coins })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || ''
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    console.log('Signature verification:', { expected: expectedSignature, received: razorpay_signature })

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Use service role key if available, otherwise use anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current user rewards
    const { data: currentRewards, error: fetchError } = await supabase
      .from('user_rewards')
      .select('coins')
      .eq('user_id', user_id)
      .single()

    if (fetchError) {
      console.error('Error fetching rewards:', fetchError)
    }

    const currentCoins = currentRewards?.coins || 0
    console.log('Current coins:', currentCoins, 'Adding:', coins)

    // Update user coins
    const { error: updateError } = await supabase
      .from('user_rewards')
      .update({ coins: currentCoins + coins })
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Error updating coins:', updateError)
      return NextResponse.json(
        { error: 'Failed to update coins', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('Coins updated successfully!')

    // Log the transaction (optional - may fail if table doesn't exist)
    try {
      await supabase
        .from('coin_transactions')
        .insert({
          user_id,
          amount: coins,
          type: 'purchase',
          razorpay_order_id,
          razorpay_payment_id
        })
    } catch (e) {
      console.log('Transaction log skipped (table may not exist)')
    }

    return NextResponse.json({ success: true, coins_added: coins })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment', details: String(error) },
      { status: 500 }
    )
  }
}
