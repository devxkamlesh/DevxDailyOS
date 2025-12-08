import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

// Initialize Razorpay - Add your keys in .env.local
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, package_id, coins } = await request.json()

    // Validate input
    if (!amount || !currency || !package_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      // Return demo response for testing
      return NextResponse.json({
        id: null,
        demo: true,
        message: 'Razorpay not configured. Running in demo mode.'
      })
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount, // Amount in paise
      currency: currency,
      receipt: `order_${package_id}_${Date.now()}`,
      notes: {
        package_id,
        coins
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
