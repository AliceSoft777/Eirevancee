"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react"
import type { Order } from "@/hooks/useOrders"

interface OrderDetailsContextType {
  selectedOrderId: string | null
  isOpen: boolean
  selectedOrder: Order | null
  openOrderDetails: (order: Order) => void
  closeOrderDetails: () => void
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>
  isUpdating: boolean
  isAdmin: boolean
}

const OrderDetailsContext = createContext<OrderDetailsContextType | undefined>(undefined)

interface OrderDetailsProviderProps {
  children: ReactNode
  isAdmin?: boolean
}

export function OrderDetailsProvider({ children, isAdmin: propsIsAdmin = false }: OrderDetailsProviderProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const openOrderDetails = useCallback((order: Order) => {
    console.log('[OrderDetailsContext] 📂 Opening order modal:', order.id)
    setSelectedOrder(order)
    setSelectedOrderId(order.id)
    setIsOpen(true)
  }, [])

  const closeOrderDetails = useCallback(() => {
    console.log('[OrderDetailsContext] 📂 Closing order modal')
    setIsOpen(false)
    // Delayed cleanup to allow animation
    setTimeout(() => {
      setSelectedOrder(null)
      setSelectedOrderId(null)
    }, 300)
  }, [])

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    try {
      setIsUpdating(true)
      console.log(`[OrderDetailsContext] 🔄 Updating order ${orderId} to status: ${newStatus}`)

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      // Update local state
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }

      console.log(`[OrderDetailsContext] ✅ Status updated successfully`)
    } catch (error) {
      console.error('[OrderDetailsContext] ❌ Status update error:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [selectedOrder])

  return (
    <OrderDetailsContext.Provider
      value={{
        selectedOrderId,
        isOpen,
        selectedOrder,
        openOrderDetails,
        closeOrderDetails,
        updateOrderStatus,
        isUpdating,
        isAdmin: propsIsAdmin,
      }}
    >
      {children}
    </OrderDetailsContext.Provider>
  )
}

export function useOrderDetails() {
  const context = useContext(OrderDetailsContext)
  if (!context) {
    throw new Error(
      "useOrderDetails must be used within an OrderDetailsProvider"
    )
  }
  return context
}
