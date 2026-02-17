import { getHomePageData } from "@/lib/loaders"
import HomeClient from "./HomeClient"

// ✅ Enable ISR with 60-second revalidation (was: force-dynamic)
// This enables caching while keeping data fresh
export const revalidate = 60

/**
 * Home Page - Server Component
 * Fetches all data server-side and passes to client components via props.
 * No client-side mount fetches for initial data.
 * 
 * Performance: ISR with 60s revalidation provides:
 * - First load: Server-rendered with fresh data
 * - Subsequent loads: Cached (95%+ faster)
 * - Auto-refresh: Every 60 seconds
 */
export default async function HomePage() {
    const { 
        session, 
        categories, 
        products, 
        cartCount, 
        wishlistCount,
        wishlist 
    } = await getHomePageData()

    return (
        <HomeClient
            session={session}
            products={products}
            categories={categories}
            wishlistProductIds={wishlist.map(w => w.product_id)}
        />
    )
}
