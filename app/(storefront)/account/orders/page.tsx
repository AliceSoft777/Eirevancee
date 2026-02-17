import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"
import { getServerSession, getNavData } from "@/lib/loaders"
import OrdersClient from "./OrdersClient"

export const dynamic = 'force-dynamic'
import { OrderDetailsProvider } from "@/context/OrderDetailsContext"
import { OrderDetailsModal } from "@/components/account/OrderDetailsModal"

export default async function OrdersPage() {
    const [session, { categories }] = await Promise.all([
        getServerSession(),
        getNavData()
    ])

    // Not logged in - redirect to login
    if (!session.userId) {
        redirect("/login")
    }

    return (
        <OrderDetailsProvider isAdmin={false}>
            <OrdersClient session={session} />
            <OrderDetailsModal />
        </OrderDetailsProvider>
    )
}
