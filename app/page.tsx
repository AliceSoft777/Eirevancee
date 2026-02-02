import { getHomePageData } from "@/lib/loaders"
import HomeClient from "./HomeClient"

export const dynamic = 'force-dynamic'

/**
 * Home Page - Server Component
 * Fetches all data server-side and passes to client components via props.
 * No client-side mount fetches for initial data.
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
            categories={categories}
            products={products}
            cartCount={cartCount}
            wishlistCount={wishlistCount}
            wishlistProductIds={wishlist.map(w => w.product_id)}
        />
    )
}
