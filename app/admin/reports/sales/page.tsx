"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useOrders } from "@/hooks/useOrders"
import { useProducts } from "@/hooks/useProducts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { TrendingUp, Package, Users } from "lucide-react"

export default function SalesReportPage() {
  const { orders } = useOrders('ALL') // Fetch all orders for admin reports
  const { } = useProducts()

  // Calculate metrics
  const totalRevenue = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0)
  
  const thisMonthOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt)
    const now = new Date()
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
  })
  
  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total, 0)
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

  // Top products
  const productSales = orders
    .filter(o => o.status !== "Cancelled")
    .flatMap(o => o.items)
    .reduce((acc, item) => {
      const existing = acc.find(p => p.productId === item.productId)
      if (existing) {
        existing.quantity += item.quantity
        existing.revenue += item.subtotal
      } else {
        acc.push({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          revenue: item.subtotal
        })
      }
      return acc
    }, [] as Array<{ productId: string; productName: string; quantity: number; revenue: number }>)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Sales Reports</h1>
            <p className="text-muted-foreground mt-1">Analytics and performance metrics</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold mt-2">{formatPrice(totalRevenue)}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      All time
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold mt-2">{formatPrice(thisMonthRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {thisMonthOrders.length} orders
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold mt-2">{formatPrice(avgOrderValue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per transaction
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold mt-2">{orders.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All statuses
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productSales.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-primary/50'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} units sold
                        </p>
                      </div>
                    </div>
                    <p className="font-bold font-mono">{formatPrice(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {["New", "Processing", "Ready", "Shipped", "Delivered", "Cancelled"].map((status) => {
                  const count = orders.filter(o => o.status === status).length
                  return (
                    <div key={status} className="text-center p-4 border border-border rounded-lg">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground mt-1">{status}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
