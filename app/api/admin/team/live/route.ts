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
      .from("profiles")
      .select("id, email, full_name, role_id, permissions, created_at, role:roles(name)")
      .not("role_id", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const teamMembers = (data ?? [])
      .map((member: any) => ({
        id: member.id,
        email: member.email,
        full_name: member.full_name,
        name: member.full_name || "",
        role: member.role?.name || "customer",
        permissions: member.permissions,
        created_at: member.created_at,
      }))
      .filter((member: any) => {
        const role = String(member.role || "").toLowerCase()
        return role === "admin" || role === "sales"
      })

    return NextResponse.json({ teamMembers })
  } catch {
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}
