'use client'

import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Database } from "@/lib/supabase-types"

interface Order {
  order_number: string
  total: number
  payment_method: string
  created_at: string
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!orderId) {
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('order_number, total, payment_method, created_at')
          .eq('id', orderId)
          .single()

        if (error) {
          console.error('Error fetching order:', error)
          setLoading(false)
          return
        }

        setOrder(data as Order)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const formatPrice = (price: number | string) => {
    const num = typeof price === 'string' ? parseFloat(price) : price
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(num)
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-card-hover p-8 text-center animate-fade-in">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <CheckCircle className="h-24 w-24 text-success animate-scale-in" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-success/10 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground mb-8">
          Thank you for your order. Your payment has been processed successfully.
        </p>

        {/* Order Details */}
        <div className="bg-neutral-light rounded-md p-6 mb-8 text-left">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Order Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order Number:</span>
              <span className="text-sm font-semibold text-foreground">
                {order?.order_number || `#TM-${Date.now().toString().slice(-6)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date:</span>
              <span className="text-sm font-semibold text-foreground">
                {order?.created_at
                  ? new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : new Date().toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment Method:</span>
              <span className="text-sm font-semibold text-foreground">
                {order?.payment_method === 'card' ? 'Card ending in ****' : 'Offline Payment'}
              </span>
            </div>
            <div className="h-px bg-border my-2"></div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total Paid:</span>
              <span className="text-lg font-bold text-primary">
                {loading ? '...' : formatPrice(order?.total || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Confirmation Email Notice
        <p className="text-sm text-muted-foreground mb-6">
          A confirmation email has been sent to your registered email address.
        </p> */}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button asChild variant="default" size="lg" className="w-full">
            <Link href="/">
              Continue Shopping
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full text-foreground hover:text-foreground">
            <Link href="/account/orders">
              View Order Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ✅ NEW: Suspense fallback for useSearchParams
function PaymentSuccessFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Loading...</p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
