import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import ProductClient from "./ProductClient";

import type { Product } from "@/hooks/useProducts";
import type { Category } from "@/lib/supabase-types";

import {
  getNavData,
  getCartData,
  getWishlistData,
  getServerSession,
} from "@/lib/loaders";

/* ---------------------------------------------------
   Helpers
--------------------------------------------------- */

// Normalize DB → Product type (STRICT)
function transformProduct(dbProduct: Record<string, unknown>): Product {
  const rawCategories = dbProduct.categories as
    | { name?: string | null; parent_id?: string | null }
    | null;

  const categories = rawCategories
    ? {
        name: rawCategories.name ?? "",
        parent_id: rawCategories.parent_id ?? null,
      }
    : null;

  // ✅ BUILD IMAGES ARRAY FROM product_images TABLE
  const productImages = (dbProduct.product_images as Array<any>) ?? []
  const sortedImages = productImages.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  const allImages = sortedImages.map((img) => img.image_url).filter(Boolean) || []
  const primaryImage = sortedImages.find((img) => img.is_primary)?.image_url || allImages[0] || (dbProduct.image as string) || null
  const finalImages = allImages.length > 0 ? allImages : (dbProduct.image ? [dbProduct.image as string] : [])

  return {
    id: dbProduct.id as string,
    name: dbProduct.name as string,
    slug: dbProduct.slug as string,
    subtitle: (dbProduct.subtitle as string) ?? null,
    description: (dbProduct.description as string) ?? null,
    price: (dbProduct.price as number) || 0,
    image: primaryImage,
    images: finalImages,
    assigned_code: (dbProduct.assigned_code as string) ?? null,
    model: (dbProduct.model as string) ?? null,
    size: (dbProduct.size as string) ?? null,
    finish: (dbProduct.finish as string) ?? null,
    thickness: (dbProduct.thickness as string) ?? null,
    sqm_per_box: (dbProduct.sqm_per_box as string) ?? null,
    indoor_outdoor: (dbProduct.indoor_outdoor as string) ?? null,
    application_area: (dbProduct.application_area as string) ?? null,
    category_id: (dbProduct.category_id as string) ?? null,
    stock: (dbProduct.stock as number) || 0,
    low_stock_threshold: (dbProduct.low_stock_threshold as number) || 10,
    cost_price: (dbProduct.cost_price as number) ?? null,
    status: dbProduct.status as string,
    inStock: ((dbProduct.stock as number) || 0) > 0,
    created_at: dbProduct.created_at as string,
    updated_at: dbProduct.updated_at as string,

    categories,
    categoryName: categories?.name ?? null,

    // Legacy / compatibility fields
    rating: 0,
    reviews: 0,
    pricePerSqm: (dbProduct.sqm_per_box as string) ? ((dbProduct.price as number) || 0) : null,
    material: (dbProduct.material as string) ?? null,
    coverage: (dbProduct.sqm_per_box as string) ?? null,
    subcategory: null,
  };
}

// Flatten nested categories for header
function flattenCategories(categories: Category[]): Category[] {
  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parent_id: cat.parent_id ?? null,
    description: cat.description ?? null,
    image: cat.image ?? null,
    display_order: cat.display_order ?? 0,
    created_at: cat.created_at,
  }));
}

/* ---------------------------------------------------
   Page
--------------------------------------------------- */

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabase()

  // Header/session data
  const session = await getServerSession();
  const [{ cartCount }, { wishlistCount }] = await Promise.all([
    getCartData(session.userId),
    getWishlistData(session.userId),
  ]);

  const { categories: rawCategories } = await getNavData();
  const categories = flattenCategories(rawCategories);

  // Fetch product with product_images ✅
  const { data: rawProduct } = await supabase
    .from("products")
    .select(
      `
      *,
      categories(name, parent_id),
      product_images!left(id, image_url, is_primary, display_order)
    `
    )
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!rawProduct) notFound();

  const product = transformProduct(rawProduct as Record<string, unknown>);

  // Related products (SAFE for nullable category_id) ✅ with images
  const relatedQuery = supabase
    .from("products")
    .select(
      `
      *,
      categories(name, parent_id),
      product_images!left(id, image_url, is_primary, display_order)
    `
    )
    .eq("status", "active")
    .neq("id", product.id)
    .limit(4);

  if (product.category_id) {
    relatedQuery.eq("category_id", product.category_id);
  }

  const { data: rawRelatedProducts } = await relatedQuery;

  const relatedProducts = (rawRelatedProducts ?? []).map((p) =>
    transformProduct(p as Record<string, unknown>)
  );

  return (
    <ProductClient
      product={product}
      relatedProducts={relatedProducts}
      categories={categories as any}
      session={session}
      initialCartCount={cartCount}
      initialWishlistCount={wishlistCount}
    />
  );
}
