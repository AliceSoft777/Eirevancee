"use client"

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// Raw database types matching actual schema
interface DbProduct {
  id: string
  name: string
  slug: string
  subtitle: string | null
  description: string | null
  price: number | null
  image: string | null
  category_id: string | null
  stock: number
  status: string
  low_stock_threshold: number
  is_clearance: boolean // ✅ NEW: Boolean flag for clearance sale
  assigned_code: string | null
  model: string | null
  material: string | null
  size: string | null
  finish: string | null
  thickness: string | null
  sqm_per_box: string | null
  application_area: string | null
  created_at: string
  updated_at: string
}

// Transformed Product type for UI
export interface Product {
  id: string
  name: string
  slug: string
  subtitle: string | null
  description: string | null
  price: number
  image: string | null
  images?: string[] // For ProductClient compatibility
  category_id: string | null
  stock: number
  status: string
  low_stock_threshold: number
  is_clearance: boolean // ✅ NEW: Boolean flag for clearance sale
  cost_price?: number | null
  assigned_code: string | null
  model: string | null
  material: string | null
  size: string | null
  finish: string | null
  thickness: string | null
  sqm_per_box: string | null
  application_area: string | null
  inStock: boolean
  created_at: string
  updated_at: string
  // For category display
  categories?: { name: string; parent_id: string | null } | null
  categoryName?: string | null
  // Deprecated/legacy fields (for backward compatibility)
  rating?: number
  reviews?: number
  pricePerSqm?: number | null
  coverage?: string | null
  subcategory?: string | null
}

// Transform raw DB product to UI Product
function transformProduct(dbProduct: any): Product {
  // Get primary image from product_images array
  const primaryImageFromTable = dbProduct.product_images?.find((img: any) => img.is_primary)?.image_url
  
  // If no primary image in product_images, use first uploaded image
  const firstUploadedImage = dbProduct.product_images?.[0]?.image_url
  
  // Fallback to image column, but STRIP timestamp query parameter if present
  let fallbackImage = dbProduct.image
  if (fallbackImage && fallbackImage.includes('?t=')) {
    // Remove the timestamp query parameter that causes 400 errors
    fallbackImage = fallbackImage.split('?t=')[0]
  }
  
  // Priority: primary image > first uploaded image > clean image column
  const primaryImage = primaryImageFromTable || firstUploadedImage || fallbackImage
  
  // All images: from product_images table OR from image column (cleaned)
  const allImages = dbProduct.product_images?.map((img: any) => img.image_url).filter(Boolean) || 
                   (primaryImage ? [primaryImage] : [])
  
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    subtitle: dbProduct.subtitle,
    description: dbProduct.description,
    price: dbProduct.price || 0,
    image: primaryImage,
    images: allImages,
    category_id: dbProduct.category_id,
    stock: dbProduct.stock,
    status: dbProduct.status,
    low_stock_threshold: dbProduct.low_stock_threshold,
    is_clearance: dbProduct.is_clearance,
    cost_price: dbProduct.cost_price,
    assigned_code: dbProduct.assigned_code,
    model: dbProduct.model,
    material: dbProduct.material,
    size: dbProduct.size,
    finish: dbProduct.finish,
    thickness: dbProduct.thickness,
    sqm_per_box: dbProduct.sqm_per_box,
    application_area: dbProduct.application_area,
    inStock: dbProduct.stock > 0,
    created_at: dbProduct.created_at,
    updated_at: dbProduct.updated_at,
    categories: dbProduct.categories || null,
    categoryName: dbProduct.categories?.name || null,
    // Legacy fields for backward compatibility
    rating: 0,
    reviews: 0,
    pricePerSqm: dbProduct.sqm_per_box ? (dbProduct.price || 0) : null, // If it has sqm_per_box, it handles SQM pricing
    coverage: dbProduct.sqm_per_box || null, // Map sqm_per_box to coverage for compatibility
    subcategory: null,
  }
}

export function useProducts() {
  const supabase = getSupabaseBrowserClient()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchProducts() {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch products with category info and images
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*, categories!category_id(name, parent_id), product_images!left(id, image_url, is_primary, display_order)')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Transform each product
      const transformedProducts = (data || []).map((p: any) => transformProduct(p))

      setProducts(transformedProducts)
    } catch (err: any) {
      console.error('Error fetching products:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch only - products don't change on login/logout
    fetchProducts()
  }, [])

  async function addProduct(product: Partial<Product>) {
    // Generate slug from name if not provided
    const slug = product.slug || product.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${Date.now()}`
    
    // Only include fields that exist in the database
    const dbProduct = {
      name: product.name || '',
      slug,
      subtitle: product.subtitle,
      description: product.description,
      price: product.price,
      image: product.image,
      category_id: product.category_id,
      stock: product.stock || 0,
      status: product.status || 'active',
      low_stock_threshold: product.low_stock_threshold || 5,
      assigned_code: product.assigned_code,
      material: product.material,
      size: product.size,
      finish: product.finish,
      thickness: product.thickness,
      sqm_per_box: product.sqm_per_box,
      application_area: product.application_area,
    }
    
    const { data: newProduct, error: productError} = await supabase
      .from('products')
      .insert([dbProduct] as any)
      .select()
      .single()

    if (productError) throw productError
    
    // Refetch to get complete data
    await fetchProducts()
    return newProduct
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    // Only include fields that exist in the database
    const dbUpdates: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'slug', 'subtitle', 'description', 'price', 'image',
      'category_id', 'stock', 'status', 'low_stock_threshold',
      'assigned_code', 'material', 'size', 'finish', 'thickness',
      'sqm_per_box', 'application_area', 'is_clearance' // ✅ Added is_clearance
    ]
    
    for (const field of allowedFields) {
      if (field in updates) {
        dbUpdates[field] = (updates as Record<string, unknown>)[field]
      }
    }

    // Add updated_at timestamp
    dbUpdates['updated_at'] = new Date().toISOString()

    if (Object.keys(dbUpdates).length === 0) {
      throw new Error('No valid fields to update')
    }
    
    const { data, error: updateError } = await (supabase as any)
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')

    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error(updateError.message || 'Failed to update product')
    }

    if (!data || data.length === 0) {
      throw new Error('Product not found or update failed')
    }
    
    // Refetch to get complete data with relations
    await fetchProducts()
    return data[0]
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  function getLowStockProducts() {
    return products.filter(p => p.stock <= p.low_stock_threshold)
  }

  // ✅ NEW: Get only clearance products
  function getClearanceProducts() {
    return products.filter(p => p.is_clearance === true && p.status === 'active')
  }

  // ✅ NEW: Get products from specific category EXCLUDING clearance products
  function getProductsByCategoryExcludingClearance(categoryId: string) {
    return products.filter(p => 
      p.category_id === categoryId && 
      p.status === 'active' && 
      p.is_clearance !== true
    )
  }

  return {
    products,
    isLoading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    getClearanceProducts, // ✅ NEW
    getProductsByCategoryExcludingClearance, // ✅ NEW
    refetch: fetchProducts
  }
}
