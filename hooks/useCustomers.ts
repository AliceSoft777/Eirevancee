"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  totalOrders: number
  totalSpent: number
  joinedAt: string
  lastOrderDate: string | null
}

export function useCustomers() {
  const supabase = getSupabaseBrowserClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // 1. Get Customer Role ID
      const roleResult = await (supabase
        .from('roles') as any)
        .select('id')
        .eq('name', 'customer')
        .single()
      
      if (!mountedRef.current) return
      if (!roleResult || roleResult.error) throw roleResult?.error || new Error('Failed to fetch roles')
      const customerRoleId = roleResult.data.id

      // 2. Fetch Profiles and Orders in parallel for better performance
      const [profilesResult, ordersResult] = await Promise.all([
        (supabase
          .from('profiles') as any)
          .select('id, email, full_name, phone, created_at')
          .eq('role_id', customerRoleId)
          .order('created_at', { ascending: false }),
        (supabase
          .from('orders') as any)
          .select('user_id, total, created_at, customer_phone')
      ])

      if (!mountedRef.current) return
      if (!profilesResult || profilesResult.error) throw profilesResult?.error || new Error('Failed to fetch profiles')
      
      const profiles = profilesResult.data
      const orders = ordersResult?.data || []

      if (!profiles || profiles.length === 0) {
        if (mountedRef.current) { setCustomers([]); setIsLoading(false) }
        return
      }

      // 3. Aggregate Data (client-side - fast since data is already loaded)
      const customerData = profiles.map((profile: any) => {
        const userOrders = orders.filter((o: any) => o.user_id === profile.id)
        
        const totalOrders = userOrders.length
        const totalSpent = userOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
        
        // Find phone
        let phone = profile.phone || null
        if (!phone && userOrders.length > 0) {
          phone = userOrders[0].customer_phone
        }

        const lastOrder = userOrders.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        return {
          id: profile.id,
          name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
          email: profile.email,
          phone: phone || 'N/A',
          totalOrders,
          totalSpent,
          joinedAt: profile.created_at,
          lastOrderDate: lastOrder ? lastOrder.created_at : null
        }
      })

      if (mountedRef.current) setCustomers(customerData)
    } catch (err: any) {
      if (mountedRef.current) setError(err.message || 'Failed to fetch customers')
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchCustomers()
    return () => { mountedRef.current = false }
  }, [fetchCustomers])

  // Auto-retry: if loading stays stuck for 5s, retry
  useEffect(() => {
    if (!isLoading) return
    const t = setTimeout(() => { if (mountedRef.current && isLoading) fetchCustomers() }, 5000)
    return () => clearTimeout(t)
  }, [isLoading, fetchCustomers])

  return {
    customers,
    isLoading,
    error,
    refetch: fetchCustomers
  }
}
