'use client'

import { useEffect, useState } from 'react'
import { Check, X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface PendingReview {
    id: string
    product_id: string
    customer_id: string
    customer_name: string
    customer_email: string
    rating: number
    comment: string
    created_at: string
    admin_response: string | null
    products: {
        name: string
        slug: string
    }
}

export function ReviewsModeration() {
    const supabase = getSupabaseBrowserClient()
    const [reviews, setReviews] = useState<PendingReview[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null)
    const [response, setResponse] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadPendingReviews()
    }, [])

    const loadPendingReviews = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(
                    `
                    id,
                    product_id,
                    customer_id,
                    customer_name,
                    customer_email,
                    rating,
                    comment,
                    created_at,
                    admin_response,
                      products (
                        name,
                        slug
                    )
                    `
                )
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .returns<PendingReview[]>()

            if (error) throw error
            setReviews((data || []) as PendingReview[])
        } catch (err) {
            console.error('Error loading reviews:', err)
            toast.error('Failed to load pending reviews')
        } finally {
            setIsLoading(false)
        }
    }

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`text-lg ${
                            star <= rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                        }`}
                    >
                        ★
                    </span>
                ))}
            </div>
        )
    }

    const handleApprove = async () => {
        if (!selectedReview) return

        setIsSubmitting(true)
        try {
            // @ts-ignore - reviews table is not recognized in type definitions
            const { error } = await (supabase as any)
                .from('reviews')
                .update({
                    status: 'published',
                    admin_response: response || null,
                })
                .eq('id', selectedReview.id)

            if (error) throw error

            toast.success('Review published!')
            setSelectedReview(null)
            setResponse('')
            loadPendingReviews()
        } catch (err) {
            console.error('Error approving review:', err)
            toast.error('Failed to approve review')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReject = async () => {
        if (!selectedReview) return

        setIsSubmitting(true)
        try {
            // @ts-ignore - reviews table is not recognized in type definitions
            const { error } = await (supabase as any)
                .from('reviews')
                .update({ status: 'rejected' })
                .eq('id', selectedReview.id)

            if (error) throw error

            toast.success('Review rejected')
            setSelectedReview(null)
            setResponse('')
            loadPendingReviews()
        } catch (err) {
            console.error('Error rejecting review:', err)
            toast.error('Failed to reject review')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Loading reviews...</p>
            </div>
        )
    }

    if (reviews.length === 0) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-blue-900 font-semibold">No pending reviews</p>
                <p className="text-blue-700 text-sm">All reviews have been moderated.</p>
            </div>
        )
    }

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Reviews List */}
            <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Pending Reviews ({reviews.length})
                </h3>
                <div className="space-y-2">
                    {reviews.map((review) => (
                        <button
                            key={review.id}
                            onClick={() => {
                                setSelectedReview(review)
                                setResponse('')
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                selectedReview?.id === review.id
                                    ? 'bg-blue-50 border-blue-400'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="font-semibold text-gray-900 text-sm truncate">
                                        {review.products.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {review.customer_name}
                                    </div>
                                    <div className="mt-1">
                                        {renderStars(review.rating)}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Review Details */}
            {selectedReview && (
                <div className="lg:col-span-2">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-bold text-gray-900">
                                    {selectedReview.products.name}
                                </h4>
                                <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(
                                        new Date(selectedReview.created_at),
                                        { addSuffix: true }
                                    )}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                By <span className="font-semibold">{selectedReview.customer_name}</span>
                                {' '}({selectedReview.customer_email})
                            </p>
                        </div>

                        {/* Rating */}
                        <div className="mb-4">
                            {renderStars(selectedReview.rating)}
                        </div>

                        {/* Comment */}
                        <div className="mb-6">
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">
                                Review
                            </h5>
                            <div className="bg-white rounded p-3 border border-gray-200">
                                <p className="text-gray-700 text-sm">
                                    {selectedReview.comment}
                                </p>
                            </div>
                        </div>

                        {/* Admin Response */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Admin Response (Optional)
                            </label>
                            <Textarea
                                placeholder="Add a response to this review..."
                                value={response}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tm-red"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {response.length} / 500 characters
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                onClick={handleApprove}
                                disabled={isSubmitting}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg py-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Publish Review
                            </Button>
                            <Button
                                onClick={handleReject}
                                disabled={isSubmitting}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg py-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Reject Review
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
