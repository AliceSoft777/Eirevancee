"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useOrders } from "@/hooks/useOrders"
import { useProducts } from "@/hooks/useProducts"
import { useStore } from "@/hooks/useStore"
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
import { useState, useMemo } from "react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type DateRange = 'today' | '7d' | '30d' | 'all'

export default function AdminDashboardPage() {
  const { user } = useStore()
  const { orders } = useOrders('ALL')
  const { getLowStockProducts } = useProducts()
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  const filteredOrders = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      
      switch(dateRange) {
        case 'today':
          return orderDate >= today
        case '7d':
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return orderDate >= sevenDaysAgo
        case '30d':
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return orderDate >= thirtyDaysAgo
        default:
          return true
      }
    })
  }, [orders, dateRange])

  const totalOrders = filteredOrders.length
  const pendingOrders = filteredOrders.filter(o => o.status === "Pending" || o.status === "Confirmed").length
  const totalRevenue = filteredOrders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0)
  const lowStockCount = getLowStockProducts().length

  const revenueChartData = useMemo(() => {
    const dataMap = new Map<string, number>()
    
    filteredOrders.forEach(order => {
      if (order.status === 'Cancelled') return
      const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      dataMap.set(date, (dataMap.get(date) || 0) + order.total)
    })
    
    return Array.from(dataMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .slice(-10)
  }, [filteredOrders])

  const ordersChartData = useMemo(() => {
    const dataMap = new Map<string, number>()
    
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      dataMap.set(date, (dataMap.get(date) || 0) + 1)
    })
    
    return Array.from(dataMap.entries())
      .map(([date, count]) => ({ date, count }))
      .slice(-10)
  }, [filteredOrders])

  const recentOrders = filteredOrders
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your business overview.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={dateRange === 'today' ? 'default' : 'outline'} onClick={() => setDateRange('today')}>Today</Button>
              <Button size="sm" variant={dateRange === '7d' ? 'default' : 'outline'} onClick={() => setDateRange('7d')}>7 Days</Button>
              <Button size="sm" variant={dateRange === '30d' ? 'default' : 'outline'} onClick={() => setDateRange('30d')}>30 Days</Button>
              <Button size="sm" variant={dateRange === 'all' ? 'default' : 'outline'} onClick={() => setDateRange('all')}>All Time</Button>
            </div>
          </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ordersChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

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
