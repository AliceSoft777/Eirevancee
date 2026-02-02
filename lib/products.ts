// This file is no longer needed - products come from Supabase
// Use hooks/useProducts.ts instead

export interface Product {
    id: string
    name: string
    slug: string
    subtitle: string
    description: string
    price: number
    pricePerSqm: number | null
    image: string
    images: string[]
    category: string
    subcategory: string
    material?: string
    finish?: string
    thickness?: string
    coverage?: string
    inStock: boolean
    rating: number
    reviews: number
}

// These functions are deprecated - use useProducts hook instead
export function getAllProducts(): Product[] {
    console.warn('getAllProducts() is deprecated. Use useProducts() hook instead.')
    return []
}

export function getProductBySlug(): Product | undefined {
    console.warn('getProductBySlug() is deprecated. Use useProducts() hook instead.')
    return undefined
}

export function getProductsByCategory(): Product[] {
    console.warn('getProductsByCategory() is deprecated. Use useProducts() hook instead.')
    return []
}

export function getRandomProducts(): Product[] {
    console.warn('getRandomProducts() is deprecated. Use useProducts() hook instead.')
    return []
}

export function getClearanceProducts(): Product[] {
    console.warn('getClearanceProducts() is deprecated. Use useProducts() hook instead.')
    return []
}