    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let orderId: string | undefined

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        orderId = session.metadata?.orderId

        if (orderId) {
          // Update order status
          const { data: orderData, error: orderError } = await supabaseClient
            .from('orders')
            .update({
              payment_status: 'Paid',
              status: 'Processing',
              stripe_session_id: session.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
            .select('items, user_id')
            .single()

          if (!orderError && orderData) {
            const userId = (orderData as any).user_id
            const items = orderData.items as Array<{product_id: string, quantity: number}>
            
            // Reduce stock for each item
            for (const item of items) {
              // Get current stock
              const { data: product } = await supabaseClient
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single()

              if (product) {
                const newStock = Math.max(0, (product as any).stock - item.quantity)
                
                // Update stock
                await supabaseClient
                  .from('products')
                  .update({ stock: newStock })
                  .eq('id', item.product_id)
              }
            }
            
            console.log('✅ Stock reduced for order:', orderId)
            
            // ✅ SECURITY: Clear cart ONLY after successful payment
            if (userId) {
              const { error: cartError } = await supabaseClient
                .from('cart_items')
                .delete()
                .eq('user_id', userId)
              
              if (cartError) {
                console.error('❌ Cart clearing failed:', cartError)
              } else {
                console.log('✅ Cart cleared for user:', userId)
              }
            }
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        orderId = paymentIntent.metadata?.orderId

        if (orderId) {
          await supabaseClient
            .from('orders')
            .update({
              payment_status: 'Paid',
              status: 'Processing',
              stripe_payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        orderId = paymentIntent.metadata?.orderId

        if (orderId) {
          await supabaseClient
            .from('orders')
            .update({
              payment_status: 'Failed',
              status: 'Cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
        }
        break
      }

      case 'checkout.session.expired': {
        // ✅ SECURITY: Clean up abandoned orders when user closes/cancels Stripe page
        const session = event.data.object as Stripe.Checkout.Session
        orderId = session.metadata?.orderId

        if (orderId) {
          await supabaseClient
            .from('orders')
            .update({
              payment_status: 'Cancelled',
              status: 'Cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
          
          console.log('✅ Abandoned order marked cancelled:', orderId)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
