import { notFound } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase/server"
import { ProductCard } from "@/components/products/product-card"
import { CategoryFilters, type FilterGroup } from "@/components/products/category-filters"
import { Product, Category } from "@/lib/supabase-types"

export const revalidate = 60

const RESERVED_SLUGS = [
  'cart', 'wishlist', 'login', 'register', 'product', 'admin',
  'account', 'checkout', 'about', 'contact', 'faq', 'terms',
  'privacy', 'returns', 'delivery', 'trade', 'clearance', 'payment',
  'test-supabase'
]

const PRICE_OPTIONS = [
  { label: "Under €20", value: "0-20" },
  { label: "€20 – €40", value: "20-40" },
  { label: "€40 – €60", value: "40-60" },
  { label: "Over €60", value: "60-5000" },
]

function buildFilterGroups(
  products: Product[],
  childCategories: { id: string; name: string; slug: string }[]
): FilterGroup[] {
  const groups: FilterGroup[] = []

  const uniqueValues = (field: keyof Product) => {
    const values = products
      .map((p) => p[field])
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    return [...new Set(values)].sort()
  }

  // Sub-categories
  if (childCategories.length > 0) {
    groups.push({
      id: "subcategory",
      label: "Sub Category",
      options: childCategories.map((c) => ({ label: c.name, value: c.id })),
    })
  }

  // Only show filter group if ≥1 distinct value exists
  const material = uniqueValues("material")
  if (material.length >= 1) groups.push({ id: "material", label: "Material", options: material.map((m) => ({ label: m, value: m })) })

  const finish = uniqueValues("finish")
  if (finish.length >= 1) groups.push({ id: "finish", label: "Finish", options: finish.map((f) => ({ label: f, value: f })) })

  const size = uniqueValues("size")
  if (size.length >= 1) groups.push({ id: "size", label: "Size", options: size.map((s) => ({ label: s, value: s })) })

  const thickness = uniqueValues("thickness")
  if (thickness.length >= 1) groups.push({ id: "thickness", label: "Thickness", options: thickness.map((t) => ({ label: t, value: t })) })

  const area = uniqueValues("application_area")
  if (area.length >= 1) groups.push({ id: "application_area", label: "Usage", options: area.map((a) => ({ label: a, value: a })) })

  const brand = uniqueValues("brand")
  if (brand.length >= 1) groups.push({ id: "brand", label: "Brand", options: brand.map((b) => ({ label: b, value: b })) })

  groups.push({ id: "price", label: "Price", options: PRICE_OPTIONS })
  return groups
}

interface Props {
  params: Promise<{ categorySlug: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function CategoryPage(props: Props) {
  const { categorySlug } = await props.params

  if (RESERVED_SLUGS.includes(categorySlug)) notFound()

  const supabase = await createServerSupabase()

  // 1. Get category by slug
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', categorySlug)
    .single()

  if (catError || !category) notFound()
  const typedCategory = category as unknown as Category

  // 2. Get child categories (NO display_order — column doesn't exist)
  const { data: childCategoriesRaw } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('parent_id', typedCategory.id)
    .returns<{ id: string; name: string; slug: string }[]>()

  const childCategories = childCategoriesRaw ?? []

  // 3. Build category IDs: parent + all children
  const categoryIds = [typedCategory.id, ...childCategories.map((c) => c.id)]

  // 4. Read search params
  const resolvedSearchParams = await props.searchParams
  const params: Record<string, string> = {}
  for (const [k, v] of Object.entries(resolvedSearchParams || {})) {
    if (v) params[k] = v
  }

  // 5. Build filtered query
  let query = supabase
    .from('products')
    .select('*')
    .eq('status', 'active')

  if (params.subcategory) {
    query = query.eq('category_id', params.subcategory)
  } else {
    query = query.in('category_id', categoryIds)
  }

  if (params.material) query = query.eq('material', params.material)
  if (params.finish) query = query.eq('finish', params.finish)
  if (params.size) query = query.eq('size', params.size)
  if (params.thickness) query = query.eq('thickness', params.thickness)
  if (params.application_area) query = query.eq('application_area', params.application_area)
  if (params.brand) query = query.eq('brand', params.brand)

  if (params.price) {
    const [min, max] = params.price.split('-').map(Number)
    if (!isNaN(min)) query = query.gte('price', min)
    if (!isNaN(max)) query = query.lte('price', max)
  }

  switch (params.sort) {
    case 'price_asc': query = query.order('price', { ascending: true }); break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

  const { data: categoryProductsRaw } = await query
  const categoryProducts: Product[] = categoryProductsRaw ?? []

  // 6. Get ALL unfiltered products (for building filter option lists)
  const { data: allCategoryProductsRaw } = await supabase
    .from('products')
    .select('*')
    .in('category_id', categoryIds)
    .eq('status', 'active')

  const allCategoryProducts: Product[] = allCategoryProductsRaw ?? []

  // 7. Build filter groups from unfiltered products
  const filterGroups = buildFilterGroups(allCategoryProducts, childCategories)



  return (
    <>
      <main className="bg-background min-h-screen">
        <div className="container mx-auto max-w-[1400px] px-4 py-12">
          <div className="mb-4 border-b border-border pb-4">
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">{typedCategory.name}</h1>
            {typedCategory.description && (
              <p className="text-muted-foreground">{typedCategory.description}</p>
            )}
          </div>

          <CategoryFilters
            pathname={`/${categorySlug}`}
            currentParams={params}
            filterGroups={filterGroups}
            totalProducts={categoryProducts.length}
          />

          {categoryProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No products match the selected filters.</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting or clearing your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categoryProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
