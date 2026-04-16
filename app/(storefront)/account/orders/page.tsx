import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/loaders"
import { createServerSupabase } from "@/lib/supabase/server"
import OrdersClient from "./OrdersClient"
import { OrderDetailsProvider } from "@/context/OrderDetailsContext"
import dynamic from "next/dynamic"
import { Suspense } from "react"

const OrderDetailsModal = dynamic(
  () => import("@/components/account/OrderDetailsModal").then((m) => ({ default: m.OrderDetailsModal }))
)

export default async function OrdersPage() {
    const session = await getServerSession()

    if (!session.userId) {
        redirect("/login")
    }

    // Fetch orders server-side — no client hook needed
    const supabase = await createServerSupabase()
    const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at, items, invoice_file_id")
        .eq("customer_id", session.userId)
        .order("created_at", { ascending: false })

    return (
        <OrderDetailsProvider isAdmin={false}>
            <OrdersClient orders={orders ?? []} />
            <Suspense fallback={null}>
              <OrderDetailsModal />
            </Suspense>
        </OrderDetailsProvider>
    )
}
