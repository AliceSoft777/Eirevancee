"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { TeamListSkeleton } from "@/components/admin/AdminSkeletons"

export default function TeamListLoading() {
  return (
    <AdminRoute>
      <AdminLayout>
        <TeamListSkeleton />
      </AdminLayout>
    </AdminRoute>
  )
}
