"use client"

import { useEffect, useState, useRef } from 'react'
import { supabaseBrowserClient } from "@/lib/supabase/client"
import useStore from "@/hooks/useStore"

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
  // Use the singleton client directly - no useMemo needed
  const supabase = supabaseBrowserClient
  
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get user from Zustand store - this is already synced and won't cause AbortError
  const storeUser = useStore((state) => state.user)
  const setCartCountInStore = useStore((state) => state.setCartCount)
  const hasHydrated = useStore((state) => state._hasHydrated)
  
  // Track previous user ID to detect login/logout changes
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  // Fetch cart when hydrated and when user changes
  useEffect(() => {
    if (!hasHydrated) return
    
    const currentUserId = storeUser?.id || null
    
    // Skip if user hasn't changed (but not on first run)
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current === currentUserId) {
      return
    }
    prevUserIdRef.current = currentUserId

    const fetchCart = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // No user = empty cart
        if (!currentUserId) {
          setCartItems([])
          setIsLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setCartItems(data || [])
      } catch (err: unknown) {
        // Ignore AbortError - it's a React concurrent mode artifact
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to fetch cart')
        setCartItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCart()
  }, [hasHydrated, storeUser?.id, supabase])

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
    
    // Use store user - this doesn't need an async call
    if (!storeUser?.id) {
      console.warn('[useCart] No user found in store for addToCart');
      throw new Error('Must be logged in to add to cart')
    }

    const userId = storeUser.id
    console.log('[useCart] User:', userId, '| Product:', item.product_id);

    // Check if item already exists in cart
    const existingItem = (cartItems || []).find(
      ci => ci.product_id === item.product_id && ci.variant_id === (item.variant_id || null)
    )

    if (existingItem) {
      console.log('[useCart] Item already in cart, updating quantity. ID:', existingItem.id);
      return await updateQuantity(existingItem.id, existingItem.quantity + (item.quantity || 1))
    }

    console.log('[useCart] Inserting new item into cart_items...');
    const payload = {
      user_id: userId,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      product_name: item.product_name || 'Unknown Item',
      product_price: item.product_price || 0,
      product_image: item.product_image || null,
      quantity: item.quantity || 1
    }
    console.log('[useCart] Payload:', payload);

    // Insert new item
    const { data: insertData, error: insertError } = await (supabase as any)
      .from('cart_items')
      .insert([payload])
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
