import { getServerSession } from "@/lib/loaders"
import { redirect } from "next/navigation"
import OrdersListClient, { OrderListItem } from "./OrdersListClient"
import { createServerSupabase } from "@/lib/supabase/server"

type OrderRow = {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  status: string
  total: string
  created_at: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersListPage() {
  const session = await getServerSession()

  if (!session || session.userRole !== "admin") {
    redirect("/")
  }

  // ✅ Use server-side client (properly authenticated)
  const supabase = await createServerSupabase()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_name,
      customer_email,
      status,
      total,
      created_at
    `)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>()

  console.log('[Admin Orders] Query result:', { ordersCount: orders?.length, error })

  if (error) {
    console.error('[Admin Orders] ❌ Database error:', error)
    throw new Error(`Failed to load orders: ${error.message}`)
  }

  if (!orders || orders.length === 0) {
    console.warn('[Admin Orders] ⚠️ No orders found in database')
  }

  const mappedOrders: OrderListItem[] = (orders ?? []).map(o => ({
    id: o.id,
    orderNumber: o.order_number,
    customerName: o.customer_name,
    customerEmail: o.customer_email,
    status: o.status,
    total: o.total,
    createdAt: o.created_at,
  }))

  return <OrdersListClient orders={mappedOrders} />
}
