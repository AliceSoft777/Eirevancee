"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { logClientTiming, normalizeClientError } from '@/lib/client-runtime-utils'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'

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
  const orderCountRef = useRef(0)
  const isAdminMode = userId === 'ALL' || userId === undefined
  const cacheKey = 'admin_orders_cache_v1'
  const realtimeEnabled = typeof userId === 'string' || isAdminMode

  useEffect(() => {
    orderCountRef.current = orders.length
  }, [orders.length])

  useEffect(() => {
    if (typeof window === 'undefined' || !isAdminMode) return

    const raw = sessionStorage.getItem(cacheKey)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as Order[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setOrders(parsed)
        setIsLoading(false)
        hasLoadedOnceRef.current = true
      }
    } catch {
      sessionStorage.removeItem(cacheKey)
    }
  }, [cacheKey, isAdminMode])

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      })
      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const transformDbOrders = useCallback((dbOrders: any[]): Order[] => {
    return dbOrders.map((dbOrder: any) => {
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
    })
  }, [])

  const transformDbOrder = useCallback((dbOrder: any): Order => {
    const orderItems = (dbOrder.items || []).map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      sku: item.sku || '',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.subtotal,
      image: item.image,
    }))

    const history = (dbOrder.status_history || []).map((entry: any) => ({
      status: entry.status,
      note: entry.note || entry.notes || '',
      updatedBy: entry.updated_by || entry.updatedBy || 'system',
      timestamp: entry.timestamp || entry.created_at || new Date().toISOString(),
    }))

    return transformOrder(dbOrder, orderItems, history)
  }, [])

  const fetchAdminOrdersFromServer = useCallback(async (): Promise<any[] | null> => {
    if (typeof window === 'undefined' || !isAdminMode) return null

    try {
      const response = await withTimeout(
        fetch('/api/admin/orders/live', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }),
        12000,
        'Admin fallback request timed out'
      )

      if (!response.ok) {
        console.error('[useOrders] admin fallback response not ok', { status: response.status })
        return null
      }

      const payload = await response.json()
      const rows = Array.isArray(payload?.orders) ? payload.orders : null
      console.info('[useOrders] admin fallback response', { count: rows?.length ?? 0 })
      return rows
    } catch (fallbackErr) {
      console.error('[useOrders] admin fallback failed', fallbackErr)
      return null
    }
  }, [isAdminMode, withTimeout])

  const fetchOrders = useCallback(async () => {
    if (isFetchingRef.current) return

    const startedAt = Date.now()
    let rowCount = 0

    try {
      isFetchingRef.current = true

      if (!hasLoadedOnceRef.current) {
        setIsLoading(true)
      }
      setError(null)

      const supabase = getSupabaseBrowserClient()

      if (isAdminMode) {
        console.info('[useOrders] admin fetch start', {
          route: typeof window !== 'undefined' ? window.location.pathname : 'server',
          cachedRows: orderCountRef.current,
        })
      }
      
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
      
      const result: any = await withTimeout(
        query.order('created_at', { ascending: false }),
        25000,
        'Orders request timed out. Please retry.'
      )

      // Guard: if Supabase returns undefined (e.g. stale auth session), bail gracefully
      if (!result) {
        console.warn('[useOrders] Query returned undefined — possible auth session issue')
        setOrders([])
        return
      }

      const { data: dbOrders, error: orderError } = result

      if (isAdminMode) {
        console.info('[useOrders] browser query result', {
          hasError: Boolean(orderError),
          rowCount: Array.isArray(dbOrders) ? dbOrders.length : 0,
          errorCode: orderError?.code,
          errorMessage: orderError?.message,
        })
      }

      if (orderError) {
        const fallbackRows = await fetchAdminOrdersFromServer()
        if (fallbackRows && fallbackRows.length > 0) {
          const transformedFromFallback = transformDbOrders(fallbackRows)
          rowCount = transformedFromFallback.length
          if (mountedRef.current) setOrders(transformedFromFallback)
          if (typeof window !== 'undefined' && isAdminMode) {
            sessionStorage.setItem(cacheKey, JSON.stringify(transformedFromFallback))
          }
          console.warn('[useOrders] recovered using admin fallback after browser error')
          return
        }

        console.error('[useOrders] ❌ Order fetch error:', orderError)
        console.error('[useOrders] Error details:', { message: orderError.message, code: orderError.code, hint: orderError.hint })
        throw orderError
      }
      

      if (!mountedRef.current) return

      if (!dbOrders || dbOrders.length === 0) {
        if (isAdminMode) {
          const fallbackRows = await fetchAdminOrdersFromServer()
          if (fallbackRows && fallbackRows.length > 0) {
            const transformedFromFallback = transformDbOrders(fallbackRows)
            rowCount = transformedFromFallback.length
            if (mountedRef.current) setOrders(transformedFromFallback)
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(cacheKey, JSON.stringify(transformedFromFallback))
            }
            console.warn('[useOrders] browser returned empty; restored data from admin fallback')
            return
          }
        }
        setOrders([])
        return
      }

      const transformedOrders = transformDbOrders(dbOrders)
      rowCount = transformedOrders.length

      if (mountedRef.current) setOrders(transformedOrders)

      if (typeof window !== 'undefined' && isAdminMode) {
        sessionStorage.setItem(cacheKey, JSON.stringify(transformedOrders))
      }
    } catch (err: unknown) {
      const normalizedError = normalizeClientError(err, 'Failed to fetch orders')
      const message = normalizedError.message.toLowerCase()
      const isSessionOrNetworkTransient =
        normalizedError.isAbortLike ||
        normalizedError.code === 'PGRST301' ||
        message.includes('jwt') ||
        message.includes('session') ||
        message.includes('network')

      if (hasLoadedOnceRef.current && orderCountRef.current > 0 && isSessionOrNetworkTransient) {
        console.warn('[useOrders] transient refresh issue, keeping previous data', {
          message: normalizedError.message,
          code: normalizedError.code,
        })
        return
      }

      if (typeof window !== 'undefined' && isAdminMode && orderCountRef.current === 0) {
        const raw = sessionStorage.getItem(cacheKey)
        if (raw) {
          try {
            const cachedOrders = JSON.parse(raw) as Order[]
            if (Array.isArray(cachedOrders) && cachedOrders.length > 0) {
              setOrders(cachedOrders)
              setError(null)
              hasLoadedOnceRef.current = true
              return
            }
          } catch {
            sessionStorage.removeItem(cacheKey)
          }
        }
      }

      if (!normalizedError.isAbortLike) {
        console.warn('[useOrders] fetchOrders failed', {
          message: normalizedError.message,
          code: normalizedError.code,
        })
      }
      if (mountedRef.current) setError(normalizedError.message)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
        hasLoadedOnceRef.current = true
      }
      isFetchingRef.current = false
      logClientTiming('useOrders.fetchOrders', startedAt, { rowCount })
    }
  }, [cacheKey, fetchAdminOrdersFromServer, isAdminMode, transformDbOrders, userId, withTimeout])

  useEffect(() => {
    mountedRef.current = true
    fetchOrders()
    return () => { mountedRef.current = false }
  }, [fetchOrders])

  useRealtimeTable({
    table: 'orders',
    enabled: realtimeEnabled,
    onInsert: (row) => {
      if (!isAdminMode && typeof userId === 'string' && row.user_id !== userId) return

      const mapped = transformDbOrder(row)
      setOrders((prev) => {
        const filtered = prev.filter((order) => order.id !== mapped.id)
        return [mapped, ...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      })
    },
    onUpdate: (row) => {
      if (!isAdminMode && typeof userId === 'string' && row.user_id !== userId) return

      const mapped = transformDbOrder(row)
      setOrders((prev) => prev.map((order) => (order.id === mapped.id ? mapped : order)))
    },
    onDelete: (row) => {
      setOrders((prev) => prev.filter((order) => order.id !== row.id))
    },
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !isAdminMode) return
    sessionStorage.setItem(cacheKey, JSON.stringify(orders))
  }, [cacheKey, isAdminMode, orders])

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



    } catch (err) {
      console.error('[updateOrderStatus] Error:', err)
      throw err
    }
  }

  async function updateOrderNotes(orderId: string, notes: string) {
    // ✅ REMOVED: internal_notes field no longer exists in orders table
    console.warn('updateOrderNotes: internal_notes field has been removed from orders table')
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
