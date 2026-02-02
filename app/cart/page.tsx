import CartClient from './CartClient'
import { SiteHeader } from '@/components/layout/site-header'
import { Footer } from '@/components/layout/footer'
import { getCartForUser } from '@/lib/cart/server'
import { getServerSession, getNavData } from '@/lib/loaders'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
    const [{ cart, isLoggedIn }, session, { categories }] = await Promise.all([
        getCartForUser(),
        getServerSession(),
        getNavData()
    ])

    return (
        <>
            <SiteHeader 
                session={session} 
                categories={categories}
                initialCartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            />

            <main className="bg-background min-h-screen">
                <div className="container mx-auto max-w-[1400px] px-4 py-12">
                    <div className="mb-8 border-b border-border pb-4">
                        <h1 className="text-3xl font-serif font-bold text-primary mb-2">Shopping Cart</h1>
                        <p className="text-muted-foreground">{cart.reduce((sum, item) => sum + item.quantity, 0)} items in your cart</p>
                    </div>

                    <CartClient initialCart={cart} isLoggedIn={isLoggedIn} />
                </div>
            </main>

            <Footer />
        </>
    )
}
