"use client"

import Link from "next/link"
import Image from "next/image"
import { memo, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { Heart, ShoppingCart, Loader2 } from "lucide-react"

import { useStore } from "@/hooks/useStore"
import { useCart } from "@/hooks/useCart"
import { useWishlist } from "@/hooks/useWishlist"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/supabase-types"
import { toast } from "sonner"

interface ProductCardProps {
    product: Product
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {

    const { isInWishlist, user } = useStore()
    const { addToCart } = useCart()
    const { addToWishlist, removeFromWishlist } = useWishlist()
    const isWishlisted = isInWishlist(product.id)
    const isLoggedIn = !!user
    const [isAddingToCart, setIsAddingToCart] = useState(false)
    const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)

    const handleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!isLoggedIn) {
            window.location.href = "/login"
            return
        }

        if (isTogglingWishlist) return
        setIsTogglingWishlist(true)

        try {
            if (isWishlisted) {
                await removeFromWishlist(product.id)
                toast.success("Removed from wishlist")
            } else {
                await addToWishlist(product.id)
                toast.success("Added to wishlist")
            }
        } catch (err: unknown) {
             toast.error(err instanceof Error ? err.message : "Failed to update wishlist")
        } finally {
            setIsTogglingWishlist(false)
        }
    }

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (product.stock === 0) {
            toast.error("This product is out of stock")
            return
        }
        
        if (!isLoggedIn) {
            window.location.href = "/login"
            return
        }
        
        setIsAddingToCart(true)
        try {
            await addToCart({
                product_id: product.id,
                product_name: product.name,
                product_price: product.price || 0,
                product_image: product.image,
                quantity: 1
            })
            toast.success("Added to cart!")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to add to cart")
        } finally {
            setIsAddingToCart(false)
        }
    }

    return (
        <Card className="group overflow-hidden bg-[#E5E9F0] border-none neu-raised transition-all duration-300 hover:scale-[1.02] rounded-[2rem] h-full flex flex-col">
            <Link href={`/product/${product.slug}`} className="block relative aspect-square overflow-hidden p-2">
                <div className="relative w-full h-full overflow-hidden rounded-[1.5rem]">
                    <Image
                        src={product.image || '/images/placeholder.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        unoptimized
                    />
                    <div className="absolute top-2 right-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full bg-white/60 hover:bg-white/10 transition-colors h-8 w-8 ${isWishlisted ? 'text-red-500' : 'text-tm-text-muted'}`}
                            onClick={handleWishlist}
                            disabled={isTogglingWishlist}
                        >
                            {isTogglingWishlist ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                            )}
                        </Button>
                    </div>
                </div>
            </Link>
            <CardContent className="pt-2 flex-grow">
                {product.material && <div className="text-[10px] text-tm-text-muted mb-1 uppercase tracking-wider font-bold">{product.material}</div>}
                <h3 className="font-bold text-tm-text mb-2 line-clamp-1 group-hover:text-tm-red transition-colors font-serif">
                    <Link href={`/product/${product.slug}`}>{product.name}</Link>
                </h3>
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-tm-text">{formatPrice(product.price)}</span>
                </div>
                
                {/* Stock Badge */}
                <div className="flex items-center gap-1">
                    {product.stock === 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            ❌ Out of Stock
                        </span>
                    ) : product.stock <= 10 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            ⚠️ Only {product.stock} left
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ✅ In Stock
                        </span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pb-6 px-4">
                <Button 
                    className="w-full bg-tm-red hover:bg-tm-red/90 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 h-10 font-bold disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || product.stock === 0}
                >
                    {product.stock === 0 ? (
                        <>❌ Out of Stock</>
                    ) : isAddingToCart ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Adding...
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
})
