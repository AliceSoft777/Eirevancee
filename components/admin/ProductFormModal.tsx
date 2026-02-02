"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProducts, Product } from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useCategories"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ProductImageUpload, ProductImage } from "@/components/admin/ProductImageUpload"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void // Called after successful save to trigger refetch
  product?: Product | null // If null, we are in "Create" mode
}

export function ProductFormModal({ isOpen, onClose, onSave, product }: ProductFormModalProps) {
  const supabase = getSupabaseBrowserClient()
  const { addProduct, updateProduct, refetch } = useProducts()
  const { categories } = useCategories()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    subtitle: "", // Model / Size
    category_id: "",
    sku: "",
    price: "",
    stock: "",
    status: "active",
    environment: "indoor", // Default
    description: "",
    is_clearance: false, // ✅ NEW: Clearance flag
  })

  // Fetch existing images when editing a product
  useEffect(() => {
    async function fetchProductImages() {
      if (product?.id) {
        const { data, error } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', product.id)
          .order('display_order', { ascending: true })
        
        if (!error && data) {
          setProductImages(data)
        }
      } else {
        setProductImages([])
      }
    }
    
    if (isOpen) {
      fetchProductImages()
    }
  }, [product?.id, isOpen])

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
        // Edit Mode
        setFormData({
            name: product.name || "",
            subtitle: product.subtitle || "",
            category_id: product.category_id || "",
            sku: product.assigned_code || "",
            price: product.price?.toString() || "0",
            stock: product.stock?.toString() || "0",
            status: product.status || "active",
            environment: product.indoor_outdoor || "indoor",
            description: product.description || "",
            is_clearance: product.is_clearance === true || product.is_clearance === 'true' // ✅ Handle both boolean and string 'true'
        })
    } else {
        // Create Mode (Reset)
        setFormData({
            name: "",
            subtitle: "",
            category_id: "",
            sku: "",
            price: "",
            stock: "",
            status: "active",
            environment: "indoor",
            description: "",
            is_clearance: false // ✅ Default to false for new products
        })
        setProductImages([])
        setCreatedProductId(null)
    }
  }, [product, isOpen])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
        const payload = {
            name: formData.name,
            subtitle: formData.subtitle,
            category_id: formData.category_id,
            assigned_code: formData.sku, // Map sku field to assigned_code column
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock) || 0,
            status: formData.status,
            application_area: formData.environment, // Map environment to application_area column
            description: formData.description,
            is_clearance: Boolean(formData.is_clearance) // ✅ Ensure boolean type
        }

        if (product) {
            // Update the main product image from primary product_image FIRST
            const primaryImage = productImages.find(img => img.is_primary)
            const imageUrl = primaryImage?.image_url || null
            
            // Include image in the update payload
            await updateProduct(product.id, { ...payload, image: imageUrl })
            
            toast.success("Product updated successfully")
        } else {
            // For create, first create the product then allow image uploads
            const newProduct = await addProduct(payload)
            if (newProduct?.id) {
              setCreatedProductId(newProduct.id)
              toast.success("Product created! You can now add images.")
              // Don't close - let user add images
              return
            }
            toast.success("Product created successfully")
        }
        // Trigger refetch and close
        await refetch()
        onSave?.()
        onClose()
    } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to save product")
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update the product details below." : "Fill in the product details below to create a new product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          
          {/* Section 1: Identity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => handleChange("name", e.target.value)} 
                required 
                placeholder="e.g. Premium Ceramic Tile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Model / Size</Label>
              <Input 
                id="subtitle" 
                value={formData.subtitle} 
                onChange={(e) => handleChange("subtitle", e.target.value)} 
                placeholder="e.g. M1636 or 60x60cm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(val) => handleChange("category_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
               <Label htmlFor="sku">SKU / Code</Label>
               <Input 
                id="sku" 
                value={formData.sku} 
                onChange={(e) => handleChange("sku", e.target.value)} 
                placeholder="PROD-001"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label htmlFor="price">Price (€)</Label>
               <Input 
                id="price" 
                type="number"
                step="0.01"
                value={formData.price} 
                onChange={(e) => handleChange("price", e.target.value)} 
                required
              />
             </div>
             <div className="space-y-2">
               <Label htmlFor="stock">Stock</Label>
               <Input 
                id="stock" 
                type="number"
                value={formData.stock} 
                onChange={(e) => handleChange("stock", e.target.value)} 
                required
              />
             </div>
             <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                    value={formData.status} 
                    onValueChange={(val) => handleChange("status", val)}
                >
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>

          {/* Section 3: Specs/Env */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select 
                    value={formData.environment} 
                    onValueChange={(val) => handleChange("environment", val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Environment" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
               {/* Placeholder for other specs like thickness if needed later */}
             </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
                id="description" 
                value={formData.description} 
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Product description..." 
            />
          </div>

          {/* ✅ NEW: Clearance Toggle */}
          <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.is_clearance)}
                onChange={(e) => handleChange("is_clearance", e.target.checked)}
                className="w-5 h-5 accent-red-500 cursor-pointer"
              />
              <span className="font-semibold text-red-700">🔥 Mark as Clearance Sale</span>
            </label>
            <p className="text-xs text-red-600 ml-8">Product will appear on dedicated Clearance page and be excluded from category listings</p>
          </div>

          {/* Product Images Section */}
          {(product?.id || createdProductId) && (
            <div className="border-t pt-4 mt-4">
              <ProductImageUpload
                productId={product?.id || createdProductId!}
                images={productImages}
                onImagesChange={setProductImages}
              />
            </div>
          )}

          {!product && !createdProductId && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground">
                💡 Create the product first, then you can add images.
              </p>
            </div>
          )}


        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            {createdProductId ? "Done" : "Cancel"}
          </Button>
          {!createdProductId && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? "Save Changes" : "Create Product"}
            </Button>
          )}
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
