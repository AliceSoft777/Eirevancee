import { getHomePageData } from "@/lib/loaders"
import SearchPageClient from "./SearchPageClient"

export const dynamic = 'force-dynamic'

/**
 * Search Page - Server Component
 * Uses the same data loading pattern as home page for layout consistency
 */
export default async function SearchPage() {
    const { 
        session, 
        categories, 
        products, 
        cartCount, 
        wishlistCount,
        wishlist 
    } = await getHomePageData()

    return (
        <SearchPageClient
            session={session}
            categories={categories}
            products={products}
            cartCount={cartCount}
            wishlistCount={wishlistCount}
        />
    )
}
