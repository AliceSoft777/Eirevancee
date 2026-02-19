import { createServerSupabase } from "@/lib/supabase/server"
import { getNavData, type CategoryWithChildren } from "@/lib/loaders"
import { ProductCard } from "@/components/products/product-card"
import { CategoryFilters, type FilterGroup } from "@/components/products/category-filters"
import { Product } from "@/lib/supabase-types"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const revalidate = 60

// Helper to collect all category IDs (parent + all descendants)
function getAllCategoryIds(category: CategoryWithChildren): string[] {
  const ids = [category.id]
  for (const child of category.children) {
    ids.push(...getAllCategoryIds(child))
  }
  return ids
}

// Find a category by ID in the tree structure
function findCategoryById(categories: CategoryWithChildren[], id: string): CategoryWithChildren | null {
  for (const cat of categories) {
    if (cat.id === id) return cat
    const found = findCategoryById(cat.children, id)
    if (found) return found
  }
  return null
}

const PRODUCTS_PER_PAGE = 24

const PRICE_OPTIONS = [
  { label: "Under €20", value: "0-20" },
  { label: "€20 – €40", value: "20-40" },
  { label: "€40 – €60", value: "40-60" },
  { label: "Over €60", value: "60-5000" },
]

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function AllProductsPage(props: Props) {
  const supabase = await createServerSupabase()

  // Resolve search params
  const resolvedSearchParams = await props.searchParams
  const params: Record<string, string> = {}
  for (const [k, v] of Object.entries(resolvedSearchParams || {})) {
    if (v) params[k] = v
  }

  const currentPage = parseInt(params.page || '1', 10)
  const offset = (currentPage - 1) * PRODUCTS_PER_PAGE

  // Get categories for hierarchical filtering
  const { categories } = await getNavData()

  // Build query with filters
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  // Category filter: include parent category AND all its subcategories
  if (params.category) {
    const selectedCategory = findCategoryById(categories, params.category)
    if (selectedCategory) {
      const categoryIds = getAllCategoryIds(selectedCategory)
      query = query.in('category_id', categoryIds)
    } else {
      // Fallback to exact match if category not found in tree
      query = query.eq('category_id', params.category)
    }
  }
  if (params.material) query = query.eq('material', params.material)
  if (params.finish) query = query.eq('finish', params.finish)
  if (params.application_area) query = query.eq('application_area', params.application_area)
  if (params.size) query = query.eq('size', params.size)
  if (params.brand) query = query.eq('brand', params.brand)

  if (params.price) {
    const [min, max] = params.price.split('-').map(Number)
    if (!isNaN(min)) query = query.gte('price', min)
    if (!isNaN(max)) query = query.lte('price', max)
  }

  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + PRODUCTS_PER_PAGE - 1)

  const { data: productsRaw, count } = await query
  const products: Product[] = productsRaw ?? []
  const totalProducts = count ?? 0
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE)

  // Build filter groups from ALL products (unfiltered)
  const { data: allProductsRaw } = await supabase
    .from('products')
    .select('material, finish, size, application_area, brand, category_id')
    .eq('status', 'active')

  const allProds = allProductsRaw ?? []
  const uniqueValues = (field: string) => {
    const vals = allProds
      .map((p: Record<string, unknown>) => p[field])
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    return [...new Set(vals)].sort()
  }

  const filterGroups: FilterGroup[] = []

  // Category filter (top-level categories)
  if (categories.length > 0) {
    filterGroups.push({
      id: "category",
      label: "Category",
      options: categories.map((c) => ({ label: c.name, value: c.id })),
    })
  }

  const materials = uniqueValues("material")
  if (materials.length > 1) {
    filterGroups.push({
      id: "material",
      label: "Material",
      options: materials.map((m) => ({ label: m, value: m })),
    })
  }

  const finishes = uniqueValues("finish")
  if (finishes.length > 1) {
    filterGroups.push({
      id: "finish",
      label: "Finish",
      options: finishes.map((f) => ({ label: f, value: f })),
    })
  }

  const areas = uniqueValues("application_area")
  if (areas.length > 1) {
    filterGroups.push({
      id: "application_area",
      label: "Usage",
      options: areas.map((a) => ({ label: a, value: a })),
    })
  }

  filterGroups.push({ id: "price", label: "Price", options: PRICE_OPTIONS })



  // Pagination URL builder
  const buildPageUrl = (pageNum: number) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (k !== 'page') p.set(k, v)
    }
    if (pageNum > 1) p.set('page', pageNum.toString())
    const qs = p.toString()
    return `/products${qs ? `?${qs}` : ''}`
  }

  return (
    <>
      <main className="bg-background min-h-screen">
        <div className="container mx-auto max-w-[1400px] px-4 py-12">
          <div className="mb-4 border-b border-border pb-4">
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">All Products</h1>
            <p className="text-muted-foreground">Browse our complete collection</p>
          </div>

          {/* Filters & Sort */}
          <CategoryFilters
            pathname="/products"
            currentParams={params}
            filterGroups={filterGroups}
            totalProducts={totalProducts}
          />

          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-2">
                  {currentPage > 1 && (
                    <Button variant="outline" asChild>
                      <Link href={buildPageUrl(currentPage - 1)} prefetch={false}>Previous</Link>
                    </Button>
                  )}

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const showPage =
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - currentPage) <= 1

                      if (!showPage) {
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="px-3 py-2">...</span>
                        }
                        return null
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          asChild={pageNum !== currentPage}
                          disabled={pageNum === currentPage}
                          className={pageNum === currentPage ? "bg-primary text-white" : ""}
                        >
                          {pageNum === currentPage ? (
                            <span>{pageNum}</span>
                          ) : (
                            <Link href={buildPageUrl(pageNum)} prefetch={false}>{pageNum}</Link>
                          )}
                        </Button>
                      )
                    })}
                  </div>

                  {currentPage < totalPages && (
                    <Button variant="outline" asChild>
                      <Link href={buildPageUrl(currentPage + 1)} prefetch={false}>Next</Link>
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No products found matching your filters.</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
