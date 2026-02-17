import { notFound, redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase/server"
import { getServerSession, getNavData } from "@/lib/loaders"
import OrderDetailsClient from "./OrderDetailsClient"
import type { Order } from "@/lib/supabase-types"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params
  
  // 1. Get Session
  const session = await getServerSession()
  if (!session.userId) {
    redirect("/login")
  }

  // 2. Fetch Data in Parallel
  const [supabase, { categories }] = await Promise.all([
    createServerSupabase(),
    getNavData()
  ])

  // 3. Fetch Order
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single()

  // 4. Security & Existence Checks
  if (error || !order) {
    notFound()
  }

  const typedOrder = order as Order

  // Verify Ownership: Check user_id first, then fallback to email (as per user instruction)
  const isOwner = typedOrder.user_id === session.userId || typedOrder.customer_email === session.userEmail

  if (!isOwner) {
    // Ownership mismatch: notFound() to prevent leaking order existence (security best practice)
    notFound()
  }

  return (
    <OrderDetailsClient 
      order={typedOrder} 
      session={session} 
      categories={categories} 
    />
  )
}
