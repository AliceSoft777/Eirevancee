"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { MainNav } from "@/components/layout/main-nav";
import { Footer } from "@/components/layout/footer";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { ReviewForm } from "@/components/products/ReviewForm";
import { ReviewsList } from "@/components/products/ReviewsList";
import { ProductReviews } from "@/components/products/ProductReviews";
import { StarRating } from "@/components/ui/star-rating";
import { Heart, Share2, Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";
import { useState, lazy, Suspense } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/hooks/useStore";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/useWishlist";
import type { Product } from "@/hooks/useProducts";
import { parseCoveragePerBox } from "@/components/products/tile-calculator";

import type { Category } from "@/lib/supabase-types";
import type { ServerSession, CategoryWithChildren } from "@/lib/loaders";

// Lazy load heavy components
const TileCalculator = lazy(() =>
  import("@/components/products/tile-calculator").then((module) => ({
    default: module.TileCalculator,
  }))
);

type CalculatorValues =
  import("@/components/products/tile-calculator").CalculatorValues;

interface Props {
  product: Product;
  relatedProducts: Product[];
  categories: CategoryWithChildren[];
  session: ServerSession;
  initialCartCount: number;
  initialWishlistCount: number;
}

export default function ProductClient({ 
  product, 
  relatedProducts, 
  categories,
  session,
  initialCartCount,
  initialWishlistCount
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [calculatorValues, setCalculatorValues] =
    useState<CalculatorValues | null>(null);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);

  const { toggleWishlist } = useStore();  // ✅ Keep this for header wishlist count
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist: isInWishlistDB } = useWishlist();  // ✅ Use DB version
  const isLoggedIn = !!session.userId;
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Ensure images is an array and has at least one image
  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [product.image || '/images/placeholder.jpg'];

  return (
    <>
      <SiteHeader 
        session={session}
        categories={categories} 
        products={relatedProducts} // Using related products for featured in mega menu
        initialCartCount={initialCartCount}
        initialWishlistCount={initialWishlistCount}
      />

      <main className="bg-white min-h-screen">
        <div className="container mx-auto max-w-[1200px] px-4 py-12">
          {/* Main Product Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden relative border border-slate-100">
                <Image
                  src={images[selectedImage] || '/images/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`aspect-square bg-slate-50 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImage === i
                        ? "border-primary"
                        : "border-transparent hover:border-slate-200"
                    }`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <Image
                      src={img || '/images/placeholder.jpg'}
                      alt={`${product.name} view ${i + 1}`}
                      width={120}
                      height={120}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="flex flex-col space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <StarRating
                    rating={product.rating || 0}
                    size="sm"
                    showNumber={false}
                  />
                  <span className="text-xs text-slate-500">
                    ({product.reviews || 0} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="text-3xl font-bold text-slate-900">
                    {formatPrice(product.price)}
                  </div>
                  {!!product.pricePerSqm && (
                    <p className="text-xs text-slate-500 mt-1">
                      Price per m² (inc. VAT)
                    </p>
                  )}
                </div>

                {/* Stock Status Badge */}
                <div className="flex items-center gap-2">
                  {product.stock === 0 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      ❌ Out of Stock
                    </span>
                  ) : product.stock <= 10 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      ⚠️ Only {product.stock} left
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ✅ In Stock
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  {product.description || `Elegant ${product.name} with subtle textures. Perfect for modern bathrooms, kitchens, and living spaces. Durable, easy to clean, and long-lasting.`}
                </p>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4">Specifications</h3>
                <div className="space-y-2 max-w-sm">
                  {product.size && product.size !== '0' && (
                    <div className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Size:</span>
                      <span className="text-slate-900 font-bold">{product.size}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Material:</span>
                      <span className="text-slate-900 font-bold">{product.material}</span>
                    </div>
                  )}
                  {product.finish && (
                    <div className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Finish:</span>
                      <span className="text-slate-900 font-bold">{product.finish}</span>
                    </div>
                  )}
                  {product.thickness && product.thickness !== '0' && (
                    <div className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Thickness:</span>
                      <span className="text-slate-900 font-bold">{product.thickness}</span>
                    </div>
                  )}
                  {product.coverage && (
                    <div className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Coverage:</span>
                      <span className="text-slate-900 font-bold">{product.coverage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tile Calculator */}
              {(!!product.pricePerSqm || !!product.coverage || !!product.sqm_per_box) && (
                <Suspense
                  fallback={
                    <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
                  }
                >
                  <TileCalculator
                    product={product}
                    onCalculationChange={setCalculatorValues}
                  />
                </Suspense>
              )}

              {/* Action Button */}
              <div className="space-y-4">
                {/* Add to Cart + Wishlist Button Container */}
                <div className="flex gap-3 items-center">
                  <Button
                    variant="default"
                    size="lg"
                    className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isAddingToCart || product.stock === 0}
                    onClick={async () => {
                    if (!isLoggedIn) {
                      window.location.href = "/login";
                      return;
                    }
                    
                    if (product.stock === 0) {
                      toast.error("This product is out of stock");
                      return;
                    }
                    
                    setIsAddingToCart(true);
                    try {
                      const qty = product.pricePerSqm
                        ? (calculatorValues?.boxes || 1)
                        : quantity;
                      
                      const coverageVal = parseCoveragePerBox(product.coverage || undefined) || 1;
                      const actualPrice = product.pricePerSqm 
                        ? product.price * coverageVal 
                        : product.price;

                      await addToCart({
                        product_id: product.id,
                        product_name: product.name,
                        product_price: actualPrice,
                        product_image: product.image,
                        quantity: qty
                      });
                      toast.success("Added to cart!");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to add to cart");
                    } finally {
                      setIsAddingToCart(false);
                    }
                  }}
                >
                  {isAddingToCart ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : product.stock === 0 ? (
                    <>
                      ❌ Out of Stock
                    </>
                  ) : !isLoggedIn ? (
                    "Login to Add to Cart"
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {product.pricePerSqm
                        ? calculatorValues?.hasValues
                          ? `Add ${calculatorValues.boxes || 0} Boxes to Cart`
                          : "Add to Cart"
                        : `Add ${quantity} to Basket`}
                    </>
                  )}
                </Button>

                {/* ✅ Wishlist Heart Button - Neumorphism Style */}
                <button
                  onClick={async () => {
                    try {
                      if (!isLoggedIn) {
                        window.location.href = "/login";
                        return;
                      }

                      const inWishlist = isInWishlistDB(product.id);  // ✅ Check DATABASE
                      if (inWishlist) {
                        await removeFromWishlist(product.id);  // ✅ Remove from DB
                        toast.success("Removed from wishlist");
                      } else {
                        await addToWishlist(product.id);  // ✅ Add to DB
                        toast.success("Added to wishlist!");
                      }
                    } catch (err) {
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : "Failed to update wishlist"
                      );
                    }
                  }}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                    isInWishlistDB(product.id)  // ✅ Check DATABASE
                      ? "neu-inset text-red-500"
                      : "neu-raised text-slate-700 hover:text-red-500"
                  }`}
                  title={isInWishlistDB(product.id) ? "Remove from wishlist" : "Add to wishlist"}  // ✅ Check DATABASE
                >
                  <Heart
                    className={`h-5 w-5 transition-all ${
                      isInWishlistDB(product.id)  // ✅ Check DATABASE
                        ? "fill-red-500"
                        : ""
                    }`}
                  />
                </button>
              </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Free delivery on orders over €100</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>In stock - Ships within 2-3 business days</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>30-day return policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-slate-100 mt-24 pt-16">
            {/* Product Reviews Summary */}
            <Suspense fallback={<div className="text-gray-500">Loading reviews...</div>}>
              <ProductReviews productId={product.id} />
            </Suspense>
          </div>

          <div className="w-full border-t border-slate-100 mt-24 pt-16">
            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight mb-8">
              Customer Reviews
            </h2>
            
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Reviews List - Left Side */}
              <div className="lg:col-span-2">
                <Suspense fallback={<div className="text-gray-500">Loading reviews...</div>}>
                  <ReviewsList key={reviewsRefreshKey} productId={product.id} />
                </Suspense>
              </div>

              {/* Review Form - Right Side */}
              <div>
                <ReviewForm
                  productId={product.id}
                  productName={product.name}
                  onReviewSubmitted={() => setReviewsRefreshKey((k) => k + 1)}
                />
              </div>
            </div>
          </div>

          <div className="w-full border-t border-slate-100 mt-24 pt-16">
            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-10">
                  <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
                    You May Also Like
                  </h2>
                  <div className="h-px flex-grow bg-slate-100" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard
                      key={relatedProduct.id}
                      product={relatedProduct}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
