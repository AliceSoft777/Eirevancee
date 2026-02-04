"use client"

import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import type { CategoryWithChildren } from "@/lib/loaders"
import type { Product } from "@/lib/supabase-types"

interface ProductsOnlyMegaMenuProps {
    category: CategoryWithChildren
    products: Product[]
}

/**
 * Mega Menu for categories WITHOUT subcategories
 * Shows products directly instead of subcategory cards
 * Layout: Left sidebar (category name + View All + Trending Now) + Right (4 product cards)
 */
export function ProductsOnlyMegaMenu({ category, products }: ProductsOnlyMegaMenuProps) {
    // Filter active products for this category (exclude clearance)
    const categoryProducts = products.filter(
        p => p.category_id === category.id && 
             p.status === 'active' &&
             p.is_clearance !== true
    )

    // Get featured products for right grid (4 products)
    const featuredProducts = categoryProducts.slice(0, 4)
    
    // Get trending now products for left sidebar (3 products, offset to avoid duplicates)
    const trendingProducts = categoryProducts.slice(4, 7)
    return (
        <div className="w-full bg-white shadow-2xl border-t border-gray-100 py-8">
            <div className="container mx-auto max-w-[1400px] px-4">
                <div className="grid grid-cols-12 gap-8">
                    {/* Left Sidebar: Category Info & Trending Products */}
                    <div className="col-span-3 flex flex-col gap-8 border-r border-gray-100 pr-8">
                        {/* Category Header */}
                        <div>
                            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-primary">
                                {category.name}
                            </h4>
                            <ul className="space-y-2.5">
                                <li>
                                    <Link
                                        href={`/${category.slug}`}
                                        className="text-primary font-bold text-[13px] uppercase tracking-wide hover:underline"
                                    >
                                        View All {category.name}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Trending Now Products (Vertical - 3 products) */}
                        {trendingProducts.length > 0 && (
                            <div>
                                <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-primary">
                                    Trending Now
                                </h4>
                                <div className="space-y-4">
                                    {trendingProducts.map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/product/${product.slug}`}
                                            className="flex gap-4 group"
                                        >
                                            <div className="relative w-16 h-16 flex-shrink-0 rounded border border-gray-100 overflow-hidden bg-gray-50">
                                                {product.image ? (
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                        sizes="64px"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <span className="text-xs">No Img</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                    {product.name}
                                                </h5>
                                                <p className="text-sm text-primary font-bold mt-1">
                                                    {formatPrice(product.price)}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Content: Product Cards Grid (4 products like subcategory cards) */}
                    <div className="col-span-9">
                        <div className="grid grid-cols-4 gap-5">
                            {featuredProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.slug}`}
                                    className="group relative block overflow-hidden rounded-md bg-gray-50 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="aspect-[4/3] w-full relative">
                                        {product.image ? (
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                <span className="text-xs uppercase">No Image</span>
                                            </div>
                                        )}
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                                    </div>
                                    
                                    <div className="p-3 bg-white text-center border-t border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide group-hover:text-primary transition-colors line-clamp-1">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-primary font-bold mt-1">
                                            {formatPrice(product.price)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
