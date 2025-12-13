import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!

export async function POST(request: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      package_id,
      coins,
      bonus
    } = await request.json()

    // Validate user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid payment signature' 
      }, { status: 400 })
    }

    // Check if order exists and belongs to user
    const { data: orderData, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !orderData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 })
    }

    // Check if payment already processed
    const { data: existingPayment } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('payment_id', razorpay_payment_id)
      .single()

    if (existingPayment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment already processed' 
      }, { status: 400 })
    }

    // Record the payment transaction
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        user_id: user.id,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'completed',
        package_id: package_id,
        coins_purchased: coins,
        bonus_coins: bonus,
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Transaction recording error:', transactionError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to record transaction' 
      }, { status: 500 })
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

    // Add coins to user account
    const totalCoins = coins + bonus
    const { error: coinsError } = await supabase.rpc('add_user_coins', {
      p_user_id: user.id,
      p_coins: totalCoins
    })

    if (coinsError) {
      console.error('Coins addition error:', coinsError)
      // Even if coins addition fails, payment was successful
      // This should be handled by admin or retry mechanism
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      coins_added: totalCoins
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}