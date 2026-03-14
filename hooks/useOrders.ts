"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
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

export function useOrders(userId?: string | null | 'ALL') {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const hasLoadedOnceRef = useRef(false)
  const isFetchingRef = useRef(false)

  const fetchOrders = useCallback(async () => {
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true

      if (!hasLoadedOnceRef.current) {
        setIsLoading(true)
      }
      setError(null)

      const supabase = getSupabaseBrowserClient()
      
      // Admin mode: fetch ALL orders when userId is 'ALL' or undefined
      const isAdminMode = userId === 'ALL' || userId === undefined
      
      if (!isAdminMode && !userId) {
        setOrders([])
        setIsLoading(false)
        hasLoadedOnceRef.current = true
        return
      }
      
      // Build query - conditionally filter by user_id
      let query = (supabase as any)
        .from('orders')
        .select('*')
      
      // Only filter by user_id if not in admin mode
      if (!isAdminMode && userId) {
        query = query.eq('user_id', userId)
      }
      
      const result = await query.order('created_at', { ascending: false })

      // Guard: if Supabase returns undefined (e.g. stale auth session), bail gracefully
      if (!result) {
        console.warn('[useOrders] Query returned undefined — possible auth session issue')
        setOrders([])
        return
      }

      const { data: dbOrders, error: orderError } = result

      if (orderError) {
        console.error('[useOrders] ❌ Order fetch error:', orderError)
        console.error('[useOrders] Error details:', { message: orderError.message, code: orderError.code, hint: orderError.hint })
        throw orderError
      }
      

      if (!mountedRef.current) return

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


        return transformOrder(dbOrder, orderItems, history)
      })

      if (mountedRef.current) setOrders(transformedOrders)
    } catch (err: any) {
      console.error('Error fetching user orders:', err)
      if (mountedRef.current) setError(err.message || 'Failed to fetch orders')
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
        hasLoadedOnceRef.current = true
      }
      isFetchingRef.current = false
    }
  }, [userId])

  useEffect(() => {
    mountedRef.current = true
    fetchOrders()
    return () => { mountedRef.current = false }
  }, [fetchOrders])

  // Auto-refetch on window focus to prevent stale data after navigating back
  useEffect(() => {
    let lastFetchTime = 0
    const MIN_REFETCH_INTERVAL_MS = 1000

    const handleFocus = () => {
      // Debounce refetches from rapid focus/visibility events.
      if (Date.now() - lastFetchTime < MIN_REFETCH_INTERVAL_MS) return
      lastFetchTime = Date.now()
      fetchOrders()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
    const supabase = getSupabaseBrowserClient()
    const result = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!result) {
      throw new Error('Failed to fetch order — please try refreshing the page')
    }

    const { data: dbOrder, error } = result
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


    return transformOrder(dbOrder, orderItems, history)
  }

  async function updateOrderStatus(
    orderId: string,
    status: string,
    note: string,
    updatedBy: string
  ) {
    try {

      const supabase = getSupabaseBrowserClient()
      
      // 1. Get current order to access existing status_history
      const fetchResult = await (supabase as any)
        .from('orders')
        .select('status_history')
        .eq('id', orderId)
        .single()

      if (!fetchResult) {
        throw new Error('Failed to fetch order status — please try refreshing')
      }

      const { data: orderData, error: fetchError } = fetchResult

      if (fetchError) {
        console.error('[updateOrderStatus] Fetch error:', fetchError)
        throw fetchError
      }



      // 2. Parse existing history (it's a JSONB array)
      const existingHistory = (orderData?.status_history || []) as any[]
      
      // 3. Add new status entry
      const newHistoryEntry = {
        status,
        note: note || '',
        timestamp: new Date().toISOString(),
        updated_by: updatedBy
      }
      
      const updatedHistory = [...existingHistory, newHistoryEntry]



      // 4. Update order with new status AND updated history
      const updateResult = await (supabase as any)
        .from('orders')
        .update({ 
          status,
          status_history: updatedHistory,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (!updateResult) {
        throw new Error('Failed to update order status — please try refreshing')
      }

      const { error: updateError } = updateResult

      if (updateError) {
        console.error('[updateOrderStatus] Update error:', updateError)
        throw updateError
      }



      // 5. Only refresh if we have a userId (user-specific orders)
      if (userId) {
        await fetchOrders()
      }
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
