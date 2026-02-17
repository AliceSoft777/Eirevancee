"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export interface UserAddress {
  id: string
  user_id: string
  label: string | null
  full_name: string
  phone: string
  street: string

  city: string
  state: string
  pincode: string
  country: string | null
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export function useAddresses(userId: string | null) {
  const supabase = getSupabaseBrowserClient()
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setAddresses([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    const doFetch = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: fetchError } = await (supabase
          .from('customer_addresses') as any)
          .select('*')
          .eq('user_id', userId as string)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false })

        if (cancelled) return

        if (fetchError) {
          console.error('[useAddresses] Fetch error:', fetchError.message)
          throw fetchError
        }

        const typedData = (data ?? []) as UserAddress[]

        // Deduplicate by street+city+pincode (keep the newest)
        const seen = new Set<string>()
        const unique = typedData.filter(addr => {
          const key = `${addr.street.toLowerCase().trim()}|${addr.city.toLowerCase().trim()}|${addr.pincode.toLowerCase().trim()}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        setAddresses(unique)
      } catch (err: any) {
        if (cancelled) return
        console.error('[useAddresses] Error:', err.message)
        setError(err.message || 'Failed to fetch addresses')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    doFetch()

    return () => { cancelled = true }
  }, [userId])

  const fetchAddresses = async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await (supabase
        .from('customer_addresses') as any)
        .select('*')
        .eq('user_id', userId as string)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('[useAddresses] Fetch error:', fetchError.message)
        throw fetchError
      }

      const typedData = (data ?? []) as UserAddress[]

      // Deduplicate by street+city+pincode (keep the newest)
      const seen = new Set<string>()
      const unique = typedData.filter(addr => {
        const key = `${addr.street.toLowerCase().trim()}|${addr.city.toLowerCase().trim()}|${addr.pincode.toLowerCase().trim()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      setAddresses(unique)
    } catch (err: any) {
      console.error('[useAddresses] Error:', err.message)
      setError(err.message || 'Failed to fetch addresses')
    } finally {
      setIsLoading(false)
    }
  }

  const addAddress = async (address: Omit<UserAddress, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      if (!userId) throw new Error("User not authenticated")
      
      console.log('[useAddresses] Adding address for userId:', userId)

      const newAddress = {
        ...address,
        user_id: userId as string,
      }

      const { data, error: addError } = await (supabase as any)
        .from('customer_addresses')
        .insert([newAddress])
        .select()
        .single()

      if (addError) {
        console.error('[useAddresses.addAddress] ❌ Insert error:', {
          message: addError.message,
          code: addError.code,
          details: addError.details
        })
        throw addError
      }
      


      await fetchAddresses()
      return data
    } catch (err: any) {
      console.error('[useAddresses] Add address error:', err.message)
      throw err
    }
  }

  const deleteAddress = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      
      await fetchAddresses()
    } catch (err: any) {
      console.error('Error deleting address:', err)
      throw err
    }
  }

  return {
    addresses,
    isLoading,
    error,
    addAddress,
    deleteAddress,
    refetch: fetchAddresses
  }
}
