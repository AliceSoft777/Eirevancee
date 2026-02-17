import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, customerEmail } = await req.json()

    // ✅ Validate amount is in reasonable EUR range for tiles
    if (amount < 10 || amount > 50000) {
      console.error('[Stripe] Invalid amount:', amount)
      return NextResponse.json(
        { error: 'Invalid order amount' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Celtic Tiles Order',
              description: `Order #${orderId}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/order/success?orderId=${orderId}`,
      cancel_url: `${req.headers.get('origin')}/checkout`,
      customer_email: customerEmail,
      locale: 'auto', // Auto-detect customer's locale
      billing_address_collection: 'required',
      // ✅ Explicitly set shipping to Ireland only
      shipping_address_collection: {
        allowed_countries: ['IE'], // Only Ireland
      },
      metadata: {
        orderId: orderId,
      },
    })

    console.log('[Stripe] Session created:', {
      sessionId: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      locale: session.locale
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Stripe session creation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
