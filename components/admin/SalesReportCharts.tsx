"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface StatusBreakdownItem {
  name: string
  value: number
}

interface SalesReportChartsProps {
  revenueChartData: Array<{ date: string; revenue: number }>
  statusBreakdown: StatusBreakdownItem[]
  statusColors: Record<string, string>
}

export function SalesReportCharts({ revenueChartData, statusBreakdown, statusColors }: SalesReportChartsProps) {
  return (
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
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} isAnimationActive={false} />
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
                isAnimationActive={false}
              >
                {statusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.name] || "#6b7280"} />
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
  )
}
