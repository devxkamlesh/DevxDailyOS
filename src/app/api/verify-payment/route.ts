import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, coins } = body

    console.log('Verify payment:', { razorpay_order_id, razorpay_payment_id, coins })

    // Enhanced input validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !coins) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate input types and ranges
    if (typeof razorpay_order_id !== 'string' || typeof razorpay_payment_id !== 'string' || 
        typeof razorpay_signature !== 'string' || typeof coins !== 'number') {
      return NextResponse.json({ error: 'Invalid field types' }, { status: 400 })
    }

    if (coins <= 0 || coins > 100000) { // Reasonable limits
      return NextResponse.json({ error: 'Invalid coin amount' }, { status: 400 })
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

    // Create secure Supabase client with proper authentication
    const supabase = await createClient()
    
    // Verify user authentication - CRITICAL SECURITY CHECK
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user:', user.id)

    // Verify the payment order exists and belongs to the authenticated user
    const { data: orderData, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !orderData) {
      console.error('Order verification failed:', orderError)
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 })
    }

    // Check if payment already processed to prevent double-processing
    const { data: existingPayment } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('payment_id', razorpay_payment_id)
      .single()

    if (existingPayment) {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
    }

    // Record the payment transaction first
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        user_id: user.id,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'completed',
        coins_purchased: coins,
        bonus_coins: 0,
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Transaction recording error:', transactionError)
      return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 })
    }

    // Update order status
    await supabase
      .from('payment_orders')
      .update({ 
        status: 'paid',
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', razorpay_order_id)

    // Use the secure RPC function to add coins with proper tracking
    const { data: coinsResult, error: coinsError } = await supabase.rpc('add_user_coins_safe', {
      p_user_id: user.id,
      p_coins: coins,
      p_reason: `Payment: ${razorpay_payment_id}`
    })

    if (coinsError) {
      console.error('Coins addition error:', coinsError)
      return NextResponse.json({ error: 'Failed to add coins', details: coinsError.message }, { status: 500 })
    }

    // Check if the safe function returned an error
    if (coinsResult && !coinsResult.success) {
      console.error('Coins addition failed:', coinsResult)
      return NextResponse.json({ error: coinsResult.message || 'Failed to add coins' }, { status: 500 })
    }

    console.log('Payment verified and coins added successfully!')
    
    // Get updated balance for response
    const { data: updatedRewards } = await supabase
      .from('user_rewards')
      .select('coins')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ 
      success: true, 
      coins_added: coins, 
      new_balance: updatedRewards?.coins || 0,
      message: 'Payment verified and coins added successfully'
    })
  } catch (error: any) {
    console.error('Verify payment error:', error)
    // Don't expose internal error details to client for security
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
