"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { notFound } from "next/navigation"
import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useOrders, type Order } from "@/hooks/useOrders"
import { useStore } from "@/hooks/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { StatusUpdateDialog } from "@/components/admin/StatusUpdateDialog"
import { formatPrice } from "@/lib/utils"
import { formatOrderDate, getValidNextStatuses } from "@/lib/order-utils"
import { ChevronDown, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { getOrderById, updateOrderStatus, updateOrderNotes } = useOrders()
  const { user } = useStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [internalNotes, setInternalNotes] = useState("")
  
  useEffect(() => {
    let mounted = true

    async function loadOrder() {
      const result = await getOrderById(id)
      if (mounted) {
        if (result) {
          setOrder(result)
          setInternalNotes(result.internalNotes || "")
        } else {
          notFound()
        }
      }
    }

    loadOrder()
    return () => {
      mounted = false
    }
  }, [id, getOrderById])

  useEffect(() => {
    if (order) {
      setInternalNotes(order.internalNotes || "")
    }
  }, [order])

  if (!order) {
    return null
  }

  const validNextStatuses = getValidNextStatuses(order.status)

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus)
    setShowDialog(true)
  }

  const handleConfirmStatusChange = (note: string) => {
    if (selectedStatus && user) {
      updateOrderStatus(order.id, selectedStatus, note, user.name)
      toast.success(`Order status updated to ${selectedStatus}`)
      setShowDialog(false)
      setSelectedStatus(null)
    }
  }

  const handleSaveNotes = () => {
    updateOrderNotes(order.id, internalNotes)
    toast.success("Internal notes saved")
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-serif font-bold text-primary">{order.orderNumber}</h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-muted-foreground mt-1">
                Created {formatOrderDate(order.createdAt)} • {order.source}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/orders/list">Back to Orders</Link>
            </Button>
          </div>

          {validNextStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {validNextStatuses.map((status) => (
                    <Button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      variant="outline"
                    >
                      Mark as {status}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Address</p>
                  <p className="font-medium">
                    {order.deliveryAddress.street}<br />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}<br />
                    {order.deliveryAddress.pincode}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <p className="font-medium">{order.paymentStatus}</p>
                </div>
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal</span>
                    <span className="font-mono">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tax (18%)</span>
                    <span className="font-mono">{formatPrice(order.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Shipping</span>
                    <span className="font-mono">{formatPrice(order.shippingFee)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Discount</span>
                      <span className="font-mono">-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold">Total</span>
                    <span className="font-mono font-bold text-primary">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Product</th>
                    <th className="text-center py-2">SKU</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.productId} className="border-b border-border">
                      <td className="py-3">{item.productName}</td>
                      <td className="py-3 text-center font-mono text-sm">{item.sku}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right font-mono">{formatPrice(item.unitPrice)}</td>
                      <td className="py-3 text-right font-mono font-semibold">{formatPrice(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((entry, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        index === order.statusHistory.length - 1 
                          ? 'bg-primary/20 border-primary/40' 
                          : 'bg-gray-100 border-gray-300'
                      }`} />
                      {index < order.statusHistory.length - 1 && (
                        <div className="absolute top-3 left-1/2 w-0.5 h-full bg-gray-200 -translate-x-1/2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={entry.status} />
                        <span className="text-sm text-muted-foreground">
                          {formatOrderDate(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">By: {entry.updatedBy}</p>
                      {entry.note && (
                        <p className="text-sm mt-1">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full min-h-[100px] p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Add internal notes here (not visible to customer)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
              <Button onClick={handleSaveNotes} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        <StatusUpdateDialog
          isOpen={showDialog}
          currentStatus={order.status}
          newStatus={selectedStatus || ""}
          onConfirm={handleConfirmStatusChange}
          onCancel={() => {
            setShowDialog(false)
            setSelectedStatus(null)
          }}
        />
      </AdminLayout>
    </AdminRoute>
  )
}
