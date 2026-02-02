"use client"

import { useState, useMemo, useEffect } from "react"
import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useProducts, Product } from "@/hooks/useProducts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductsTable } from "@/components/admin/ProductsTable"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Search, Filter, Package, Plus } from "lucide-react"
import { TableRowsSkeleton } from "@/components/admin/TableSkeleton"
import { Pagination } from "@/components/admin/Pagination"
import { EmptyState } from "@/components/admin/EmptyState"
import { usePagination } from "@/hooks/usePagination"
import { Button } from "@/components/ui/button"
import { ProductFormModal } from "@/components/admin/ProductFormModal"
import type { ProductData } from "./page"

interface ProductsListClientProps {
  initialProducts: ProductData[]
}

export default function ProductsListClient({ initialProducts }: ProductsListClientProps) {
  const { deleteProduct, refetch } = useProducts()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }
  
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || product.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [initialProducts, searchTerm, statusFilter])

  const { 
    currentPage, 
    totalPages, 
    goToPage, 
    startIndex, 
    endIndex,
    itemsPerPage
  } = usePagination({ 
    totalItems: filteredProducts.length,
    itemsPerPage: 10
  })

  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  useEffect(() => {
    goToPage(1)
  }, [searchTerm, statusFilter, goToPage])

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary">Products</h1>
              <p className="text-muted-foreground mt-1">Manage your product catalog</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button className="w-full sm:w-auto" onClick={handleAddProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-end">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                All Products ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No products found"
                  description="Try adjusting your search or filter to find what you're looking for."
                  actionLabel={searchTerm || statusFilter !== "all" ? "Clear Filters" : "Add Product"}
                  onAction={() => {
                    if (searchTerm || statusFilter !== "all") {
                      setSearchTerm("")
                      setStatusFilter("all")
                    } else {
                       handleAddProduct()
                    }
                  }}
                />
              ) : (
                <>
                  <ProductsTable 
                    products={currentProducts as any} 
                    onDelete={deleteProduct} 
                    onEdit={handleEditProduct}
                  />
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                      totalItems={filteredProducts.length}
                      itemsPerPage={itemsPerPage}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Product Modal */}
          <ProductFormModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={refetch}
            product={selectedProduct} 
          />

        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
