import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { sendOrderStatusEmail } from '@/lib/email'

/**
 * POST /api/orders/confirm
 * Single endpoint to send "Order Placed" confirmation email.
 * Called once from the ConfirmOrderEmail client component on the success page.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderNumber } = await request.json()

    if (!orderNumber) {
      return NextResponse.json({ error: 'Missing orderNumber' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Fetch order details needed for the email
    const { data: order, error: fetchError } = await (supabase as any)
      .from('orders')
      .select('order_number, total, customer_name, customer_email')
      .eq('order_number', orderNumber)
      .single()

    if (fetchError || !order) {
      console.error('[confirm] Order fetch error:', fetchError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.customer_email) {
      return NextResponse.json({ error: 'No customer email' }, { status: 400 })
    }

    // Send confirmation email
    try {
      await sendOrderStatusEmail({
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        orderNumber: order.order_number,
        status: 'Placed',
        total: order.total,
      })
      return NextResponse.json({ success: true, sent: true })
    } catch (emailErr) {
      console.error('[confirm] Email send failed:', emailErr)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }
  } catch (err: any) {
    console.error('[confirm] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
