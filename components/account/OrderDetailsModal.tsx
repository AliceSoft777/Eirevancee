"use client"

import { useOrderDetails } from "@/context/OrderDetailsContext"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Package, MapPin, Phone, Mail, DollarSign, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { formatOrderDate, getValidNextStatuses } from "@/lib/order-utils"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { useState } from "react"

export function OrderDetailsModal() {
  const { isOpen, closeOrderDetails, selectedOrder, updateOrderStatus, isUpdating, isAdmin } = useOrderDetails()
  // const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  if (!selectedOrder) {
    return null
  }

  const validNextStatuses = getValidNextStatuses(selectedOrder.status)

  const handleStatusChange = async (newStatus: string) => {
    try {
      setError(null)
      await updateOrderStatus(selectedOrder.id, newStatus)
      // toast({
      //   title: "Success",
      //   description: `Order status updated to ${newStatus}`,
      //   variant: "default",
      // })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update status"
      setError(errorMessage)
      // toast({
      //   title: "Error",
      //   description: errorMessage,
      //   variant: "destructive",
      // })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) closeOrderDetails()
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative pb-4 border-b">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-2">
              <DialogTitle className="text-2xl">
                Order #{selectedOrder.orderNumber}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Placed on {formatOrderDate(selectedOrder.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={selectedOrder.status} />
              <DialogClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Admin Status Update Section */}
          {isAdmin && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">Update Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium block mb-2">Current Status</label>
                    <Select value={selectedOrder.status} onValueChange={handleStatusChange} disabled={isUpdating || validNextStatuses.length === 0}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {validNextStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isUpdating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-bold text-primary">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (23%)</span>
                <span className="font-semibold">{formatPrice(selectedOrder.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">{formatPrice(selectedOrder.shippingFee)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatPrice(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary text-lg">
                  {formatPrice(selectedOrder.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-semibold">{selectedOrder.customerName}</p>
              <div className="space-y-1 text-muted-foreground">
                <p>{selectedOrder.deliveryAddress.street}</p>
                <p>
                  {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.county}
                </p>
                <p>{selectedOrder.deliveryAddress.postal_code}</p>
                <p>{selectedOrder.deliveryAddress.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{selectedOrder.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{selectedOrder.customerPhone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-semibold capitalize">
                  {selectedOrder.paymentMethod || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant={selectedOrder.paymentStatus === 'Paid' ? 'default' : 'secondary'}>
                  {selectedOrder.paymentStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes (if any) */}
          {selectedOrder.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.internalNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedOrder.statusHistory.map((entry, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="relative">
                        <div className="h-3 w-3 rounded-full bg-primary mt-1.5" />
                        {index < (selectedOrder.statusHistory?.length || 0) - 1 && (
                          <div className="absolute top-3 left-1/2 w-0.5 h-8 bg-border -translate-x-1/2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={entry.status} />
                          <span className="text-xs text-muted-foreground">
                            {formatOrderDate(entry.timestamp)}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <Button
            onClick={closeOrderDetails}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
