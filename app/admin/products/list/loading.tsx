"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { ProductsListSkeleton } from "@/components/admin/AdminSkeletons"

export default function ProductsListLoading() {
  return (
    <AdminRoute>
      <AdminLayout>
        <ProductsListSkeleton />
      </AdminLayout>
    </AdminRoute>
  )
}
