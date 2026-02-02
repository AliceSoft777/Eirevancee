"use client"

import { useState, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export interface ProductImage {
  id: string
  product_id: string
  image_url: string | null
  display_order: number
  is_primary: boolean
  created_at: string
}

interface ProductImageUploadProps {
  productId: string
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
}

export function ProductImageUpload({ 
  productId, 
  images, 
  onImagesChange
}: ProductImageUploadProps) {
  const supabase = getSupabaseBrowserClient()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const newImages: ProductImage[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Failed to upload ${file.name}`)
          continue
        }

        // Get public URL
        const { data: urlData } = supabase
          .storage
          .from('uploads')
          .getPublicUrl(uploadData.path)

        // Insert into product_images table
        const { data: imageData, error: insertError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: urlData.publicUrl,
            display_order: images.length + newImages.length,
            is_primary: images.length === 0 && newImages.length === 0
          } as any)
          .select()
          .single()

        if (insertError) {
          console.error('Insert error:', insertError)
          toast.error(`Failed to save ${file.name}`)
          // Clean up uploaded file
          await supabase.storage.from('uploads').remove([uploadData.path])
          continue
        }

        newImages.push(imageData)
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages])
        toast.success(`${newImages.length} image(s) uploaded`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async (imageId: string, imageUrl: string | null) => {
    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)

      if (deleteError) throw deleteError

      // Try to delete from storage (extract path from URL)
      if (imageUrl) {
        const urlParts = imageUrl.split('/uploads/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          await supabase.storage.from('uploads').remove([filePath])
        }
      }

      const updatedImages = images.filter(img => img.id !== imageId)
      
      // If we removed the primary image, set the first remaining as primary
      if (updatedImages.length > 0 && !updatedImages.some(img => img.is_primary)) {
        const { error } = await (supabase
          .from('product_images') as any)
          .update({ is_primary: true })
          .eq('id', updatedImages[0].id)
        
        if (!error) {
          updatedImages[0].is_primary = true
        }
      }

      onImagesChange(updatedImages)
      toast.success('Image removed')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to remove image')
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    try {
      // Unset all as primary first
      await (supabase
        .from('product_images') as any)
        .update({ is_primary: false })
        .eq('product_id', productId)

      // Set selected as primary
      const { error } = await (supabase
        .from('product_images') as any)
        .update({ is_primary: true })
        .eq('id', imageId)

      if (error) throw error

      const updatedImages = images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }))

      onImagesChange(updatedImages)
      toast.success('Primary image updated')
    } catch (error) {
      console.error('Set primary error:', error)
      toast.error('Failed to set primary image')
    }
  }

  // ✅ NEW: Handle drag-to-reorder
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    // Reorder locally
    const reordered = [...images]
    const [draggedItem] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, draggedItem)

    // Update display_order for all images
    const updatePromises = reordered.map((img, idx) =>
      supabase
        .from('product_images')
        .update({ display_order: idx })
        .eq('id', img.id)
    )

    try {
      await Promise.all(updatePromises)
      onImagesChange(reordered)
      toast.success('Image order updated')
      setDraggedIndex(null)
    } catch (error) {
      console.error('Reorder error:', error)
      toast.error('Failed to reorder images')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Product Images ({images.length})</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading {Math.round(uploadProgress)}%
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Add Images
            </>
          )}
        </Button>
      </div>

      {images.length === 0 ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to upload product images</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div 
              key={image.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`relative group rounded-lg overflow-hidden border-2 cursor-move transition-all ${
                image.is_primary ? 'border-primary' : 'border-gray-200'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="aspect-square relative bg-gray-100">
                {image.image_url ? (
                  <Image
                    src={`${image.image_url}?t=${image.created_at}`}
                    alt="Product image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(image.id)}
                  >
                    Set Primary
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => handleRemoveImage(image.id, image.image_url)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Primary badge */}
              {image.is_primary && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
              
              {/* Order indicator ✅ */}
              <div className="absolute bottom-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
