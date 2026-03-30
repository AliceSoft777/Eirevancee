"use client"

import { useEffect, useState, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface Review {
  id: string
  product_id: string
  product_name: string
  customer_id: string
  customer_name: string
  customer_email: string
  rating: number
  title: string
  comment: string
  status: 'Pending' | 'Approved' | 'Rejected'
  admin_response: string | null
  responded_by: string | null
  responded_at: string | null
  created_at: string
}

export interface FeedbackResponse {
  id: string
  feedback_id: string
  responded_by: string
  respondedBy?: string // Mapped property
  message: string
  created_at: string
  timestamp: string // Mapped property
}

export interface Feedback {
  id: string
  customer_id: string
  customer_name: string
  customerName?: string // Mapped property
  customer_email: string
  customerEmail?: string // Mapped property
  subject: string
  category: 'Support' | 'Complaint' | 'Enquiry' | 'Suggestion'
  message: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  assigned_to: string | null
  created_at: string
  createdAt?: string // Mapped property
  responses: FeedbackResponse[]
}

export function useReviews() {
  const supabase = getSupabaseBrowserClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const reviewsInFlightRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    fetchReviews()
    return () => { mountedRef.current = false }
  }, [])

  // Keep admin review moderation screens fresh without requiring focus changes.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isAdminRoute = window.location.pathname.startsWith('/admin')
    if (!isAdminRoute) return

    const POLL_INTERVAL_MS = 15000
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !reviewsInFlightRef.current) {
        fetchReviews()
      }
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [])

  async function fetchReviews() {
    if (reviewsInFlightRef.current) return

    try {
      reviewsInFlightRef.current = true
      setIsLoading(true)
      const response = await fetch('/api/admin/reviews/live', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || `Failed to fetch reviews (${response.status})`)
      }

      const payload = await response.json()
      const data = Array.isArray(payload?.reviews) ? payload.reviews : []

      if (!mountedRef.current) return
      setReviews(data || [])
    } catch (err: any) {
      if (mountedRef.current) setError(err.message)
    } finally {
      reviewsInFlightRef.current = false
      if (mountedRef.current) setIsLoading(false)
    }
  }

  async function updateReviewStatus(
    reviewId: string,
    status: 'Approved' | 'Rejected',
    response?: string
  ) {
    const updates: any = { status }
    if (response) {
      updates.admin_response = response
      updates.responded_at = new Date().toISOString()
    }

    const result = await (supabase
      .from('reviews') as any)
      .update(updates)
      .eq('id', reviewId)
    const { error } = result || {}

    if (error) throw error
    await fetchReviews()
  }

  return {
    reviews,
    isLoading,
    error,
    updateReviewStatus,
    refetch: fetchReviews
  }
}

export function useFeedbacks() {
  const supabase = getSupabaseBrowserClient()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const feedbacksInFlightRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    fetchFeedbacks()
    return () => { mountedRef.current = false }
  }, [])

  // Keep admin feedback screens fresh without requiring focus changes.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isAdminRoute = window.location.pathname.startsWith('/admin')
    if (!isAdminRoute) return

    const POLL_INTERVAL_MS = 15000
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !feedbacksInFlightRef.current) {
        fetchFeedbacks()
      }
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [])

  async function fetchFeedbacks() {
    if (feedbacksInFlightRef.current) return

    try {
      feedbacksInFlightRef.current = true
      setIsLoading(true)

      const response = await fetch('/api/admin/feedback/live', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || `Failed to fetch feedbacks (${response.status})`)
      }

      const payload = await response.json()
      const feedbacks = Array.isArray(payload?.feedbacks) ? payload.feedbacks : []

      if (!mountedRef.current) return
      setFeedbacks(feedbacks)
    } catch (err: any) {
      if (mountedRef.current) setError(err.message)
    } finally {
      feedbacksInFlightRef.current = false
      if (mountedRef.current) setIsLoading(false)
    }
  }

  async function updateFeedbackStatus(feedbackId: string, status: Feedback['status']) {
    const result = await (supabase
      .from('feedbacks') as any)
      .update({ status })
      .eq('id', feedbackId)
    const { error } = result || {}

    if (error) throw error
    await fetchFeedbacks()
  }

  async function addFeedbackResponse(
    feedbackId: string,
    message: string,
    respondedBy: string
  ) {
    const result = await (supabase
      .from('feedback_responses') as any)
      .insert([{
        feedback_id: feedbackId,
        message,
        responded_by: respondedBy
      }])
    const { error } = result || {}

    if (error) throw error
    await fetchFeedbacks()
  }

  return {
    feedbacks,
    isLoading,
    error,
    updateFeedbackStatus,
    addFeedbackResponse,
    refetch: fetchFeedbacks
  }
}
