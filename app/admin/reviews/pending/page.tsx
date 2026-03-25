"use client"

import { ReviewsModeration } from "@/components/admin/ReviewsModeration"

export default function PendingReviewsPage() {
  return (
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
  )
}
