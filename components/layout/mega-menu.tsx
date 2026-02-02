"use client"

import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import type { CategoryWithChildren } from "@/lib/loaders"
import type { Product } from "@/lib/supabase-types"

interface MegaMenuProps {
    category: CategoryWithChildren
    products: Product[]
}

export function MegaMenu({ category, products }: MegaMenuProps) {
    // Children are already embedded in the category object
    const subcategories = category.children || []
    
    // Get all category IDs (parent + children) for product filtering
    const categoryIds = [category.id, ...subcategories.map(s => s.id)]
    
    // ✅ NEW: Filter featured products - EXCLUDE clearance products from mega menu
    // (Clearance products get their own dedicated section)
    const featuredProducts = products
        .filter(p => 
            categoryIds.includes(p.category_id || '') && 
            p.status === 'active' &&
            p.is_clearance !== true // ✅ Exclude clearance products
        )
        .slice(0, 6)

    return (
        <div className="w-full bg-white shadow-2xl border-t border-gray-100 py-8">
            <div className="container mx-auto max-w-[1400px] px-4">
                <div className="grid grid-cols-12 gap-8">
                    {/* Left Sidebar: Categories List & Featured Products */}
                    <div className="col-span-3 flex flex-col gap-8 border-r border-gray-100 pr-8">
                        {/* Categories List */}
                        <div>
                            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-primary">
                                {category.name} Categories
                            </h4>
                            <ul className="space-y-2.5">
                                {subcategories.map((sub) => (
                                    <li key={sub.id}>
                                        <Link
                                            href={`/${sub.slug}`}
                                            className="block text-gray-600 hover:text-primary transition-colors text-[13px] font-medium uppercase tracking-wide group flex items-center justify-between"
                                        >
                                            {sub.name}
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                        </Link>
                                    </li>
                                ))}
                                <li className="pt-2">
                                    <Link
                                        href={`/${category.slug}`}
                                        className="text-primary font-bold text-[13px] uppercase tracking-wide hover:underline"
                                    >
                                        View All {category.name}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Featured Products (Vertical) */}
                        {featuredProducts.length > 0 && (
                            <div>
                                <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-primary">
                                    Trending Now
                                </h4>
                                <div className="space-y-4">
                                    {featuredProducts.slice(0, 3).map((product) => (
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

                    {/* Right Content: Visual Categories Grid */}
                    <div className="col-span-9">
                        <div className="grid grid-cols-4 gap-5">
                            {subcategories.map((sub) => (
                                <Link
                                    key={sub.id}
                                    href={`/${sub.slug}`}
                                    className="group relative block overflow-hidden rounded-md bg-gray-50 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="aspect-[4/3] w-full relative">
                                        {sub.image ? (
                                            <Image
                                                src={sub.image}
                                                alt={sub.name}
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
                                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide group-hover:text-primary transition-colors">
                                            {sub.name}
                                        </h3>
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
