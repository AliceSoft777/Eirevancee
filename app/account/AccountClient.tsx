"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { User, Package, Heart, MapPin, CreditCard, Bell, LogOut, Clock, Star } from "lucide-react"
import { useStore } from "@/hooks/useStore"
import { useOrders } from "@/hooks/useOrders"
import { useWishlist } from "@/hooks/useWishlist"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { formatPrice } from "@/lib/utils"
import { formatOrderDate } from "@/lib/order-utils"
import { StatusBadge } from "@/components/admin/StatusBadge"
import type { ServerSession } from "@/lib/loaders"

interface AccountClientProps {
    session: ServerSession
}

export default function AccountClient({ session }: AccountClientProps) {
    const { logout } = useStore()
    const router = useRouter()
    const { orders, isLoading: ordersLoading } = useOrders(session.userId)
    const { wishlistItems, isLoading: wishlistLoading } = useWishlist()

    // Filter orders for current user
    const userOrders = useMemo(() => {
        if (!session.userEmail) return []
        return orders.filter(o => o.customerEmail === session.userEmail)
    }, [orders, session.userEmail])

    // Get recent 3 orders
    const recentOrders = useMemo(() => {
        return userOrders
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
    }, [userOrders])

    const isLoading = ordersLoading || wishlistLoading

    return (
        <div className="space-y-10">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Total Orders */}
                <Card className="border-none neu-raised bg-[#E5E9F0] rounded-[2rem] overflow-hidden transition-all hover:scale-[1.02]">
                    <CardHeader className="pb-2 px-8 pt-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Package className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Orders</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        {isLoading ? (
                            <div className="h-10 w-24 bg-white/20 animate-pulse rounded-lg" />
                        ) : (
                            <p className="text-4xl font-bold text-slate-800">{userOrders.length}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Wishlist Items */}
                <Card className="border-none neu-raised bg-[#E5E9F0] rounded-[2rem] overflow-hidden transition-all hover:scale-[1.02]">
                    <CardHeader className="pb-2 px-8 pt-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <Heart className="h-4 w-4 text-red-500" />
                            </div>
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wishlist Items</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        {wishlistLoading ? (
                            <div className="h-10 w-24 bg-white/20 animate-pulse rounded-lg" />
                        ) : (
                            <p className="text-4xl font-bold text-slate-800">{wishlistItems.length}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Loyalty Points */}
                <Card className="border-none neu-raised bg-[#E5E9F0] rounded-[2rem] overflow-hidden transition-all hover:scale-[1.02]">
                    <CardHeader className="pb-2 px-8 pt-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Star className="h-4 w-4 text-amber-500" />
                            </div>
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loyalty Points</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-slate-400 italic">Coming Soon</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                {/* Recent Orders */}
                <Card className="border-none neu-raised bg-[#E5E9F0] rounded-[2.5rem] overflow-hidden h-full">
                    <CardHeader className="px-8 pt-8 pb-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold text-slate-800">Recent Orders</CardTitle>
                            <Link href="/account/orders" className="text-xs font-bold text-tm-red hover:underline uppercase tracking-widest">
                                View All
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        {ordersLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 bg-white/20 animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        ) : recentOrders.length > 0 ? (
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-5 neu-inset bg-[#E5E9F0] rounded-2xl transition-transform hover:scale-[1.01]">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-white/40 flex items-center justify-center">
                                                <Package className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">#{order.orderNumber}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {formatOrderDate(order.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary text-sm mb-1">{formatPrice(order.total)}</p>
                                            <StatusBadge status={order.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 neu-inset rounded-2xl bg-[#E5E9F0]/50">
                                <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">No orders yet</p>
                                <Button asChild variant="outline" className="rounded-full px-8 neu-raised bg-[#E5E9F0] border-none text-primary font-bold">
                                    <Link href="/tiles">Start Shopping</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Account Information */}
                <Card className="border-none neu-raised bg-[#E5E9F0] rounded-[2.5rem] overflow-hidden h-full">
                    <CardHeader className="px-8 pt-8 pb-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold text-slate-800">Profile Details</CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 px-4 rounded-full neu-raised hover:neu-inset bg-[#E5E9F0] text-primary font-bold text-[10px] uppercase tracking-widest">Edit</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="space-y-6">
                            <div className="p-5 neu-inset bg-[#E5E9F0] rounded-2xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                                        <p className="font-bold text-slate-800">{session.userName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                                        <p className="font-bold text-slate-800 truncate">{session.userEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                                        <p className="font-bold text-slate-400 italic text-sm">Not provided</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer ID</p>
                                        <p className="font-bold text-slate-600 text-xs truncate">#{session.userId?.split('-')[0] || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/20 border border-white/10">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Bell className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Notifications</p>
                                    <p className="text-[11px] text-slate-500 font-medium">You have no new messages</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
