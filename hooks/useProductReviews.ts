import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

// ✅ MODULE-LEVEL CACHE: Shared between all components using this hook
// Prevents duplicate requests when multiple components fetch same product reviews
const reviewsFetchCache = new Map<string, Promise<Review[]>>()
const requestInProgress = new Set<string>()

export interface Review {
  id: string
  product_id: string
  customer_id: string
  customer_name: string
  customer_email: string
  rating: number
  comment: string
  status: 'pending' | 'published'
  admin_response: string | null
  created_at: string
  product_name?: string
}

interface UseProductReviewsResult {
  reviews: Review[]
  loading: boolean
  error: string | null
  averageRating: number
}

export const useProductReviews = (productId: string | null): UseProductReviewsResult => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) {
      setReviews([])
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    const loadReviews = async () => {
      try {
        // ✅ REQUEST DEDUPLICATION: Check if request already in flight
        if (requestInProgress.has(productId)) {
          console.log('✅ Waiting for in-progress request:', productId)
          
          // Use cached promise
          const cachedData = await reviewsFetchCache.get(productId)!
          if (isMounted) {
            console.log('✅ Got cached reviews for product:', productId)
            setReviews(cachedData)
            setLoading(false)
          }
          return
        }

        // ✅ NEW REQUEST: Mark as in-progress
        requestInProgress.add(productId)
        console.log('🔄 Starting new reviews request:', productId)

        // Create the fetch promise as proper async function
        const fetchPromise: Promise<Review[]> = (async () => {
          const supabase = getSupabaseBrowserClient()
          const { data, error: err } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', productId)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(20)

          if (err) {
            console.error('Supabase reviews fetch error:', err)
            throw new Error(err.message)
          }
          return (data as Review[]) || []
        })()

        // ✅ CACHE: Store promise so other components can reuse
        reviewsFetchCache.set(productId, fetchPromise)

        // ✅ Wait for promise and update state
        const data = await fetchPromise
        requestInProgress.delete(productId)
        
        if (isMounted) {
          console.log('✅ Reviews loaded successfully:', productId, data.length, 'reviews')
          setReviews(data)
          setLoading(false)
        }

        // ✅ CACHE EXPIRY: Clear cache after 30 seconds to allow fresh fetch
        setTimeout(() => {
          reviewsFetchCache.delete(productId)
          console.log('✅ Cache cleared for product:', productId)
        }, 30000)
      } catch (err: unknown) {
        requestInProgress.delete(productId)
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to load reviews'
          console.error('Fetch reviews error:', errorMsg)
          setError(errorMsg)
          setLoading(false)
        }
      }
    }

    loadReviews()

    return () => {
      isMounted = false
    }
  }, [productId])

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
      : 0

  return { reviews, loading, error, averageRating }
}
