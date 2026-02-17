import CartClient from './CartClient'
import { getCartForUser } from '@/lib/cart/server'
import { getServerSession, getWishlistData } from '@/lib/loaders'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
    const [{ cart, isLoggedIn }, session] = await Promise.all([
        getCartForUser(),
        getServerSession()
    ])
    const { wishlistCount } = await getWishlistData(session.userId)

    // Fetch site settings for dynamic tax & shipping
    let siteSettings = { tax_rate: 0, free_shipping_threshold: 500, shipping_fee: 10 }
    try {
        const supabase = await createServerSupabase()
        const { data } = await (supabase as any)
            .from('site_settings')
            .select('tax_rate, free_shipping_threshold')
            .single()
        if (data) {
            siteSettings = {
                tax_rate: data.tax_rate ?? 0,
                free_shipping_threshold: data.free_shipping_threshold ?? 500,
                shipping_fee: 10,
            }
        }
    } catch (err) {
        console.warn('[Cart] Failed to fetch site_settings, using defaults:', err)
    }

    return (
        <>
            <main className="bg-background min-h-screen">
                <div className="container mx-auto max-w-[1400px] px-4 py-12">
                    <CartClient initialCart={cart} isLoggedIn={isLoggedIn} siteSettings={siteSettings} />
                </div>
            </main>
        </>
    )
}
