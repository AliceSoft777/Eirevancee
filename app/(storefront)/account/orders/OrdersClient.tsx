"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { Package, ArrowLeft } from "lucide-react"
import { useOrders } from "@/hooks/useOrders"
import { useOrderDetails } from "@/context/OrderDetailsContext"
import { useMemo } from "react"
import * as React from "react"
import { formatPrice } from "@/lib/utils"
import { formatOrderDate } from "@/lib/order-utils"
import { StatusBadge } from "@/components/admin/StatusBadge"
import type { ServerSession } from "@/lib/loaders"

interface OrdersClientProps {
    session: ServerSession
}

export default function OrdersClient({ session }: OrdersClientProps) {
    const { orders, isLoading } = useOrders(session.userId)
    const { openOrderDetails } = useOrderDetails()

    // ✅ DIAGNOSTIC: Log session info
    React.useEffect(() => {
        console.log('[OrdersClient] 🔍 Session Info:')
        console.log('  • userId:', session.userId)
        console.log('  • userName:', session.userName)
        console.log('  • userEmail:', session.userEmail)
        console.log('[OrdersClient] 📊 Orders state:', { ordersCount: orders.length, isLoading })
    }, [session, orders.length, isLoading])

    const userOrders = useMemo(() => {
        return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [orders])

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-tm-bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        )
    }

    if (userOrders.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-tm-border">
                <Package className="h-16 w-16 mx-auto mb-4 text-tm-text-muted opacity-50" />
                <h2 className="text-xl font-bold text-tm-text mb-2">No orders yet</h2>
                <p className="text-tm-text-muted mb-6">You haven&apos;t placed any orders yet.</p>
                <Button asChild>
                    <Link href="/tiles">Start Shopping</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" size="sm" asChild className="h-10 px-4 rounded-full neu-raised hover:neu-inset bg-[#E5E9F0] text-slate-600 hover:text-primary transition-all">
                    <Link href="/account" className="flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 border border-white/20">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{userOrders.length} Orders</span>
                </div>
            </div>

            <div className="space-y-8">
                {userOrders.map((order) => (
                    <Card key={order.id} className="border-none neu-raised bg-[#E5E9F0] rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:scale-[1.01]">
                        <CardHeader className="bg-white/30 pb-4 border-b border-white/10 px-8 py-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 items-center">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Order Placed</p>
                                    <p className="font-bold text-slate-800">{formatOrderDate(order.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Order ID</p>
                                    <p className="font-bold text-slate-600 text-sm">#{order.orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                    <p className="font-bold text-primary text-lg">{formatPrice(order.total)}</p>
                                </div>
                                <div className="lg:text-right">
                                    <StatusBadge status={order.status} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 py-8">
                            <div className="space-y-6">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-white/40 flex items-center justify-center neu-inset border-none">
                                                <Package className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 group-hover:text-primary transition-colors">{item.productName || `Product ID: ${item.productId}`}</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Quantity: {item.quantity} × {formatPrice(item.unitPrice)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800">{formatPrice(item.unitPrice * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-white/20 px-8 py-6 flex justify-between items-center border-t border-white/10">
                            <p className="text-xs font-bold text-slate-500 italic">Thank you for shopping with Celtic Tiles</p>
                            <Button
                                onClick={() => openOrderDetails(order)}
                                variant="outline"
                                size="sm"
                                className="h-10 px-6 rounded-full neu-raised hover:neu-inset bg-[#E5E9F0] border-none font-bold text-primary"
                            >
                                View Details
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
