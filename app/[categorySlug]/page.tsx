import { notFound } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"
import { getNavData, getServerSession, getCartData, getWishlistData } from "@/lib/loaders"
import { ProductCard } from "@/components/products/product-card"
import { ProductFilters } from "@/components/products/product-filters"
import { Product, Category } from "@/lib/supabase-types"
import { getProducts } from "@/lib/loaders";


// Reserved slugs that should not be handled by this dynamic route
const RESERVED_SLUGS = [
  'cart', 'wishlist', 'login', 'register', 'product', 'admin', 
  'account', 'checkout', 'about', 'contact', 'faq', 'terms', 
  'privacy', 'returns', 'delivery', 'trade', 'clearance', 'payment',
  'test-supabase'
]

interface Props {
  params: Promise<{ categorySlug: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function CategoryPage(props: Props) {
  const { categorySlug } = await props.params
  
  // Block reserved slugs - let other routes handle them
  if (RESERVED_SLUGS.includes(categorySlug)) {
    notFound()
  }
  
  const supabase = await createServerSupabase()
  
  // Get category by slug
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', categorySlug)
    .single()
  
  if (catError || !category) {
    notFound()
  }

  const typedCategory = category as unknown as Category
  
  // Get all child category IDs (one level deep)
  const { data: childCategories } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', typedCategory.id)
    .returns<{ id: string }[]>()

  const categoryIds: string[] = [typedCategory.id]

  if (childCategories) {
    categoryIds.push(...childCategories.map(c => c.id))
  }
  
  // Get products for this category AND all child categories with filters
  let query = supabase
    .from('products')
    .select('*')
    .in('category_id', categoryIds)
    .eq('status', 'active')

  // Apply filters from searchParams
  const resolvedSearchParams = await props.searchParams
  const { material, finish, price, sort, application_area, tile_type } = resolvedSearchParams || {}

  if (material) {
      query = query.eq('material', material)
  }

  if (finish) {
      query = query.eq('finish', finish)
  }

  if (application_area) {
      query = query.eq('application_area', application_area)
  }

  if (tile_type) {
      // For now, mapping tile_type to a search in description or name if column doesn't exist
      // or if you have a specific mapping. Based on Excel, it might be subcategories.
      // query = query.ilike('description', `%${tile_type}%`)
  }

  if (price) {
      const [min, max] = price.split('-').map(Number)
      if (!isNaN(min) && !isNaN(max)) {
          query = query.gte('price', min).lte('price', max)
      } else if (!isNaN(min)) {
           // Handle "Over X" case (e.g. "60-1000")
           query = query.gte('price', min)
      }
  }
  
  // Apply sorting
  switch (sort) {
      case 'price_asc':
          query = query.order('price', { ascending: true })
          break
      case 'price_desc':
          query = query.order('price', { ascending: false })
          break
      case 'newest':
      default:
          query = query.order('created_at', { ascending: false })
          break
  }

 // Products for GRID (category only)
const { data: categoryProductsRaw } = await query
  const categoryProducts: Product[] = categoryProductsRaw ?? []
// FULL SITE PRODUCTS for mega-menu
const { products: allProducts } = await getProducts()

  
  // Get nav data and session for header
  const { categories } = await getNavData()
  const session = await getServerSession()

  
    const [{ cartCount }, { wishlistCount }] = await Promise.all([
    getCartData(session.userId),
    getWishlistData(session.userId),
  ])
  // Handle empty category with friendly message
  if (categoryProducts.length === 0) {
    return (
      <>
        <SiteHeader session={session} categories={categories} products={allProducts}/>
        <main className="bg-background min-h-screen">
          <div className="container mx-auto max-w-[1400px] px-4 py-12">
            <div className="mb-8 border-b border-border pb-4">
              <h1 className="text-3xl font-serif font-bold text-primary mb-2">{typedCategory.name}</h1>
              {typedCategory.description && (
                <p className="text-muted-foreground">{typedCategory.description}</p>
              )}
            </div>
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No products available in this category yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for new arrivals.</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }
  
  return (
    <>
      <SiteHeader
  session={session}
  categories={categories}
  products={allProducts}
  initialCartCount={cartCount}
  initialWishlistCount={wishlistCount}
/>
      <main className="bg-background min-h-screen">
        <div className="container mx-auto max-w-[1400px] px-4 py-12">
          <div className="mb-8 border-b border-border pb-4">
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">{typedCategory.name}</h1>
            {typedCategory.description && (
              <p className="text-muted-foreground">{typedCategory.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">{categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}</p>
          </div>
          
          {/* Filters */}
          <ProductFilters />
          
          <div className="mt-6 mb-8 text-sm text-muted-foreground">
             Showing {categoryProducts.length} products
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categoryProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
