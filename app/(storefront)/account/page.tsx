import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/loaders"
import { createServerSupabase } from "@/lib/supabase/server"
import AccountClient from "./AccountClient"

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
    const session = await getServerSession()

    // Not logged in - redirect to login
    if (!session.userId) {
        redirect("/login")
    }

    // Fetch full profile data server-side
    const supabase = await createServerSupabase()
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', session.userId)
        .single()

    return (
        <AccountClient
            session={session}
            initialFullName={(profile as any)?.full_name ?? session.userName ?? ''}
            initialPhone={(profile as any)?.phone ?? ''}
        />
    )
}
