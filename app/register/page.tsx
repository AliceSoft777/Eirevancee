import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/layout/site-header"
import { getServerSession, getNavData } from "@/lib/loaders"
import RegisterClient from "./RegisterClient"

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
    const [session, { categories }] = await Promise.all([
        getServerSession(),
        getNavData()
    ])

    // Already logged in - redirect to home
    if (session.userId) {
        redirect("/")
    }

    return (
        <>
            <SiteHeader session={session} categories={categories} />
            <main className="bg-background min-h-screen">
                <div className="container mx-auto max-w-[1400px] px-4 py-12">
                    <RegisterClient />
                </div>
            </main>
        </>
    )
}
