"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { CustomersListSkeleton } from "@/components/admin/AdminSkeletons"

export default function CustomersListLoading() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CustomersListSkeleton />
      </AdminLayout>
    </AdminRoute>
  )
}
