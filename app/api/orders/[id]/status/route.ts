import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { getServerSession } from "@/lib/loaders"
import { sendOrderStatusEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, status_history } = body

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    // Get session
    const session = await getServerSession()
    if (!session?.userId || session.userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Build update payload
    const supabase = await createServerSupabase()
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Include status_history if provided by the client
    if (status_history) {
      updatePayload.status_history = status_history
    }

    // Update order status (and history if provided)
    const { error } = await (supabase as any)
      .from("orders")
      .update(updatePayload)
      .eq("id", id)

    if (error) {
      console.error("[API] Status update error:", error)
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      )
    }

    // ✅ Send status update email to customer
    try {
      const { data: order } = await (supabase as any)
        .from("orders")
        .select("customer_name, customer_email, order_number, total")
        .eq("id", id)
        .single()

      if (order?.customer_email) {
        sendOrderStatusEmail({
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          orderNumber: order.order_number,
          status,
          total: order.total,
        }).catch((err) =>
          console.error("[API] Status email failed (non-blocking):", err)
        )
      }
    } catch (emailErr) {
      console.error("[API] Email trigger error (non-blocking):", emailErr)
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

