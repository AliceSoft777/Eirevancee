'use client'

import { useState } from 'react'
import { Star, MessageCircle } from 'lucide-react'
import { useProductReviews } from '@/hooks/useProductReviews'
import { formatDistanceToNow } from 'date-fns'

interface ReviewsListProps {
    productId: string
}

export function ReviewsList({ productId }: ReviewsListProps) {
    // ✅ USE HOOK: Automatically shares request with ProductReviews component
    const { reviews, loading: isLoading, error, averageRating } = useProductReviews(productId)
    // Local state for UI interactions only
    const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null)

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${
                            star <= Math.round(rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="py-8 text-center">
                <p className="text-gray-500">Loading reviews...</p>
            </div>
        )
    }

    if (reviews.length === 0) {
        return (
            <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No reviews yet for this product.</p>
            </div>
        )
    }

    // ✅ Error display from hook
    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <p className="font-semibold">Error loading reviews</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                            {averageRating.toFixed(1)}
                        </div>
                        <div className="flex gap-1 mt-1">
                            {renderStars(averageRating)}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviews.filter((r) => r.rating === star).length
                            const percentage =
                                reviews.length > 0
                                    ? Math.round((count / reviews.length) * 100)
                                    : 0
                            return (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-xs font-semibold w-8">
                                        {star}★
                                    </span>
                                    <div className="flex-1 bg-gray-300 rounded-full h-2">
                                        <div
                                            className="bg-yellow-400 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 w-8 text-right">
                                        {percentage}%
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                        {/* Review Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <div className="font-semibold text-gray-900">
                                    {review.customer_name || 'Anonymous'}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    {renderStars(review.rating)}
                                    <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(
                                            new Date(review.created_at),
                                            { addSuffix: true }
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Review Comment */}
                        <p className="text-gray-700 text-sm mb-3">{review.comment}</p>

                        {/* Admin Response */}
                        {review.admin_response && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
                                <div className="flex gap-2">
                                    <div className="text-blue-600 font-semibold text-xs uppercase">
                                        Response from Celtic Tiles
                                    </div>
                                </div>
                                <p className="text-blue-900 text-sm mt-2">
                                    {review.admin_response}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
