import { getServerSession, getNavData, getNavProducts, getCartData, getWishlistData } from "@/lib/loaders"
import { SiteHeader } from "./site-header"

/**
 * Server Component wrapper for SiteHeader.
 * Fetches all header-required data on the server and passes props to client SiteHeader.
 * Uses getNavProducts() (lightweight) instead of getProducts() (full catalog).
 */
export async function HeaderServerWrapper() {
  const [session, { categories }, { products: navProducts }] = await Promise.all([
    getServerSession(),
    getNavData(),
    getNavProducts()
  ])

  // Cart and wishlist depend on session, so fetch after
  const [{ cartCount }, { wishlistCount }] = await Promise.all([
    getCartData(session.userId),
    getWishlistData(session.userId)
  ])

  return (
    <SiteHeader
      session={session}
      categories={categories}
      products={navProducts}
      initialCartCount={cartCount}
      initialWishlistCount={wishlistCount}
    />
  )
}
