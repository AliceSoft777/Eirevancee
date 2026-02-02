"use client"

import { SiteHeader } from "@/components/layout/site-header"
import { MainNav } from "@/components/layout/main-nav"
import { Footer } from "@/components/layout/footer"
import { HeroBanner } from "@/components/home/hero-banner"
import { ProductCard } from "@/components/products/product-card"
import { Button } from "@/components/ui/button"
import { lazy, Suspense, useEffect, useRef, useMemo } from "react"
import { MapPin } from "lucide-react"
import { motion } from "framer-motion"
import { useStore } from "@/hooks/useStore"
import type { Category, Product } from "@/lib/supabase-types"
import type { ServerSession, CategoryWithChildren } from "@/lib/loaders"

// Lazy load heavy components
const CategoryShowcaseGrid = lazy(() => import("@/components/home/category-showcase-grid").then(m => ({ default: m.CategoryShowcaseGrid })))
const CircleCategoryCarousel = lazy(() => import("@/components/home/circle-category-carousel").then(m => ({ default: m.CircleCategoryCarousel })))
const ReviewCarousel = lazy(() => import("@/components/home/review-carousel").then(m => ({ default: m.ReviewCarousel })))
const NewsletterSignup = lazy(() => import("@/components/home/newsletter-signup").then(m => ({ default: m.NewsletterSignup })))

// ============================================================================
// MARKETING CONTENT (INTENTIONAL STATIC)
// ============================================================================
const showcaseItems = [
    { name: "LARGE TILES", href: "/tiles", image: "/images/categories/large-tiles.png" },
    { name: "MARBLE-EFFECT TILES", href: "/tiles", image: "/images/categories/marble-tiles.png" },
    { name: "WOOD-EFFECT TILES", href: "/tiles", image: "/images/categories/wood-tiles.png" },
    { name: "METRO TILES", href: "/tiles", image: "/images/categories/metro-tiles.png" },
    { name: "PATTERN TILES", href: "/tiles", image: "/images/categories/pattern-tiles.png" },
    { name: "HEXAGON TILES", href: "/tiles", image: "/images/categories/hexagon-tiles.png" },
]

const circleCategories = [
    { name: "Metro Tiles", href: "/tiles", image: "/images/categories/metro-tiles.png" },
    { name: "Pattern Tiles", href: "/tiles", image: "/images/categories/pattern-tiles.png" },
    { name: "Hexagon Tiles", href: "/tiles", image: "/images/categories/hexagon-tiles.png" },
    { name: "Artificial Grass", href: "/outdoor", image: "/images/categories/artificial-grass.png" },
    { name: "Decking", href: "/outdoor", image: "/images/categories/decking.png" },
    { name: "Slat Wall Panelling", href: "/wall-panelling", image: "/images/categories/slat-panelling.png" },
]

// ============================================================================

interface HomeClientProps {
    session: ServerSession
    categories: CategoryWithChildren[]
    products: Product[]
    cartCount: number
    wishlistCount: number
    wishlistProductIds: string[]
}

export default function HomeClient({ 
    session, 
    categories, 
    products, 
    cartCount, 
    wishlistCount,
    wishlistProductIds 
}: HomeClientProps) {
    // Sync server data to Zustand store ONLY on first mount (hydration safe)
    const { login, setWishlist, _hasHydrated } = useStore()
    const hasSyncedRef = useRef(false)
    const prevWishlistRef = useRef<string[]>([])
    
    useEffect(() => {
        // Only sync ONCE after Zustand hydrates, and only if data actually changed
        if (!_hasHydrated || hasSyncedRef.current) return
        
        // Deep equality check for wishlist
        const wishlistChanged = 
            wishlistProductIds.length !== prevWishlistRef.current.length ||
            wishlistProductIds.some((id, i) => id !== prevWishlistRef.current[i])
        
        // Sync auth state from server (only if we have a user)
        if (session.userId && session.userName && session.userEmail) {
            login(session.userId, session.userName, session.userEmail, session.userRole)
        }
        
        // Sync wishlist IDs only if different
        if (wishlistChanged) {
            setWishlist(wishlistProductIds)
            prevWishlistRef.current = wishlistProductIds
        }
        
        hasSyncedRef.current = true
    }, [_hasHydrated, session.userId, session.userName, session.userEmail, session.userRole, wishlistProductIds, login, setWishlist])
    
    // Get first 6 active products - NO RANDOMIZATION (causes hydration mismatch)
    // Products are already in a consistent order from server
    const popularProducts = useMemo(() => 
        products.filter(p => p.status === 'active').slice(0, 6),
        [products]
    )

    return (
        <>
            <SiteHeader 
                session={session}
                initialCartCount={cartCount} 
                initialWishlistCount={wishlistCount}
                categories={categories}
                products={products}
            />

            <main suppressHydrationWarning>
                {/* Hero Section */}
                <HeroBanner
                    title="ELEVATE YOUR SPACE WITH EXQUISITE TILES"
                    subtitle="Discover unparalleled craftsmanship and design for every vision"
                    buttonText="SHOP NOW"
                    buttonHref="/tiles"
                />

                {/* Category Showcase */}
                <Suspense fallback={<div className="py-12 bg-white"><div className="container mx-auto max-w-[1400px] px-4"><div className="h-64 bg-tm-bg-muted animate-pulse rounded-lg" /></div></div>}>
                    <CategoryShowcaseGrid items={showcaseItems} />
                </Suspense>

                {/* Circle Category Carousel */}
                <Suspense fallback={<div className="py-12 bg-white"><div className="container mx-auto max-w-[1400px] px-4"><div className="h-64 bg-tm-bg-muted animate-pulse rounded-lg" /></div></div>}>
                    <CircleCategoryCarousel
                        title="QUICK SHOP"
                        categories={circleCategories}
                    />
                </Suspense>

                {/* Most Popular Products */}
                <section className="py-20 md:py-24 bg-[#E5E9F0]">
                    <div className="container mx-auto max-w-[1400px] px-6">
                        <div className="flex flex-col items-center justify-center mb-16 text-center">
                            <h2 className="font-serif text-4xl md:text-6xl font-bold text-slate-800 leading-tight">
                                Most <span className="text-primary italic">Popular</span>
                            </h2>
                            <div className="h-1.5 w-24 bg-primary/20 rounded-full mt-4" />
                        </div>
                        
                        {popularProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                                {popularProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="neu-inset rounded-[2rem] p-12 text-center">
                                <p className="text-slate-500 font-medium">No products available at the moment.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Reviews */}
                <Suspense fallback={<div className="py-16 bg-white"><div className="container mx-auto max-w-[1400px] px-4"><div className="h-64 bg-tm-bg-muted animate-pulse rounded-lg" /></div></div>}>
                    <ReviewCarousel />
                </Suspense>

                {/* Newsletter */}
                <Suspense fallback={<div className="py-16 bg-tm-bg-muted"><div className="container mx-auto max-w-[1400px] px-4"><div className="h-48 bg-white animate-pulse rounded-lg" /></div></div>}>
                    <NewsletterSignup />
                </Suspense>

                {/* Visit our Showrooms */}
                <section className="py-24 md:py-32 bg-[#E5E9F0]">
                    <div className="container mx-auto max-w-[1400px] px-6">
                        <div className="neu-raised rounded-[3rem] p-8 md:p-12 lg:p-16 bg-[#E5E9F0] overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                                {/* Left Column - Content */}
                                <div className="flex flex-col justify-center space-y-10">
                                    <div>
                                        <h2 className="font-serif text-4xl md:text-6xl font-bold text-slate-800 leading-tight">
                                            Visit our <br />
                                            <span className="text-primary italic">Showrooms</span>
                                        </h2>
                                        <p className="text-xl text-slate-500 mt-6 leading-relaxed max-w-xl">
                                            Experience the texture and quality of our tiles in person. Our experts in Dublin are ready to help you design your dream space.
                                        </p>
                                    </div>
                                    
                                    {/* Showroom Locations - Neumorphic Cards */}
                                    <div className="space-y-8">
                                        <div className="neu-inset rounded-[2rem] p-8 flex items-start gap-6 group">
                                            <div className="h-14 w-14 rounded-2xl neu-raised bg-[#E5E9F0] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <MapPin className="h-7 w-7" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-serif text-2xl font-bold text-slate-800 mb-2">Dublin Showroom</h3>
                                                <p className="text-slate-500 leading-relaxed text-sm font-medium">
                                                    Besides AXA insurance, Finches Industrial Park, Long Mile Rd, Walkinstown, Dublin, D12 FP74
                                                </p>
                                                <div className="flex items-center gap-2 mt-4 text-primary font-bold text-xs uppercase tracking-widest">
                                                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                    Open Mon-Sun, 9am - 6pm
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button size="xl" className="w-fit h-16 px-10 bg-primary hover:bg-primary-dark text-white font-bold rounded-full shadow-lg flex items-center gap-3">
                                        Get Directions
                                        <span>→</span>
                                    </Button>
                                </div>
                                
                                {/* Right Column - Google Map */}
                                <div className="relative group">
                                    <div className="neu-raised rounded-[2.5rem] p-4 bg-[#E5E9F0] h-[500px] lg:h-[650px]">
                                        <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-inner border border-white/20">
                                            <iframe 
                                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2383.072588924593!2d-6.3380458!3d53.3240536!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4867133caf418fc7%3A0x8584650c497326da!2sCeltic%20Tiles!5e0!3m2!1sen!2sin!4v1769794286118!5m2!1sen!2sin" 
                                                width="100%" 
                                                height="100%" 
                                                style={{ border: 0 }}
                                                allowFullScreen
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                className="w-full h-full filter grayscale-[0.2] contrast-[1.1]"
                                                title="Celtic Tiles Showroom Locations"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Map Floating Badge */}
                                    <div className="absolute -bottom-6 -right-6 md:right-12 z-10 scale-90 md:scale-100">
                                        <div className="neu-raised bg-white p-6 rounded-[2rem] flex items-center gap-4 shadow-2xl">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                ★
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 leading-none">4.9 / 5.0 Rating</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Based on 500+ Google Reviews</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    )
}
