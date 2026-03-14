"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useOrders } from "@/hooks/useOrders"
import { useProducts } from "@/hooks/useProducts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { TrendingUp, Package, Users, Download, FileText } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { toast } from "sonner"
import { ReportsSkeleton } from "@/components/admin/AdminSkeletons"

type DateRange = 'today' | '7d' | '30d' | 'all'

const STATUS_COLORS = {
  'Pending': '#f97316',
  'Confirmed': '#ef4444',
  'New': '#3b82f6',
  'Processing': '#f59e0b',
  'Ready': '#8b5cf6',
  'Shipped': '#06b6d4',
  'Delivered': '#10b981',
  'Cancelled': '#6b7280'
}

type StatusBreakdownItem = {
  name: string
  value: number
}

export default function SalesReportPage() {
  const { orders, isLoading: ordersLoading, error, refetch } = useOrders('ALL')
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  // Auto-retry: if fetch fails, retry after 3 seconds (max 3 attempts)
  const [retryCount, setRetryCount] = useState(0)
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        refetch()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, retryCount, refetch])

  // Reset retry count when data loads successfully
  useEffect(() => {
    if (!ordersLoading && !error && orders.length > 0) {
      setRetryCount(0)
    }
  }, [ordersLoading, error, orders.length])

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

  const totalRevenue = filteredOrders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0)
  
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0

  const revenueChartData = useMemo(() => {
    const dataMap = new Map<string, { revenue: number; sortKey: number }>()
    
    filteredOrders.forEach(order => {
      if (order.status === 'Cancelled') return
      const orderDate = new Date(order.createdAt)
      const dateLabel = orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      const existing = dataMap.get(dateLabel)
      dataMap.set(dateLabel, {
        revenue: (existing?.revenue || 0) + order.total,
        sortKey: existing?.sortKey ?? orderDate.getTime()
      })
    })
    
    return Array.from(dataMap.entries())
      .map(([date, { revenue, sortKey }]) => ({ date, revenue, sortKey }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-15)
  }, [filteredOrders])

  const statusBreakdown = useMemo<StatusBreakdownItem[]>(() => {
    return ["Pending", "Confirmed", "New", "Processing", "Ready", "Shipped", "Delivered", "Cancelled"]
      .map((status) => ({
        name: status,
        value: filteredOrders.filter(o => o.status === status).length
      }))
      .filter(item => item.value > 0)
  }, [filteredOrders])

  const productSales = filteredOrders
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

  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Email', 'Total', 'Status', 'Date']
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.customerName,
      o.customerEmail,
      o.total.toString(),
      o.status,
      new Date(o.createdAt).toLocaleDateString()
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${dateRange}.csv`
    a.click()
    toast.success('CSV exported successfully')
  }

  const exportToPDF = () => {
    toast.info('PDF export requires jsPDF library - install with: npm install jspdf jspdf-autotable')
  }

  if (ordersLoading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <ReportsSkeleton />
        </AdminLayout>
      </AdminRoute>
    )
  }

  if (error) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <p className="text-muted-foreground">
              {retryCount < 3 ? `Failed to load reports. Retrying... (${retryCount}/3)` : 'Failed to load reports data.'}
            </p>
            <Button variant="outline" onClick={() => { setRetryCount(0); refetch(); }}>
              Retry Now
            </Button>
          </div>
        </AdminLayout>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary">Sales Reports</h1>
              <p className="text-muted-foreground mt-1">Analytics and performance metrics</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={dateRange === 'today' ? 'default' : 'outline'} onClick={() => setDateRange('today')}>Today</Button>
              <Button size="sm" variant={dateRange === '7d' ? 'default' : 'outline'} onClick={() => setDateRange('7d')}>7 Days</Button>
              <Button size="sm" variant={dateRange === '30d' ? 'default' : 'outline'} onClick={() => setDateRange('30d')}>30 Days</Button>
              <Button size="sm" variant={dateRange === 'all' ? 'default' : 'outline'} onClick={() => setDateRange('all')}>All Time</Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold mt-2">{formatPrice(totalRevenue)}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {dateRange === 'all' ? 'All time' : dateRange}
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
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold mt-2">{filteredOrders.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      In selected period
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
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold mt-2">{filteredOrders.filter(o => o.status === 'Delivered').length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Delivered orders
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}`} />
                    <Legend
                      formatter={(value) => {
                        const item = statusBreakdown.find((entry) => entry.name === String(value))
                        return `${String(value)}: ${item?.value ?? 0}`
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

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
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
