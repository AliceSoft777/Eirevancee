import CheckoutClient from './CheckoutClient'
import { getServerSession } from '@/lib/loaders'
import { createServerSupabase } from '@/lib/supabase/server'
import type { UserAddress } from '@/hooks/useAddresses'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
    const session = await getServerSession()
    const isLoggedIn = !!session.userId

    let initialAddresses: UserAddress[] = []
    let initialProfile: { full_name: string | null; phone: string | null } | null = null

    if (session.userId) {
        const supabase = await createServerSupabase()

        // Fetch saved addresses server-side (bypasses browser auth timing + RLS)
        const { data: addressData } = await supabase
            .from('customer_addresses' as any)
            .select('*')
            .eq('user_id', session.userId)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })

        if (addressData) {
            // Deduplicate by street+city+pincode (keep newest)
            const seen = new Set<string>()
            initialAddresses = (addressData as UserAddress[]).filter(addr => {
                const key = `${addr.street.toLowerCase().trim()}|${addr.city.toLowerCase().trim()}|${addr.pincode.toLowerCase().trim()}`
                if (seen.has(key)) return false
                seen.add(key)
                return true
            })
        }

        // Fetch profile for billing pre-fill
        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', session.userId)
            .single()

        if (profileData) {
            initialProfile = {
                full_name: (profileData as any).full_name ?? null,
                phone: (profileData as any).phone ?? null,
            }
        }
    }

    return (
        <main className="bg-background min-h-screen">
            <div className="container mx-auto max-w-[1400px] px-4 py-12">
                <CheckoutClient
                    isLoggedIn={isLoggedIn}
                    userRole={session.userRole}
                    initialAddresses={initialAddresses}
                    initialProfile={initialProfile}
                    userId={session.userId ?? null}
                />
            </div>
        </main>
    )
}
