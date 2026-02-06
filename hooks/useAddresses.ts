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
    if (userId) {
      fetchAddresses()
    } else {
      setIsLoading(false)
    }
  }, [userId])

  const fetchAddresses = async () => {
    if (!userId) {
      console.log('[useAddresses] ❌ No userId provided - skipping fetch')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('[useAddresses] 🔍 Fetching addresses for userId:', userId)
      console.log('[useAddresses] userId type:', typeof userId)
      
      const { data, error: fetchError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId as string)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('[useAddresses] ❌ Fetch error:', fetchError)
        console.error('[useAddresses] Error details:', { message: fetchError.message, code: fetchError.code, hint: fetchError.hint })
        throw fetchError
      }

      console.log('[useAddresses] ✅ Addresses found:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('[useAddresses] First address user_id:', data[0].user_id)
        console.log('[useAddresses] Comparing: fetched user_id === param userId?', data[0].user_id === userId)
      }

      setAddresses(data)
    } catch (err: any) {
      console.error('Error fetching addresses details:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        userId: userId
      })
      setError(err.message || 'An unknown error occurred while fetching addresses')
    } finally {
      setIsLoading(false)
    }
  }

  const addAddress = async (address: Omit<UserAddress, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      if (!userId) throw new Error("User not authenticated")
      
      console.log('[useAddresses.addAddress] 🔍 Adding address for userId:', userId)
      console.log('[useAddresses.addAddress] Address data:', {
        full_name: address.full_name,
        street: address.street,
        city: address.city,
        pincode: address.pincode,
        phone: address.phone
      })

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
      
      console.log('[useAddresses.addAddress] ✅ Address inserted', {
        id: data?.id,
        user_id: data?.user_id,
        full_name: data?.full_name
      })

      await fetchAddresses()
      return data
    } catch (err: any) {
      console.error('[useAddresses.addAddress] ❌ Error:', {
        message: err.message,
        code: err.code,
        details: err.details
      })
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
