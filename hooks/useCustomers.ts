"use client"

import { useEffect, useState, useCallback } from 'react'
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

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // 1. Get Customer Role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'customer')
        .single()
      
      if (roleError) throw roleError
      const customerRoleId = roleData.id

      // 2. Fetch Profiles and Orders in parallel for better performance
      const [profilesResult, ordersResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, phone, created_at')
          .eq('role_id', customerRoleId)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('user_id, total, created_at, customer_phone')
      ])

      if (profilesResult.error) throw profilesResult.error
      
      const profiles = profilesResult.data
      const orders = ordersResult.data || []

      if (!profiles || profiles.length === 0) {
        setCustomers([])
        setIsLoading(false)
        return
      }

      // 3. Aggregate Data (client-side - fast since data is already loaded)
      const customerData = profiles.map(profile => {
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

      setCustomers(customerData)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customers')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers,
    isLoading,
    error,
    refetch: fetchCustomers
  }
}
