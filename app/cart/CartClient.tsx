"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { formatPrice } from '@/lib/utils'

interface CartItem {
    id: string
    product_id: string
    variant_id: string | null
    product_name: string
    product_price: number
    product_image: string | null
    quantity: number
}

interface CartClientProps {
    initialCart: CartItem[]
    isLoggedIn: boolean
}

export default function CartClient({ initialCart, isLoggedIn }: CartClientProps) {
    const total = useMemo(
        () => initialCart.reduce((sum, item) => sum + item.product_price * item.quantity, 0),
        [initialCart]
    )

    if (!isLoggedIn) {
        return (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <h2 className="text-xl font-semibold text-primary mb-2">Sign in to view your cart</h2>
                <p className="text-muted-foreground mb-6">Please log in to see items saved in your cart.</p>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                    Sign In
                </Link>
            </div>
        )
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
                {initialCart.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center">
                        <h2 className="text-xl font-semibold text-primary mb-2">Your cart is empty</h2>
                        <p className="text-muted-foreground mb-6">Browse products and add items to your cart.</p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    initialCart.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                            <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted">
                                {item.product_image ? (
                                    <Image
                                        src={item.product_image}
                                        alt={item.product_name}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                ) : null}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-primary">{item.product_name}</h3>
                                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right font-semibold text-primary">
                                {formatPrice(item.product_price * item.quantity)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {initialCart.length > 0 && (
                <aside className="rounded-lg border border-border bg-card p-6 h-fit">
                    <h2 className="text-lg font-semibold text-primary mb-4">Order Summary</h2>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span>Items</span>
                        <span>{initialCart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-primary mb-6">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <Link
                        href="/checkout"
                        className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                        Proceed to Checkout
                    </Link>
                </aside>
            )}
        </div>
    )
}
