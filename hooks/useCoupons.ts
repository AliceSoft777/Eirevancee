"use client"

import { useEffect, useState, useRef } from 'react'
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
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    fetchCoupons()
    return () => { mountedRef.current = false }
  }, [])

  async function fetchCoupons() {
    if (inFlightRef.current) return

    try {
      inFlightRef.current = true
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/admin/coupons', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || `Failed to fetch coupons (${response.status})`)
      }

      const payload = await response.json()
      const data = Array.isArray(payload?.coupons) ? payload.coupons : []

      if (!mountedRef.current) return

      setCoupons(data)
    } catch (err: any) {
      if (mountedRef.current) setError(err.message)
    } finally {
      inFlightRef.current = false
      if (mountedRef.current) setIsLoading(false)
    }
  }

  async function addCoupon(coupon: CouponFormData) {
    const response = await fetch('/api/admin/coupons', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...coupon, used_count: 0, status: 'active' }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error || 'Failed to create coupon')
    }

    const payload = await response.json()
    const created = payload?.coupon as Coupon
    setCoupons(prev => [created, ...prev])
    return created
  }

  async function updateCoupon(id: string, updates: Partial<CouponFormData>) {
    const response = await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error || 'Failed to update coupon')
    }

    const payload = await response.json()
    const updated = payload?.coupon as Coupon
    setCoupons(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }

  async function deleteCoupon(id: string) {
    const response = await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error || 'Failed to delete coupon')
    }

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
