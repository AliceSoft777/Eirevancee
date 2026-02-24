"use client"

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parent_id: string | null
  created_at: string
}

export function useCategories() {
  const supabase = getSupabaseBrowserClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      setIsLoading(true)
      const result = await (supabase
        .from('categories') as any)
        .select('*')
        .order('name', { ascending: true })
      const { data, error } = result || {}

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function addCategory(category: Omit<Category, 'id' | 'created_at'>) {
    const result = await (supabase
      .from('categories') as any)
      .insert([category])
      .select()
      .single()
    const { data, error } = result || {}

    if (error) throw error
    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  async function updateCategory(id: string, updates: Partial<Category>) {
    const result = await (supabase
      .from('categories') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    const { data, error } = result || {}

    if (error) throw error
    setCategories(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  async function deleteCategory(id: string) {
    const result = await (supabase
      .from('categories') as any)
      .delete()
      .eq('id', id)
    const { error } = result || {}

    if (error) throw error
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return {
    categories,
    isLoading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  }
}
