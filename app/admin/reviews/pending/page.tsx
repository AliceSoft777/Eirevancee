"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { ReviewsModeration } from "@/components/admin/ReviewsModeration"

export default function PendingReviewsPage() {
  return (
    <AdminRoute>
      <AdminLayout currentPage="reviews">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reviews Moderation
            </h1>
            <p className="text-gray-600">
              Review and moderate customer product reviews
            </p>
          </div>

          <ReviewsModeration />
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
