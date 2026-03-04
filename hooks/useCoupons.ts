"use client"

import { useEffect, useState, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { CouponFormData } from '@/components/admin/CouponDialog'

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_value: number | null
  usage_limit: number | null
  used_count: number
  status: 'active' | 'expired'
  expires_at: string | null
  created_at: string
}

export function useCoupons() {
  const supabase = getSupabaseBrowserClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    fetchCoupons()
    return () => { mountedRef.current = false }
  }, [])

  // Auto-retry: if loading stays stuck for 5s, retry
  useEffect(() => {
    if (!isLoading) return
    const t = setTimeout(() => { if (mountedRef.current && isLoading) fetchCoupons() }, 5000)
    return () => clearTimeout(t)
  }, [isLoading])

  async function fetchCoupons() {
    try {
      setIsLoading(true)
      const result = await (supabase
        .from('coupons') as any)
        .select('*')
        .order('created_at', { ascending: false })
      const { data, error } = result || {}

      if (!mountedRef.current) return
      if (error) throw error
      setCoupons(data || [])
    } catch (err: any) {
      if (mountedRef.current) setError(err.message)
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }

  async function addCoupon(coupon: CouponFormData) {
    const { data, error } = await (supabase as any)
      .from('coupons')
      .insert([{ ...coupon, used_count: 0, status: 'active' }])
      .select()
      .single()

    if (error) throw error
    setCoupons(prev => [data, ...prev])
    return data
  }

  async function updateCoupon(id: string, updates: Partial<CouponFormData>) {
    const { data, error } = await (supabase as any)
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setCoupons(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  async function deleteCoupon(id: string) {
    const result = await (supabase
      .from('coupons') as any)
      .delete()
      .eq('id', id)
    const { error } = result || {}

    if (error) throw error
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  return {
    coupons,
    isLoading,
    error,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    refetch: fetchCoupons
  }
}
