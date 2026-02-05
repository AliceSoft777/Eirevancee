import { SiteHeader } from "@/components/layout/site-header"
import { MainNav } from "@/components/layout/main-nav"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/products/product-card"
import { Product } from "@/hooks/useProducts"

export const dynamic = 'force-dynamic'

const products: Product[] = [
    {
        id: "1",
        name: "Bulk Pack - White Tiles",
        slug: "bulk-white-tiles",
        subtitle: "600x600mm - 50 tiles",
        description: "Premium white ceramic tiles in bulk packaging. Perfect for large-scale trade projects. High-quality finish with excellent durability.",
        price: 899.99,
        pricePerSqm: null,
        image: "/trade-1.jpg",
        images: ["/trade-1.jpg"],
        category_id: "trade",
        subcategory: "tiles",
        inStock: true,
        rating: 4.5,
        reviews: 24,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
        stock: 100,
        low_stock_threshold: 10,
        cost_price: null,
        assigned_code: "TRD-001",
        model: null,
        size: "600x600mm",
        sqm_per_box: "1.44",
        indoor_outdoor: "indoor",
        material: "ceramic",
        finish: "gloss",
        thickness: "10mm",
        coverage: "1.44"
    },
    {
        id: "2",
        name: "Trade Adhesive - 10 Pack",
        slug: "trade-adhesive",
        subtitle: "20kg bags",
        description: "Professional-grade tile adhesive in convenient 10-pack bulk format. Ideal for trade professionals working on multiple projects.",
        price: 199.99,
        pricePerSqm: null,
        image: "/trade-2.jpg",
        images: ["/trade-2.jpg"],
        category_id: "trade",
        subcategory: "accessories",
        inStock: true,
        rating: 4.7,
        reviews: 18,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
        stock: 50,
        low_stock_threshold: 5,
        cost_price: null,
        assigned_code: "TRD-002",
        model: null,
        size: null,
        sqm_per_box: null,
        indoor_outdoor: "indoor",
        material: null,
        finish: null,
        thickness: null,
        coverage: null
    },
    {
        id: "3",
        name: "Professional Grout Bundle",
        slug: "grout-bundle",
        subtitle: "Multiple colours - 20kg",
        description: "Complete grout bundle with multiple color options. Professional quality suitable for all tile types and applications.",
        price: 249.99,
        pricePerSqm: null,
        image: "/trade-3.jpg",
        images: ["/trade-3.jpg"],
        category_id: "trade",
        subcategory: "accessories",
        inStock: true,
        rating: 4.6,
        reviews: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
        stock: 40,
        low_stock_threshold: 5,
        cost_price: null,
        assigned_code: "TRD-003",
        model: null,
        size: null,
        sqm_per_box: null,
        indoor_outdoor: "indoor",
        material: null,
        finish: null,
        thickness: null,
        coverage: null
    },
    {
        id: "4",
        name: "Porcelain Tile Bulk - Grey",
        slug: "bulk-grey-tiles",
        subtitle: "600x600mm - 100 tiles",
        description: "Premium grey porcelain tiles in bulk quantity. Modern aesthetic with superior strength and low maintenance requirements.",
        price: 1599.99,
        pricePerSqm: null,
        image: "/trade-4.jpg",
        images: ["/trade-4.jpg"],
        category_id: "trade",
        subcategory: "tiles",
        inStock: true,
        rating: 4.8,
        reviews: 32,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
        stock: 80,
        low_stock_threshold: 10,
        cost_price: null,
        assigned_code: "TRD-004",
        model: null,
        size: "600x600mm",
        sqm_per_box: "1.44",
        indoor_outdoor: "indoor",
        material: "porcelain",
        finish: "matt",
        thickness: "10mm",
        coverage: "1.44"
    },
    {
        id: "5",
        name: "Trade Tools Kit",
        slug: "trade-tools",
        subtitle: "Professional set",
        description: "Comprehensive professional tool kit for tile installation. Includes all essential tools needed for efficient trade work.",
        price: 349.99,
        pricePerSqm: null,
        image: "/trade-5.jpg",
        images: ["/trade-5.jpg"],
        category_id: "trade",
        subcategory: "accessories",
        inStock: true,
        rating: 4.9,
        reviews: 41,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
        stock: 30,
        low_stock_threshold: 5,
        cost_price: null,
        assigned_code: "TRD-005",
        model: null,
        size: null,
        sqm_per_box: null,
        indoor_outdoor: "indoor",
        material: null,
        finish: null,
        thickness: null,
        coverage: null
    },
    {
        id: "6",
        name: "Decking Bundle - 20m²",
        slug: "decking-bundle",
        subtitle: "Composite boards",
        description: "High-quality composite decking boards in convenient 20m² bundle. Weather-resistant and low-maintenance outdoor solution.",
        price: 999.99,
        pricePerSqm: null,
        image: "/trade-6.jpg",
        images: ["/trade-6.jpg"],
        category_id: "trade",
        subcategory: "outdoor",
        inStock: true,
        rating: 4.4,
        reviews: 28,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
        stock: 20,
        low_stock_threshold: 5,
        cost_price: null,
        assigned_code: "TRD-006",
        model: null,
        size: "20m²",
        sqm_per_box: "1.0",
        indoor_outdoor: "outdoor",
        material: "composite",
        finish: "matt",
        thickness: "25mm",
        coverage: "1.0"
    },
]

import { getNavData, getCartData, getWishlistData, getServerSession } from "@/lib/loaders"

export default async function TradePage() {
    // Get session and counts for header
    const session = await getServerSession();
    const [{ cartCount }, { wishlistCount }] = await Promise.all([
        getCartData(session.userId),
        getWishlistData(session.userId)
    ]);
    // Fetch nav data
    const { categories } = await getNavData();

    return (
        <>
            {/* <SiteHeader 
                initialCartCount={cartCount} 
                initialWishlistCount={wishlistCount}
                categories={categories}
                products={products} // Pass mock trade products to share with mega menu if needed
            /> */}

            <main>
                {/* Page Header with Yellow Accent */}
                <section className="bg-tm-yellow py-12 border-b-4 border-black">
                    <div className="container mx-auto max-w-[1400px] px-4 text-center">
                        <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4 text-black">
                            Trade Best Sellers
                        </h1>
                        <p className="text-lg mb-2 text-black font-semibold">
                            Premium bulk products for trade professionals
                        </p>
                        <p className="text-sm text-black/80">
                            Volume discounts available - Register for trade account
                        </p>
                    </div>
                </section>

                {/* Info Banner */}
                <section className="bg-white border-b border-tm-border py-4">
                    <div className="container mx-auto max-w-[1400px] px-4">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-tm-green text-xl">✓</span>
                                <span>Bulk Order Discounts</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-tm-green text-xl">✓</span>
                                <span>Free Delivery on Orders Over €500</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-tm-green text-xl">✓</span>
                                <span>Dedicated Trade Support</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Products Grid */}
                <section className="py-12 bg-white">
                    <div className="container mx-auto max-w-[1400px] px-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            
        </>
    )
}
