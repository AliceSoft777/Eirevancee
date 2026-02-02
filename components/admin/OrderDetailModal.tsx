"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "./StatusBadge"
import { StatusUpdateDialog } from "./StatusUpdateDialog"
import { formatPrice } from "@/lib/utils"
import { formatOrderDate, getValidNextStatuses } from "@/lib/order-utils"
import { useOrders } from "@/hooks/useOrders"
import { useStore } from "@/hooks/useStore"
import { toast } from "sonner"
import { Eye, X } from "lucide-react"
import type { OrderListItem } from "@/app/admin/orders/list/OrdersListClient"

interface OrderDetailModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  order: OrderListItem
}

export function OrderDetailModal({
  isOpen,
  onOpenChange,
  order,
}: OrderDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { updateOrderStatus } = useOrders(null)
  const { user } = useStore()

  const validNextStatuses = getValidNextStatuses(order.status)

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus)
    setShowStatusDialog(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!selectedStatus || !user) return
    
    setIsUpdating(true)
    try {
      // Call actual database update
      await updateOrderStatus(order.id, selectedStatus, `Status updated by ${user.name}`, user.name)
      toast.success(`Order status updated to ${selectedStatus}`)
      setShowStatusDialog(false)
      setSelectedStatus(null)
      onOpenChange(false) // Close the modal after successful update
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between w-full pr-4">
            <div>
              <DialogTitle className="text-2xl">
                <div className="flex items-center gap-3">
                  <span>{order.orderNumber}</span>
                  <StatusBadge status={order.status} />
                </div>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Created {formatOrderDate(order.createdAt)}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pr-4">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{order.customerEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-semibold text-lg text-primary">
                  {formatPrice(typeof order.total === 'string' ? parseFloat(order.total) : order.total)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Order created on {formatOrderDate(order.createdAt)}
              </div>
            </CardContent>
          </Card>

          {/* Status Update */}
          {validNextStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedStatus || ""} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {validNextStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Status Update Dialog */}
        {selectedStatus && (
          <StatusUpdateDialog
            isOpen={showStatusDialog}
            currentStatus={order.status}
            newStatus={selectedStatus}
            onConfirm={handleConfirmStatusChange}
            onCancel={() => {
              setShowStatusDialog(false)
              setSelectedStatus(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
