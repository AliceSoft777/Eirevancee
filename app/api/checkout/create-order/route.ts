import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase } from "@/lib/supabase/server"
import { getServerSession } from "@/lib/loaders"
import {
  buildSecureCheckoutSnapshot,
  deductStockForOrderItems,
  generateSecureOrderNumber,
  incrementCouponUsage,
} from "@/lib/secure-checkout"
import type { Database } from "@/supabase/database.types"

type PaymentMethod = "card" | "offline_cash"

interface CreateOrderRequestBody {
  stripeSessionId?: string
  paymentMethod?: PaymentMethod
  couponCode?: string | null
  customer?: {
    full_name?: string
    email?: string
    phone?: string
  }
  deliveryAddress?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
}

type DeliveryAddress = {
  street: string
  city: string
  state: string
  pincode: string
  country: string
}

type StatusHistoryEntry = {
  status: string
  timestamp: string
  updated_by: string
  note: string
}

type OrderInsertWithStripe = Database["public"]["Tables"]["orders"]["Insert"] & {
  stripe_session_id?: string | null
  status_history: Database["public"]["Tables"]["orders"]["Insert"]["status_history"]
  delivery_address: Database["public"]["Tables"]["orders"]["Insert"]["delivery_address"]
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

function parseBody(body: unknown): CreateOrderRequestBody {
  if (!body || typeof body !== "object") return {}
  return body as CreateOrderRequestBody
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = parseBody(await request.json().catch(() => null))
    const paymentMethod: PaymentMethod =
      body.paymentMethod === "offline_cash" ? "offline_cash" : "card"
    const stripeSessionId = cleanText(body.stripeSessionId, 255)

    if (paymentMethod === "offline_cash" && session.userRole !== "admin" && session.userRole !== "sales") {
      return NextResponse.json({ error: "Offline payment is staff-only" }, { status: 403 })
    }

    if (paymentMethod === "card" && !stripeSessionId) {
      return NextResponse.json({ error: "Missing Stripe session id" }, { status: 400 })
    }

    const fullName = cleanText(body.customer?.full_name, 120)
    const emailInput = cleanText(body.customer?.email, 160).toLowerCase()
    const phone = cleanText(body.customer?.phone, 40)

    const street = cleanText(body.deliveryAddress?.street, 200)
    const city = cleanText(body.deliveryAddress?.city, 120)
    const state = cleanText(body.deliveryAddress?.state, 120)
    const pincode = cleanText(body.deliveryAddress?.pincode, 40)
    const country = cleanText(body.deliveryAddress?.country, 80) || "Ireland"

    if (!fullName || !phone || !street || !city || !state || !pincode) {
      return NextResponse.json({ error: "Missing required checkout fields" }, { status: 400 })
    }

    const authoritativeEmail = session.userEmail?.toLowerCase() || emailInput
    if (!authoritativeEmail || !EMAIL_REGEX.test(authoritativeEmail)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const snapshot = await buildSecureCheckoutSnapshot(supabase, session.userId, body.couponCode)

    let orderNumber = generateSecureOrderNumber()

    if (paymentMethod === "card") {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY
      if (!stripeSecretKey) {
        return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 })
      }

      const stripe = new Stripe(stripeSecretKey)
      const stripeSession = await stripe.checkout.sessions.retrieve(stripeSessionId)

      const stripeUserId = cleanText(stripeSession.metadata?.userId, 255)
      const stripeOrderNumber = cleanText(stripeSession.metadata?.orderId, 255)
      const stripeAmount = stripeSession.amount_total ?? 0
      const expectedAmount = Math.round(snapshot.total * 100)

      if (!stripeOrderNumber || stripeUserId !== session.userId) {
        return NextResponse.json({ error: "Invalid Stripe session ownership" }, { status: 403 })
      }

      if (stripeAmount !== expectedAmount) {
        return NextResponse.json({ error: "Order total mismatch" }, { status: 400 })
      }

      orderNumber = stripeOrderNumber

      // Cancel older pending card orders for this user so stale sessions do not linger.
      const staleOrderUpdate: Database["public"]["Tables"]["orders"]["Update"] = {
        status: "Cancelled",
        payment_status: "Cancelled",
        updated_at: new Date().toISOString(),
      }

      await supabase
        .from("orders")
        .update(staleOrderUpdate)
        .eq("user_id", session.userId)
        .eq("payment_method", "card")
        .eq("payment_status", "Pending")
        .neq("stripe_session_id", stripeSessionId)
    }

    const statusHistory: StatusHistoryEntry[] = [
      {
        status: "Pending",
        timestamp: new Date().toISOString(),
        updated_by: session.userName || "system",
        note:
          paymentMethod === "offline_cash"
            ? "Cash payment - awaiting store receipt"
            : "Card payment - awaiting verification",
      },
    ]

    const orderPayload: OrderInsertWithStripe = {
      user_id: session.userId,
      customer_id: session.userId,
      customer_name: fullName,
      customer_email: authoritativeEmail,
      customer_phone: phone,
      subtotal: snapshot.subtotal,
      tax: snapshot.tax,
      shipping_fee: snapshot.shipping_fee,
      discount: snapshot.discount,
      coupon_code: snapshot.coupon_code,
      total: snapshot.total,
      status: "Pending",
      payment_method: paymentMethod,
      payment_status: "Pending",
      delivery_address: JSON.parse(
        JSON.stringify({ street, city, state, pincode, country } satisfies DeliveryAddress)
      ) as Database["public"]["Tables"]["orders"]["Insert"]["delivery_address"],
      items: JSON.parse(
        JSON.stringify(snapshot.items)
      ) as Database["public"]["Tables"]["orders"]["Insert"]["items"],
      status_history: JSON.parse(
        JSON.stringify(statusHistory)
      ) as Database["public"]["Tables"]["orders"]["Insert"]["status_history"],
      order_number: orderNumber,
      stripe_session_id: paymentMethod === "card" ? stripeSessionId : null,
      source: "web",
    }

    const { data, error } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("*")
      .single()

    if (error || !data) {
      console.error("[create-order] Insert error:", error)
      return NextResponse.json({ error: error?.message || "Failed to create order" }, { status: 500 })
    }

    if (paymentMethod === "offline_cash") {
      // Offline flow finalizes immediately, so stock deduction happens here on server.
      await deductStockForOrderItems(supabase, snapshot.items)
    }

    await incrementCouponUsage(supabase, snapshot.coupon_code)

    return NextResponse.json({ order: data }, { status: 201 })
  } catch (err: unknown) {
    console.error("[create-order] Unexpected error:", err)
    return NextResponse.json({ error: getErrorMessage(err, "Server error") }, { status: 500 })
  }
}
