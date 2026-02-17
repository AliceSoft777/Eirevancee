import CartClient from './CartClient'
import { getCartForUser } from '@/lib/cart/server'
import { getServerSession, getWishlistData } from '@/lib/loaders'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
    const [{ cart, isLoggedIn }, session] = await Promise.all([
        getCartForUser(),
        getServerSession()
    ])
    const { wishlistCount } = await getWishlistData(session.userId)

    return (
        <>
            <main className="bg-background min-h-screen">
                <div className="container mx-auto max-w-[1400px] px-4 py-12">
                    <CartClient initialCart={cart} isLoggedIn={isLoggedIn} />
                </div>
            </main>
        </>
    )
}
