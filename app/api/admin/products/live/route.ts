import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { getServerSession } from "@/lib/loaders"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session.userId || (session.userRole !== "admin" && session.userRole !== "sales")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from("products")
      .select("*, categories!category_id(name, parent_id, categories!parent_id(name)), product_images!left(id, image_url, is_primary, display_order)")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: data ?? [] })
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
