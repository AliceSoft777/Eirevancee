"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { OrdersListSkeleton } from "@/components/admin/AdminSkeletons"

export default function OrdersListLoading() {
  return (
    <AdminRoute>
      <AdminLayout>
        <OrdersListSkeleton />
      </AdminLayout>
    </AdminRoute>
  )
}
