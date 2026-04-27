import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { getServerSession } from "@/lib/loaders"

export async function POST(req: Request) {
  try {
    // 1. AUTH
    const session = await getServerSession()
    if (!session || (session.userRole !== "admin" && session.userRole !== "sales" && session.userRole !== "inventory")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. READ BODY
    const { items } = await req.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 })
    }

    // 3. SPLIT: items that are linked (have product_id) vs unknown (no product_id)
    const linkedItems = items.filter(
      (item: { product_id: string | null }) => !!item.product_id
    )
    const unknownItems = items.filter(
      (item: { product_id: string | null }) => !item.product_id
    )

    // 4. VALIDATE linked items
    for (const item of linkedItems) {
      const receivedQty = item.received_qty ?? 0
      if (!item.product_id || receivedQty <= 0) {
        return NextResponse.json(
          { error: "Each linked item must have product_id and received quantity > 0" },
          { status: 400 }
        )
      }
    }

    const supabase = await createServerSupabase()

    // 5. UPDATE STOCK for linked items (using received_qty)
    for (const item of linkedItems) {
      const receivedQty = item.received_qty ?? 0

      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single()

      if (fetchError || !product) {
        return NextResponse.json(
          { error: `Product not found: ${item.product_id}` },
          { status: 400 }
        )
      }

      const newStock = (product.stock || 0) + receivedQty

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.product_id)

      if (updateError) {
        return NextResponse.json(
          { error: `Stock update failed for ${item.product_id}` },
          { status: 500 }
        )
      }
    }

    // 6. BUILD CANONICAL ITEMS for the log
    const logItems = [
      ...linkedItems.map((item: {
        product_id: string
        name: string
        sku?: string | null
        expected_qty?: number
        received_qty?: number
      }) => ({
        product_id: item.product_id,
        name: item.name,
        sku: item.sku ?? null,
        expected_qty: item.expected_qty ?? item.received_qty ?? 0,
        received_qty: item.received_qty ?? 0,
        discrepancy: (item.received_qty ?? 0) - (item.expected_qty ?? item.received_qty ?? 0),
      })),
      ...unknownItems.map((item: {
        name: string
        expected_qty?: number
        received_qty?: number
      }) => ({
        product_id: null,
        name: item.name,
        expected_qty: item.expected_qty ?? 0,
        received_qty: item.received_qty ?? 0,
        discrepancy: null,
        note: "Unknown product — not linked. Stock not updated.",
      })),
    ]

    // 7. INSERT GRN LOG
    const { error: logError } = await supabase.from("grn_logs").insert([
      {
        created_by: session.userId,
        items: logItems,
        total_items: logItems.length,
      },
    ])

    if (logError) {
      return NextResponse.json(
        { error: "Failed to store GRN log" },
        { status: 500 }
      )
    }

    // 8. SUCCESS — inform caller how many were processed vs unknown
    return NextResponse.json({
      success: true,
      processed: linkedItems.length,
      unknown: unknownItems.length,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}