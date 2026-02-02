"use client"

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

// Component-friendly interface (camelCase, with nested data)
export interface Order {
  id: string
  orderNumber: string
  userId: string | null
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  subtotal: number
  tax: number
  shippingFee: number
  discount: number
  total: number
  paymentMethod: string | null
  paymentStatus: string
  paidAmount: number
  status: string
  deliveryAddress: any
  invoiceFileId: string | null
  invoiceGeneratedAt: string | null
  internalNotes: string | null
  source: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  statusHistory: StatusHistoryEntry[]
}

export interface OrderItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  subtotal: number
  image: string | null
}

export interface StatusHistoryEntry {
  status: string
  note: string
  updatedBy: string
  timestamp: string
}

export function useOrders(userId: string | null) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      console.log('[useOrders] ❌ No userId provided - skipping fetch')
      setOrders([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const supabase = getSupabaseBrowserClient()
      console.log('[useOrders] 🔍 Fetching orders for userId:', userId)
      console.log('[useOrders] userId type:', typeof userId)
      
      // 1. Fetch Orders filtered by userId
      const { data: dbOrders, error: orderError } = await (supabase as any)
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (orderError) {
        console.error('[useOrders] ❌ Order fetch error:', orderError)
        console.error('[useOrders] Error details:', { message: orderError.message, code: orderError.code, hint: orderError.hint })
        throw orderError
      }
      
      console.log('[useOrders] ✅ DB Orders found:', dbOrders?.length || 0)
      if (dbOrders && dbOrders.length > 0) {
        console.log('[useOrders] First order user_id:', dbOrders[0].user_id)
        console.log('[useOrders] Comparing: fetched user_id === param userId?', dbOrders[0].user_id === userId)
      }
      if (!dbOrders || dbOrders.length === 0) {
        setOrders([])
        return
      }

      // ✅ NEW: Extract items and history from JSONB data (no separate table fetch needed)
      // Order items and status history are stored as JSONB arrays in the orders table
      const transformedOrders = dbOrders.map((dbOrder: any) => {
        // Extract items from JSONB array
        const orderItems = (dbOrder.items || []).map((item: any) => ({
          productId: item.product_id,
          productName: item.product_name,
          sku: item.sku || '',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          subtotal: item.subtotal,
          image: item.image
        }))

        // Extract status history from JSONB array
        const history = (dbOrder.status_history || []).map((entry: any) => ({
          status: entry.status,
          note: entry.note || entry.notes || '',
          updatedBy: entry.updated_by || entry.updatedBy || 'system',
          timestamp: entry.timestamp || entry.created_at || new Date().toISOString()
        }))

        console.log(`[useOrders] Order ${dbOrder.order_number}: ${orderItems.length} items, ${history.length} status updates`)
        return transformOrder(dbOrder, orderItems, history)
      })

      setOrders(transformedOrders)
    } catch (err: any) {
      console.error('Error fetching user orders:', err)
      setError(err.message || 'Failed to fetch orders')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  function transformOrder(dbOrder: any, items: OrderItem[], statusHistory: StatusHistoryEntry[]): Order {
    return {
      id: dbOrder.id,
      orderNumber: dbOrder.order_number,
      userId: dbOrder.user_id,
      customerId: dbOrder.customer_id,
      customerName: dbOrder.customer_name,
      customerEmail: dbOrder.customer_email,
      customerPhone: dbOrder.customer_phone,
      subtotal: dbOrder.subtotal,
      tax: dbOrder.tax,
      shippingFee: dbOrder.shipping_fee,
      discount: dbOrder.discount,
      total: dbOrder.total,
      paymentMethod: dbOrder.payment_method,
      paymentStatus: dbOrder.payment_status,
      paidAmount: dbOrder.paid_amount,
      status: dbOrder.status,
      deliveryAddress: dbOrder.delivery_address,
      invoiceFileId: dbOrder.invoice_file_id,
      invoiceGeneratedAt: dbOrder.invoice_generated_at,
      source: dbOrder.source,
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at,
      items: items,
      statusHistory: statusHistory
    }
  }

  async function getOrderById(id: string) {
    const { data: dbOrder, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    // ✅ NEW: Extract items and history from JSONB data (no separate table fetch needed)
    const orderItems = (dbOrder.items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku || '',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
        image: item.image
    }))

    const history = (dbOrder.status_history || []).map((entry: any) => ({
        status: entry.status,
        note: entry.note || entry.notes || '',
        updatedBy: entry.updated_by || entry.updatedBy || 'system',
        timestamp: entry.timestamp || entry.created_at || new Date().toISOString()
    }))

    console.log(`[useOrders.getOrderById] Order ${dbOrder.order_number}: ${orderItems.length} items, ${history.length} status updates`)
    return transformOrder(dbOrder, orderItems, history)
  }

  async function updateOrderStatus(
    orderId: string,
    status: string,
    note: string,
    updatedBy: string
  ) {
    try {
      // 1. Get current order to access existing status_history
      const { data: orderData, error: fetchError } = await (supabase as any)
        .from('orders')
        .select('status_history')
        .eq('id', orderId)
        .single()

      if (fetchError) throw fetchError

      // 2. Parse existing history (it's a JSONB array)
      const existingHistory = (orderData?.status_history || []) as any[]
      
      // 3. Add new status entry
      const newHistoryEntry = {
        status,
        notes: note,
        timestamp: new Date().toISOString(),
        updated_by: updatedBy
      }
      
      const updatedHistory = [...existingHistory, newHistoryEntry]

      // 4. Update order with new status AND updated history
      const { error: updateError } = await (supabase as any)
        .from('orders')
        .update({ 
          status,
          status_history: updatedHistory
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      // 5. Refresh orders
      await fetchOrders()
    } catch (err) {
      console.error('[updateOrderStatus] Error:', err)
      throw err
    }
  }

  async function updateOrderNotes(orderId: string, notes: string) {
    // ✅ REMOVED: internal_notes field no longer exists in orders table
    console.warn('updateOrderNotes: internal_notes field has been removed from orders table')
    await fetchOrders()
  }

  function getOrdersByStatus(status: string) {
    return orders.filter(o => o.status === status)
  }

  function getRecentOrders(limit: number) {
    return orders.slice(0, limit)
  }

  return {
    orders,
    isLoading,
    error,
    getOrderById,
    updateOrderStatus,
    updateOrderNotes,
    getOrdersByStatus,
    getRecentOrders,
    refetch: fetchOrders
  }
}
