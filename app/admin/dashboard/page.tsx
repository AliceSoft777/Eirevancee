"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useOrders } from "@/hooks/useOrders"
import { useProducts } from "@/hooks/useProducts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { formatOrderDate } from "@/lib/order-utils"
import { 
  ShoppingBag, 
  Clock, 
  DollarSign, 
  PackageX,
  Plus
} from "lucide-react"

export default function AdminDashboardPage() {
  const { orders } = useOrders()
  const { getLowStockProducts } = useProducts()

  // Calculate stats
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Confirmed").length
  const totalRevenue = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0)
  const lowStockCount = getLowStockProducts().length

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      color: "text-blue-600"
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Low Stock Items",
      value: lowStockCount,
      icon: PackageX,
      color: "text-red-600"
    }
  ]

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your business overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-accent/10 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button asChild size="sm">
                <Link href="/admin/orders/list">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Order #</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-border hover:bg-accent/5 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td className="py-3 px-4">{order.customerName}</td>
                            <td className="py-3 px-4 font-mono">{formatPrice(order.total)}</td>
                            <td className="py-3 px-4">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {formatOrderDate(order.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/admin/orders/list">
                <ShoppingBag className="w-4 h-4 mr-2" />
                View All Orders
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/products/list">
                <Plus className="w-4 h-4 mr-2" />
                Manage Products
              </Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
