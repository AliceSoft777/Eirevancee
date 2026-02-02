import { createServerSupabase } from '@/lib/supabase/server'
import type { Category, Product } from "@/lib/supabase-types"


/**
 * Server-side data loaders - single source of truth
 * These functions run ONLY on the server and pass data via props to client components.
 */

export interface ServerSession {
  userId: string | null
  userName: string | null
  userEmail: string | null
  userRole: 'customer' | 'sales' | 'admin'
}

export interface CartItemData {
  id: string
  product_id: string
  variant_id: string | null
  product_name: string
  product_price: number
  product_image: string | null
  quantity: number
}

export interface WishlistItemData {
  id: string
  product_id: string
}

/**
 * Get current user session from Supabase auth
 */
export async function getServerSession(): Promise<ServerSession> {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { userId: null, userName: null, userEmail: null, userRole: 'customer' }
    }

    // Fetch profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()

    const profileData = profile as Record<string, unknown> | null
    const rolesData = profileData?.roles as { name?: string } | undefined
    const roleName = (rolesData?.name || 'customer') as 'customer' | 'sales' | 'admin'

    return {
      userId: user.id,
      userName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      userEmail: user.email || null,
      userRole: roleName
    }
  } catch {
    return { userId: null, userName: null, userEmail: null, userRole: 'customer' }
  }
}

/**
 * Category with children for hierarchical navigation
 */
export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[]
}

/**
 * Get navigation data (categories) as a TREE structure.
 * Root categories have `children` arrays containing subcategories.
 */
export async function getNavData(): Promise<{ categories: CategoryWithChildren[] }> {
  try {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, image, description, created_at')
      .order('name', { ascending: true })

    if (error) {
      console.error('getNavData error:', error)
      return { categories: [] }
    }

    if (!data || data.length === 0) {
      return { categories: [] }
    }

    const typedData = data as Category[]

    const map = new Map<string, CategoryWithChildren>()
    const roots: CategoryWithChildren[] = []

    // create nodes
    for (const cat of typedData) {
      map.set(cat.id, {
        ...cat,
        children: []
      })
    }

    // link parents
    for (const cat of typedData) {
      const node = map.get(cat.id)!
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    // Custom sort order
    const ORDER = [
      "clearance",
      "tiles",
      "laminates",
      "wall panels",
      "mirrors",
      "vanity units",
      "accessories"
    ]

    roots.sort((a, b) => {
      const nameA = a.name.toLowerCase().trim()
      const nameB = b.name.toLowerCase().trim()
      
      const indexA = ORDER.indexOf(nameA)
      const indexB = ORDER.indexOf(nameB)
      
      // If both are found in the list, sort by index
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      
      // If only A is found, it comes first
      if (indexA !== -1) return -1
      
      // If only B is found, it comes first
      if (indexB !== -1) return 1
      
      // If neither is found, sort alphabetically
      return nameA.localeCompare(nameB)
    })

    return { categories: roots }
  } catch (err) {
    console.error('getNavData fatal:', err)
    return { categories: [] }
  }
}

/**
 * Get products for display
 */
export async function getProducts(): Promise<{ products: Product[] }> {
  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { products: (data || []) as Product[] }
  } catch {
    return { products: [] }
  }
}

/**
 * Get cart items for user
 */
export async function getCartData(userId: string | null): Promise<{ cart: CartItemData[]; cartCount: number }> {
  if (!userId) {
    return { cart: [], cartCount: 0 }
  }

  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, product_id, variant_id, product_name, product_price, product_image, quantity')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    const cart = (data || []) as CartItemData[]
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    
    return { cart, cartCount }
  } catch {
    return { cart: [], cartCount: 0 }
  }
}

/**
 * Get wishlist items for user
 */
export async function getWishlistData(userId: string | null): Promise<{ wishlist: WishlistItemData[]; wishlistCount: number }> {
  if (!userId) {
    return { wishlist: [], wishlistCount: 0 }
  }

  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('id, product_id')
      .eq('user_id', userId)

    if (error) throw error
    
    const wishlist = (data || []) as WishlistItemData[]
    
    return { wishlist, wishlistCount: wishlist.length }
  } catch {
    return { wishlist: [], wishlistCount: 0 }
  }
}

/**
 * Combined loader for home page - fetches all required data in parallel
 */
export async function getHomePageData() {
  const [session, { categories }, { products }] = await Promise.all([
    getServerSession(),
    getNavData(),
    getProducts()
  ])

  const [{ cart, cartCount }, { wishlist, wishlistCount }] = await Promise.all([
    getCartData(session.userId),
    getWishlistData(session.userId)
  ])

  return {
    session,
    categories,
    products,
    cart,
    cartCount,
    wishlist,
    wishlistCount
  }
}
