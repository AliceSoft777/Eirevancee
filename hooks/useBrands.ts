"use client"

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  description: string | null
  created_at: string
}

export function useBrands() {
  const supabase = getSupabaseBrowserClient()
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBrands()
  }, [])

  async function fetchBrands() {
    try {
      setIsLoading(true)
      const result = await (supabase
        .from('brands') as any)
        .select('*')
        .order('name', { ascending: true })
      const { data, error } = result || {}

      if (error) throw error
      setBrands(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function addBrand(brand: Omit<Brand, 'id' | 'created_at'>) {
    const result = await (supabase
      .from('brands') as any)
      .insert([brand])
      .select()
      .single()
    const { data, error } = result || {}

    if (error) throw error
    setBrands(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  async function updateBrand(id: string, updates: Partial<Brand>) {
    const result = await (supabase
      .from('brands') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    const { data, error } = result || {}

    if (error) throw error
    setBrands(prev => prev.map(b => b.id === id ? data : b))
    return data
  }

  async function deleteBrand(id: string) {
    const result = await (supabase
      .from('brands') as any)
      .delete()
      .eq('id', id)
    const { error } = result || {}

    if (error) throw error
    setBrands(prev => prev.filter(b => b.id !== id))
  }

  return {
    brands,
    isLoading,
    error,
    addBrand,
    updateBrand,
    deleteBrand,
    refetch: fetchBrands
  }
}
