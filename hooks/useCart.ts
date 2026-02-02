"use client"

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from "@/lib/supabase"
import useStore from "@/hooks/useStore"

const supabase = getSupabaseBrowserClient()

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  product_price: number
  product_image: string | null
  quantity: number
  reserved_until: string | null
  created_at: string
  updated_at: string
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  // Sync to global store
  const setCartCountInStore = useStore((state) => state.setCartCount)
  const hasHydrated = useStore((state) => state._hasHydrated)

  // Only fetch once after hydration
  useEffect(() => {
    if (!hasHydrated || hasFetched) return

    const fetchCart = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setCartItems([])
          setIsLoading(false)
          setHasFetched(true)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setCartItems(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cart')
        setCartItems([])
      } finally {
        setIsLoading(false)
        setHasFetched(true)
      }
    }

    fetchCart()
  }, [hasHydrated, hasFetched])

  // Sync cart count to store
  useEffect(() => {
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    setCartCountInStore(count)
  }, [cartItems, setCartCountInStore])

  async function addToCart(item: {
    product_id: string
    variant_id?: string | null
    product_name: string
    product_price: number
    product_image?: string | null
    quantity?: number
  }) {
    console.log('[useCart] addToCart starting for product:', item.product_id);
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('[useCart] No user found for addToCart');
      throw new Error('Must be logged in to add to cart')
    }

    console.log('[useCart] User:', user.id, '| Product:', item.product_id);

    // Check if item already exists in cart
    const existingItem = (cartItems || []).find(
      ci => ci.product_id === item.product_id && ci.variant_id === (item.variant_id || null)
    )

    if (existingItem) {
      console.log('[useCart] Item already in cart, updating quantity. ID:', existingItem.id);
      return await updateQuantity(existingItem.id, existingItem.quantity + (item.quantity || 1))
    }

    console.log('[useCart] Inserting new item into cart_items...');
    console.log('[useCart] Payload:', {
      user_id: user.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      product_name: item.product_name || 'Unknown Item',
      product_price: item.product_price || 0,
      product_image: item.product_image || null,
      quantity: item.quantity || 1
    });

    // Insert new item
    const { data: insertData, error: insertError } = await (supabase as any)
      .from('cart_items')
      .insert([{
        user_id: user.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: item.product_name || 'Unknown Item',
        product_price: item.product_price || 0,
        product_image: item.product_image || null,
        quantity: item.quantity || 1
      }])
      .select()
      .single()

    if (insertError) {
      console.error('[useCart] Supabase insert error:', insertError)
      console.error('[useCart] Error code:', insertError.code)
      console.error('[useCart] Error message:', insertError.message)
      console.error('[useCart] Error details:', insertError.details)
      throw new Error(`Failed to add to cart: ${insertError.message}`)
    }
    
    console.log('[useCart] Insert success:', insertData);
    const resultItem = insertData as unknown as CartItem
    setCartItems(prev => [resultItem, ...prev])
    return resultItem
  }

  async function updateQuantity(id: string, quantity: number) {
    if (quantity < 1) {
      return await removeFromCart(id)
    }

    const { data, error } = await (supabase as any)
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[useCart] Error updating cart quantity:', error)
      throw error
    }
    setCartItems(prev => prev.map(item => item.id === id ? data : item))
    return data
  }

  async function removeFromCart(id: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)

    if (error) throw error
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  async function clearCart() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
    setCartItems([])
  }

  function getCartTotal() {
    return cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0)
  }

  function getCartCount() {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  return {
    cartItems,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  }
}
