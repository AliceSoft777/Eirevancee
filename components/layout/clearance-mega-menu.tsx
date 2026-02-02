"use client"

import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/lib/supabase-types"

interface ClearanceMegaMenuProps {
    products: Product[]
    categories: Array<{ id: string; name: string; slug: string }>
}

export function ClearanceMegaMenu({ products, categories }: ClearanceMegaMenuProps) {
    // Filter only clearance products that are active
    const clearanceProducts = products.filter(
        p => (p.is_clearance === true || p.is_clearance === 'true') && p.status === 'active'
    )

    // Group clearance products by category
    const productsByCategory = categories.map(cat => ({
        category: cat,
        products: clearanceProducts.filter(p => p.category_id === cat.id)
    })).filter(group => group.products.length > 0) // Only show categories with clearance products

    // Get top 6 clearance products overall for featured section
    const featuredClearanceProducts = clearanceProducts.slice(0, 6)

    // If no clearance products, show empty state
    if (clearanceProducts.length === 0) {
        return (
            <div className="w-full bg-white shadow-2xl border-t border-gray-100 py-8">
                <div className="container mx-auto max-w-[1400px] px-4 text-center py-12">
                    <p className="text-gray-500 text-lg">No clearance products available at the moment</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full bg-white shadow-2xl border-t border-gray-100 py-8">
            <div className="container mx-auto max-w-[1400px] px-4">
                <div className="grid grid-cols-12 gap-8">
                    {/* Left Sidebar: Clearance Categories & Featured Products */}
                    <div className="col-span-3 flex flex-col gap-8 border-r border-gray-100 pr-8">
                        {/* Clearance Categories List */}
                        <div>
                            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-red-600">
                                🔥 Clearance Categories
                            </h4>
                            <ul className="space-y-2.5">
                                {productsByCategory.map((group) => (
                                    <li key={group.category.id}>
                                        <Link
                                            href={`/${group.category.slug}?clearance=true`}
                                            className="block text-gray-600 hover:text-red-600 transition-colors text-[13px] font-medium uppercase tracking-wide group flex items-center justify-between"
                                        >
                                            {group.category.name}
                                            <span className="text-red-500 font-bold">({group.products.length})</span>
                                        </Link>
                                    </li>
                                ))}
                                <li className="pt-2">
                                    <Link
                                        href="/clearance"
                                        className="text-red-600 font-bold text-[13px] uppercase tracking-wide hover:underline"
                                    >
                                        View All Clearance
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Featured Clearance Products (Vertical) */}
                        {featuredClearanceProducts.length > 0 && (
                            <div>
                                <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-red-600">
                                    Hot Deals
                                </h4>
                                <div className="space-y-4">
                                    {featuredClearanceProducts.slice(0, 3).map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/product/${product.slug}`}
                                            className="flex gap-4 group"
                                        >
                                            <div className="relative w-16 h-16 flex-shrink-0 rounded border border-red-200 overflow-hidden bg-red-50">
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
                                                <h5 className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                                                    {product.name}
                                                </h5>
                                                <p className="text-sm text-red-600 font-bold mt-1">
                                                    {formatPrice(product.price)}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Grid of Clearance Products by Category */}
                    <div className="col-span-9">
                        <div className="space-y-8">
                            {productsByCategory.map((group) => (
                                <div key={group.category.id}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                                            {group.category.name} Clearance
                                        </h3>
                                        <Link
                                            href={`/${group.category.slug}?clearance=true`}
                                            className="text-xs text-red-600 hover:text-red-700 font-semibold uppercase"
                                        >
                                            View All →
                                        </Link>
                                    </div>

                                    {/* Products Grid */}
                                    <div className="grid grid-cols-3 gap-6">
                                        {group.products.slice(0, 6).map((product) => (
                                            <Link
                                                key={product.id}
                                                href={`/product/${product.slug}`}
                                                className="group"
                                            >
                                                <div className="relative aspect-square rounded-lg border border-gray-100 overflow-hidden bg-gray-50 mb-3">
                                                    {product.image ? (
                                                        <Image
                                                            src={product.image}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                            sizes="(max-width: 1400px) 33vw"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <span className="text-sm">No Image</span>
                                                        </div>
                                                    )}
                                                    {/* Clearance Badge */}
                                                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                        🔥 SALE
                                                    </div>
                                                </div>
                                                <h4 className="text-[13px] font-medium text-gray-800 line-clamp-2 group-hover:text-red-600 transition-colors mb-1">
                                                    {product.name}
                                                </h4>
                                                <p className="text-sm font-bold text-red-600">
                                                    {formatPrice(product.price)}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
