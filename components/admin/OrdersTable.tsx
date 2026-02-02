"use client"

import { useState } from "react"
import { OrderListItem } from "@/app/admin/orders/list/OrdersListClient"
import { OrderDetailModal } from "./OrderDetailModal"
import { formatPrice } from "@/lib/utils"
import { formatOrderDate } from "@/lib/order-utils"
import { StatusBadge } from "./StatusBadge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface OrdersTableProps {
  orders: OrderListItem[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewOrder = (order: OrderListItem) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border bg-accent/5">
              <th className="text-left py-4 px-4 text-sm font-semibold sticky top-0 bg-card">Order #</th>
              <th className="text-left py-4 px-4 text-sm font-semibold">Customer</th>
              <th className="text-right py-4 px-4 text-sm font-semibold">Total</th>
              <th className="text-left py-4 px-4 text-sm font-semibold">Status</th>
              <th className="text-left py-4 px-4 text-sm font-semibold">Date</th>
              <th className="text-center py-4 px-4 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={order.id}
                className={`border-b border-border hover:bg-accent/5 transition-colors ${
                  index % 2 === 0 ? 'bg-white/50' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleViewOrder(order)}
                    className="text-primary hover:underline font-semibold cursor-pointer"
                  >
                    {order.orderNumber}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold">
                  {formatPrice(order.total)}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {formatOrderDate(order.createdAt)}
                </td>
                <td className="py-3 px-4 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewOrder(order)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for order details */}
      {selectedOrder && (
        <OrderDetailModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          order={selectedOrder}
        />
      )}
    </>
  )
}
