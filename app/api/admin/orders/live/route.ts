import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/loaders"
import { createServerSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session.userId || (session.userRole !== "admin" && session.userRole !== "sales")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[api/admin/orders/live] query failed", {
        code: error.code,
        message: error.message,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.info("[api/admin/orders/live] success", {
      role: session.userRole,
      count: data?.length ?? 0,
    })

    return NextResponse.json({ orders: data ?? [] }, { status: 200 })
  } catch (err) {
    console.error("[api/admin/orders/live] unexpected failure", err)
    return NextResponse.json({ error: "Failed to load admin orders" }, { status: 500 })
  }
}
