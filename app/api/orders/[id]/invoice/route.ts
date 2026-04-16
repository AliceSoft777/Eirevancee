import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { getServerSession } from "@/lib/loaders"

type InvoiceRow = {
  id: string
  user_id: string | null
  customer_id: string
  invoice_file_id: string | null
  order_number: string
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from("orders")
      .select("id, user_id, customer_id, invoice_file_id, order_number")
      .eq("id", id)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = data as InvoiceRow
    const isStaff = session.userRole === "admin" || session.userRole === "sales"
    const isOwner = order.user_id === session.userId || order.customer_id === session.userId
    if (!isStaff && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!order.invoice_file_id) {
      return NextResponse.json({ error: "Invoice not available" }, { status: 404 })
    }

    const signed = await supabase.storage
      .from("uploads")
      .createSignedUrl(order.invoice_file_id, 60 * 15)

    if (signed.error || !signed.data?.signedUrl) {
      const publicData = supabase.storage
        .from("uploads")
        .getPublicUrl(order.invoice_file_id)

      return NextResponse.json({
        url: publicData.data.publicUrl,
        fileName: `${order.order_number}.pdf`,
      })
    }

    return NextResponse.json({
      url: signed.data.signedUrl,
      fileName: `${order.order_number}.pdf`,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}
