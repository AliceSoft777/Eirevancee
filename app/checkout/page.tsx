import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"
import { getServerSession, getNavData } from "@/lib/loaders"
import CheckoutClient from "./CheckoutClient"

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
    const [session, { categories }] = await Promise.all([
        getServerSession(),
        getNavData()
    ])

    const isLoggedIn = !!session.userId

    return (
        <>
            <SiteHeader session={session} categories={categories} />
            <main className="bg-background min-h-screen py-12">
                <div className="container mx-auto max-w-[1400px] px-4">
                    <CheckoutClient isLoggedIn={isLoggedIn} />
                </div>
            </main>
            <Footer />
        </>
    )
}
