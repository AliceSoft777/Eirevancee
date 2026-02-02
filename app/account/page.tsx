import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"
import { getServerSession, getNavData } from "@/lib/loaders"
import AccountClient from "./AccountClient"

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
    const [session, { categories }] = await Promise.all([
        getServerSession(),
        getNavData()
    ])

    // Not logged in - redirect to login
    if (!session.userId) {
        redirect("/login")
    }

    return (
        <AccountClient session={session} />
    )
}
