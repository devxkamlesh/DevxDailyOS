import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, coins } = body

    console.log('Verify payment:', { razorpay_order_id, razorpay_payment_id, user_id, coins })

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id || !coins) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify Razorpay signature
    const secret = process.env.RAZORPAY_KEY_SECRET || ''
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch:', { expected: expectedSignature, received: razorpay_signature })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Create Supabase client with service role for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('Using service role:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get current coins
    const { data: currentRewards, error: fetchError } = await supabase
      .from('user_rewards')
      .select('coins')
      .eq('user_id', user_id)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      // Try to create the record if it doesn't exist
      if (fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_rewards')
          .insert({ user_id, coins })
        
        if (insertError) {
          console.error('Insert error:', insertError)
          return NextResponse.json({ error: 'Failed to create rewards', details: insertError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, coins_added: coins })
      }
      return NextResponse.json({ error: 'Failed to fetch rewards', details: fetchError.message }, { status: 500 })
    }

    const newCoins = (currentRewards?.coins || 0) + coins
    console.log('Updating coins:', currentRewards?.coins, '+', coins, '=', newCoins)

    // Update coins
    const { error: updateError } = await supabase
      .from('user_rewards')
      .update({ coins: newCoins })
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update coins', details: updateError.message }, { status: 500 })
    }

    console.log('Payment verified and coins added successfully!')
    return NextResponse.json({ success: true, coins_added: coins, new_balance: newCoins })
  } catch (error: any) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 })
  }
}
