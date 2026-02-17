import { createServerSupabase } from '@/lib/supabase/server'

export interface CartItem {
    id: string
    product_id: string
    variant_id: string | null
    product_name: string
    product_price: number
    product_image: string | null
    quantity: number
}

/**
 * Get cart items for a user - server-side function.
 * Uses the server Supabase client for cookie-based auth.
 */
export async function getCartForUser(): Promise<{ cart: CartItem[]; isLoggedIn: boolean }> {
    try {
        const supabase = await createServerSupabase()
        
        // Get current user
        const response = await supabase.auth.getUser()
        const user = response?.data?.user
        const authError = response?.error
        
        if (authError || !user) {
            return { cart: [], isLoggedIn: false }
        }

        // Fetch cart items for user
        const { data, error } = await supabase
            .from('cart_items')
            .select('id, product_id, variant_id, product_name, product_price, product_image, quantity')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching cart:', error)
            return { cart: [], isLoggedIn: true }
        }

        return { 
            cart: (data || []) as CartItem[], 
            isLoggedIn: true 
        }
    } catch (error) {
        console.error('Error in getCartForUser:', error)
        return { cart: [], isLoggedIn: false }
    }
}
