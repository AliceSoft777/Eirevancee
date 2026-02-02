"use client"

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { CouponFormData } from '@/components/admin/CouponDialog'

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
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

  useEffect(() => {
    fetchCoupons()
  }, [])

  async function fetchCoupons() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCoupons(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function addCoupon(coupon: CouponFormData) {
    const { data, error } = await supabase
      .from('coupons')
      .insert([{ ...coupon, used_count: 0, status: 'active' }])
      .select()
      .single()

    if (error) throw error
    setCoupons(prev => [data, ...prev])
    return data
  }

  async function updateCoupon(id: string, updates: Partial<CouponFormData>) {
    const { data, error } = await supabase
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
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

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
