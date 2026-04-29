"use client"

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
  Plus,
  Users2,
  TrendingUp,
  Warehouse,
  ClipboardList,
  Package,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { IconSpinner } from "@/components/ui/icon-spinner"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type DateRange = 'today' | '7d' | '30d' | 'all'

interface InventoryMetrics {
  totalProducts: number
  outOfStock: number
  lowStock: number
  healthyStock: number
  totalAliases: number
  recentAudits: { id: string; created_at: string; status: string; notes: string | null }[]
  stockChartData: { name: string; stock: number; threshold: number }[]
  categoryChartData: { category: string; totalStock: number }[]
}

export default function AdminDashboardPage() {
  const { user, _hasHydrated } = useStore()
  const { orders, isLoading: ordersLoading, error: ordersError } = useOrders('ALL')
  const { products } = useProducts()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [crmMetrics, setCrmMetrics] = useState<{ total: number; quoted: number; converted: number; conversionRate: number } | null>(null)
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryMetrics | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(true)

  useEffect(() => {
    if (!_hasHydrated || user?.role === 'inventory') return
    fetch('/api/admin/crm/metrics', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCrmMetrics(d))
      .catch(() => {})
  }, [_hasHydrated, user?.role])

  useEffect(() => {
    if (!_hasHydrated || user?.role !== 'inventory') return
    setInventoryLoading(true)
    fetch('/api/admin/inventory/metrics', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setInventoryMetrics(d))
      .catch(() => {})
      .finally(() => setInventoryLoading(false))
  }, [_hasHydrated, user?.role])

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
  const lowStockValue = useMemo(() => {
    return products.filter((product) => product.stock <= product.low_stock_threshold).length
  }, [products])

  const revenueChartData = useMemo(() => {
    const dataMap = new Map<string, { date: string, timestamp: number, revenue: number }>()
    
    filteredOrders.forEach(order => {
      if (order.status === 'Cancelled') return
      const orderDate = new Date(order.createdAt)
      const date = orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      const existing = dataMap.get(date)
      dataMap.set(date, {
        date,
        timestamp: existing?.timestamp ?? orderDate.getTime(),
        revenue: (existing?.revenue || 0) + order.total,
      })
    })
    
    return Array.from(dataMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
      .map(({ date, revenue }) => ({ date, revenue }))
  }, [filteredOrders])

  const ordersChartData = useMemo(() => {
    const dataMap = new Map<string, { date: string, timestamp: number, count: number }>()
    
    filteredOrders.forEach(order => {
      const orderDate = new Date(order.createdAt)
      const date = orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      const existing = dataMap.get(date)
      dataMap.set(date, {
        date,
        timestamp: existing?.timestamp ?? orderDate.getTime(),
        count: (existing?.count || 0) + 1,
      })
    })
    
    return Array.from(dataMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
      .map(({ date, count }) => ({ date, count }))
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
      value: lowStockValue,
      icon: PackageX,
      color: "text-red-600"
    }
  ]

  // ── Hydration gate — prevents rendering wrong branch before localStorage loads ──
  if (!_hasHydrated) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <IconSpinner label="Loading..." />
      </div>
    )
  }

  // ── Inventory Dashboard ────────────────────────────────────────────────────
  if (user?.role === 'inventory') {
    if (inventoryLoading) {
      return (
        <div className="flex min-h-[60vh] w-full items-center justify-center">
          <IconSpinner label="Loading warehouse metrics..." />
        </div>
      )
    }

    const invStats = [
      {
        title: "Total Products",
        value: inventoryMetrics?.totalProducts ?? "—",
        icon: Package,
        color: "text-blue-600",
      },
      {
        title: "Healthy Stock",
        value: inventoryMetrics?.healthyStock ?? "—",
        icon: CheckCircle2,
        color: "text-green-600",
      },
      {
        title: "Low Stock",
        value: inventoryMetrics?.lowStock ?? "—",
        icon: AlertTriangle,
        color: "text-orange-600",
      },
      {
        title: "Out of Stock",
        value: inventoryMetrics?.outOfStock ?? "—",
        icon: PackageX,
        color: "text-red-600",
      },
    ]

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Warehouse Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your inventory overview.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/admin/inventory/grn">
                <Warehouse className="w-4 h-4 mr-2" />
                New GRN
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/inventory/audit">
                <ClipboardList className="w-4 h-4 mr-2" />
                New Audit
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {invStats.map((stat) => (
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lowest Stock Products</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryMetrics?.stockChartData?.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={inventoryMetrics.stockChartData.slice(0, 6)} layout="vertical" margin={{ left: 12, right: 24, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} interval={0} />
                    <Tooltip />
                    <Bar dataKey="stock" name="Current Stock" isAnimationActive={false} radius={[0, 4, 4, 0]} barSize={28}>
                      {inventoryMetrics.stockChartData.slice(0, 6).map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.stock === 0 ? '#ef4444' : entry.stock <= entry.threshold ? '#f97316' : '#8b5cf6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No product data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryMetrics?.categoryChartData?.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={inventoryMetrics.categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalStock" name="Total Units" fill="#8b5cf6" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No category data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Audits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Stock Audits</CardTitle>
            <Button asChild size="sm">
              <Link href="/admin/inventory/audit">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!inventoryMetrics?.recentAudits?.length ? (
              <p className="text-center text-muted-foreground py-8">No audits yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryMetrics.recentAudits.map((audit) => (
                      <tr key={audit.id} className="border-b border-border hover:bg-accent/5 transition-colors">
                        <td className="py-3 px-4 text-sm">
                          {new Date(audit.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            audit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {audit.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-[400px]">
                          {audit.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Admin/Sales Dashboard ──────────────────────────────────────────────────
  if (ordersLoading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <IconSpinner label="Loading dashboard metrics..." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
          {ordersError && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
              Failed to load dashboard data. Please refresh.
            </div>
          )}
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

          {/* CRM Metrics */}
          {crmMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                      <p className="text-3xl font-bold mt-2">{crmMetrics.total}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/10 text-blue-600">
                      <Users2 className="w-6 h-6" />
                    </div>
                  </div>
                  <Link href="/admin/crm/leads" className="text-xs text-primary mt-2 block hover:underline">View all leads →</Link>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Quotes Created</p>
                      <p className="text-3xl font-bold mt-2">{crmMetrics.quoted}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/10 text-purple-600">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                      <p className="text-3xl font-bold mt-2">{crmMetrics.conversionRate}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{crmMetrics.converted} converted</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/10 text-green-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} isAnimationActive={false} />
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
                    <Bar dataKey="count" fill="#8b5cf6" isAnimationActive={false} />
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
  )
}
