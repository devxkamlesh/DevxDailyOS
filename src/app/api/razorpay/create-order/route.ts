import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!

export async function POST(request: Request) {
  try {
    const { amount, currency, receipt, notes } = await request.json()

    // Validate user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Validate input
    if (!amount || !currency || !receipt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Create Razorpay order
    const orderData = {
      amount: Math.round(amount), // Amount in paise
      currency: currency || 'INR',
      receipt: receipt,
      notes: {
        user_id: user.id,
        user_email: user.email,
        ...notes
      }
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify(orderData)
    })

    const order = await response.json()

    if (!response.ok) {
      console.error('Razorpay order creation failed:', order)
      return NextResponse.json({ 
        success: false, 
        error: order.error?.description || 'Failed to create order' 
      }, { status: 400 })
    }

    // Store order in database for verification
    await supabase.from('payment_orders').insert({
      order_id: order.id,
      user_id: user.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: 'created',
      notes: order.notes,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    })

  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}