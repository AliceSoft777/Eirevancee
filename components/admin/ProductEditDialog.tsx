"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Product } from "@/hooks/useProducts"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface ProductEditDialogProps {
  isOpen: boolean
  product: Product
  onSave: (updates: Partial<Product>) => void
  onCancel: () => void
}

export function ProductEditDialog({
  isOpen,
  product,
  onSave,
  onCancel
}: ProductEditDialogProps) {
  const [categoryName, setCategoryName] = useState<string>("")
  const [formData, setFormData] = useState({
    name: product.name,
    subtitle: product.subtitle || '',
    description: product.description || '',
    assigned_code: product.assigned_code || '',
    price: product.price || '',
    stock: product.stock,
    lowStockThreshold: product.low_stock_threshold,
    status: product.status,
    material: product.material || '',
    size: product.size || '',
    finish: product.finish || '',
    thickness: product.thickness || '',
    sqm_per_box: product.sqm_per_box || '',
    application_area: product.application_area || 'Indoor',
    brand: product.brand || '',
    availability: product.availability || '',
    panel_length: product.panel_length || '',
    panel_width: product.panel_width || '',
    package_included: product.package_included || '',
    has_led: product.has_led || false,
    is_clearance: product.is_clearance || false,
  })

  // Reset form data when product changes
  useEffect(() => {
    setFormData({
      name: product.name,
      subtitle: product.subtitle || '',
      description: product.description || '',
      assigned_code: product.assigned_code || '',
      price: product.price || '',
      stock: product.stock,
      lowStockThreshold: product.low_stock_threshold,
      status: product.status,
      material: product.material || '',
      size: product.size || '',
      finish: product.finish || '',
      thickness: product.thickness || '',
      sqm_per_box: product.sqm_per_box || '',
      application_area: product.application_area || 'Indoor',
      brand: product.brand || '',
      availability: product.availability || '',
      panel_length: product.panel_length || '',
      panel_width: product.panel_width || '',
      package_included: product.package_included || '',
      has_led: product.has_led || false,
      is_clearance: product.is_clearance || false,
    })
  }, [product])

  // Fetch category name
  useEffect(() => {
    let cancelled = false
    
    async function fetchCategory() {
      if (!product.category_id) {
        setCategoryName('No category')
        return
      }
      
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('categories')
        .select('name, parent_id, categories!parent_id(name)')
        .eq('id', product.category_id)
        .single<{ name: string; parent_id: string | null; categories: { name: string } | null }>()
      
      if (cancelled) return
      
      if (error) {
        console.error('Error fetching category:', error)
        setCategoryName('Error loading category')
        return
      }
      
      if (data) {
        const parentName = data.categories?.name
        setCategoryName(parentName ? `${parentName} > ${data.name}` : data.name)
      }
    }
    
    fetchCategory()
    
    return () => {
      cancelled = true
    }
  }, [product.category_id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: formData.name,
      subtitle: formData.subtitle || null,
      description: formData.description,
      assigned_code: formData.assigned_code || null,
      price: formData.price ? (parseFloat(formData.price as string) || 0) : 0,
      stock: formData.stock,
      low_stock_threshold: formData.lowStockThreshold,
      status: formData.status as 'active' | 'draft',
      material: formData.material || null,
      size: formData.size || null,
      finish: formData.finish || null,
      thickness: formData.thickness || null,
      sqm_per_box: formData.sqm_per_box || null,
      application_area: formData.application_area,
      brand: formData.brand || null,
      availability: formData.availability || null,
      panel_length: formData.panel_length || null,
      panel_width: formData.panel_width || null,
      package_included: formData.package_included || null,
      has_led: formData.has_led,
      is_clearance: formData.is_clearance,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Model / Size</Label>
                <Input
                  value={product.size || ''}
                  placeholder="e.g. M1636 or 60×60cm"
                  disabled
                  className="bg-slate-50"
                />
              </div>
            </div>

            <div>
              <Label>Subtitle</Label>
              <Input
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Optional product subtitle or tagline"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input
                  value={categoryName || 'Loading...'}
                  disabled
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label>SKU / Code</Label>
                <Input
                  value={formData.assigned_code}
                  onChange={(e) => setFormData({ ...formData, assigned_code: e.target.value })}
                  placeholder="Product code"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'draft' })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Specifications</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Material</Label>
                <Input
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="e.g. Porcelain"
                />
              </div>
              <div>
                <Label>Size</Label>
                <Input
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="e.g. 60x120"
                />
              </div>
              <div>
                <Label>Finish</Label>
                <Input
                  value={formData.finish}
                  onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                  placeholder="e.g. Glossy, Matt"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Thickness</Label>
                <Input
                  value={formData.thickness}
                  onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                  placeholder="e.g. 9mm"
                />
              </div>
              <div>
                <Label>SQM per Box</Label>
                <Input
                  value={formData.sqm_per_box}
                  onChange={(e) => setFormData({ ...formData, sqm_per_box: e.target.value })}
                  placeholder="e.g. 1.44sqm/box"
                />
              </div>
              <div>
                <Label>Application Area</Label>
                <select
                  value={formData.application_area}
                  onChange={(e) => setFormData({ ...formData, application_area: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </select>              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Brand</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Brand name"
                />
              </div>
              <div>
                <Label>Availability</Label>
                <Input
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  placeholder="e.g. Yes, No"
                />
              </div>
              <div>
                <Label>Package Included</Label>
                <Input
                  value={formData.package_included}
                  onChange={(e) => setFormData({ ...formData, package_included: e.target.value })}
                  placeholder="e.g. Mirror Only"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Panel Length</Label>
                <Input
                  value={formData.panel_length}
                  onChange={(e) => setFormData({ ...formData, panel_length: e.target.value })}
                  placeholder="e.g. 2900mm"
                />
              </div>
              <div>
                <Label>Panel Width</Label>
                <Input
                  value={formData.panel_width}
                  onChange={(e) => setFormData({ ...formData, panel_width: e.target.value })}
                  placeholder="e.g. 1600mm"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Product description"
            />
          </div>

          {/* Flags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_led"
                checked={formData.has_led}
                onChange={(e) => setFormData({ ...formData, has_led: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="has_led" className="cursor-pointer">
                Has LED lighting
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_clearance"
                checked={formData.is_clearance}
                onChange={(e) => setFormData({ ...formData, is_clearance: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_clearance" className="cursor-pointer">
                🔥 Mark as Clearance Sale
              </Label>
            </div>
            {formData.is_clearance && (
              <p className="text-xs text-red-600 ml-6">
                Product will appear on dedicated Clearance page and be excluded from category listings
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Update Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
