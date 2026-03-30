import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { getServerSession } from "@/lib/loaders"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getServerSession()

    if (!session.userId || (session.userRole !== "admin" && session.userRole !== "sales")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const status = String(body?.status || "")
    const note = String(body?.note || "")
    const updatedBy = String(body?.updatedBy || session.userName || "admin")

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const { data: currentOrder, error: fetchError } = await (supabase as any)
      .from("orders")
      .select("status_history")
      .eq("id", id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const existingHistory = (((currentOrder as any) || {}).status_history || []) as any[]
    const updatedHistory = [
      ...existingHistory,
      {
        status,
        note,
        timestamp: new Date().toISOString(),
        updated_by: updatedBy,
      },
    ]

    const { error: updateError } = await (supabase as any)
      .from("orders")
      .update({
        status,
        status_history: updatedHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}
