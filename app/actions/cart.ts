"use server"

import { createServerSupabase } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

export interface AddToCartInput {
  product_id: string
  variant_id?: string | null
  product_name: string
  product_price: number
  product_image?: string | null
  quantity?: number
}

/**
 * Fetch all cart items for the current user
 */
export async function fetchCartAction(): Promise<{ data: CartItem[] | null; error: string | null }> {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { data: [], error: null }
    }

    // Fetch cart items
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[fetchCartAction] Error:', error)
      return { data: null, error: error.message }
    }

    return { data: data as CartItem[], error: null }
  } catch (error: any) {
    console.error('[fetchCartAction] Exception:', error)
    return { data: null, error: error.message || 'Failed to fetch cart' }
  }
}

/**
 * Add item to cart (or update quantity if already exists)
 */
export async function addToCartAction(input: AddToCartInput): Promise<{ data: CartItem | null; error: string | null }> {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { data: null, error: 'Must be logged in to add to cart' }
    }

    // Check if item already exists in cart
    const { data: existingItems } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', input.product_id)
      .eq('variant_id', input.variant_id || null as any)
      .limit(1)

    // If exists, update quantity
    if (existingItems && existingItems.length > 0) {
      const existingItem = existingItems[0] as CartItem
      const newQuantity = existingItem.quantity + (input.quantity || 1)
      
      const { data: updatedData, error: updateError } = await (supabase as any)
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id)
        .select()
        .single()

      if (updateError) {
        console.error('[addToCartAction] Update error:', updateError)
        return { data: null, error: updateError.message }
      }

      revalidatePath('/cart')
      return { data: updatedData as CartItem, error: null }
    }

    // Insert new item
    const payload = {
      user_id: user.id,
      product_id: input.product_id,
      variant_id: input.variant_id || null,
      product_name: input.product_name,
      product_price: input.product_price,
      product_image: input.product_image || null,
      quantity: input.quantity || 1
    }

    const { data: insertData, error: insertError } = await (supabase as any)
      .from('cart_items')
      .insert([payload])
      .select()
      .single()

    if (insertError) {
      console.error('[addToCartAction] Insert error:', insertError)
      return { data: null, error: insertError.message }
    }

    revalidatePath('/cart')
    return { data: insertData as CartItem, error: null }
  } catch (error: any) {
    console.error('[addToCartAction] Exception:', error)
    return { data: null, error: error.message || 'Failed to add to cart' }
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartQuantityAction(cartItemId: string, quantity: number): Promise<{ data: CartItem | null; error: string | null }> {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { data: null, error: 'Must be logged in' }
    }

    // If quantity is 0 or less, remove the item
    if (quantity < 1) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('[updateCartQuantityAction] Delete error:', deleteError)
        return { data: null, error: deleteError.message }
      }

      revalidatePath('/cart')
      return { data: null, error: null }
    }

    // Update quantity
    const { data, error } = await (supabase as any)
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', cartItemId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[updateCartQuantityAction] Error:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/cart')
    return { data: data as CartItem, error: null }
  } catch (error: any) {
    console.error('[updateCartQuantityAction] Exception:', error)
    return { data: null, error: error.message || 'Failed to update quantity' }
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCartAction(cartItemId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'Must be logged in' }
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[removeFromCartAction] Error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/cart')
    return { success: true, error: null }
  } catch (error: any) {
    console.error('[removeFromCartAction] Exception:', error)
    return { success: false, error: error.message || 'Failed to remove from cart' }
  }
}

/**
 * Clear all items from cart
 */
export async function clearCartAction(): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'Must be logged in' }
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('[clearCartAction] Error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/cart')
    return { success: true, error: null }
  } catch (error: any) {
    console.error('[clearCartAction] Exception:', error)
    return { success: false, error: error.message || 'Failed to clear cart' }
  }
}
