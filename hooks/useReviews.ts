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

  useEffect(() => {
    mountedRef.current = true
    fetchReviews()
    return () => { mountedRef.current = false }
  }, [])

  // Auto-retry: if loading stays stuck for 5s, retry
  useEffect(() => {
    if (!isLoading) return
    const t = setTimeout(() => { if (mountedRef.current && isLoading) fetchReviews() }, 5000)
    return () => clearTimeout(t)
  }, [isLoading])

  async function fetchReviews() {
    try {
      setIsLoading(true)
      const result = await (supabase
        .from('reviews') as any)
        .select('*')
        .order('created_at', { ascending: false })
      const { data, error } = result || {}

      if (!mountedRef.current) return
      if (error) throw error
      setReviews(data || [])
    } catch (err: any) {
      if (mountedRef.current) setError(err.message)
    } finally {
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

  useEffect(() => {
    mountedRef.current = true
    fetchFeedbacks()
    return () => { mountedRef.current = false }
  }, [])

  // Auto-retry: if loading stays stuck for 5s, retry
  useEffect(() => {
    if (!isLoading) return
    const t = setTimeout(() => { if (mountedRef.current && isLoading) fetchFeedbacks() }, 5000)
    return () => clearTimeout(t)
  }, [isLoading])

  async function fetchFeedbacks() {
    try {
      setIsLoading(true)
      
      // 1. Fetch Feedbacks
      const feedbackResult = await (supabase
        .from('feedbacks') as any)
        .select('*')
        .order('created_at', { ascending: false })
      const { data: dbFeedbacks, error: feedbacksError } = feedbackResult || {}

      if (!mountedRef.current) return
      if (feedbacksError) throw feedbacksError
      
      if (!dbFeedbacks || dbFeedbacks.length === 0) {
        if (mountedRef.current) { setFeedbacks([]); setIsLoading(false) }
        return
      }

      // 2. Fetch Responses
      const feedbackIds = dbFeedbacks.map((f: any) => f.id)
      const responsesResult = await (supabase
        .from('feedback_responses') as any)
        .select('*')
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: true })
      const { data: dbResponses, error: responsesError } = responsesResult || {}
      
      if (!mountedRef.current) return
      if (responsesError) {
        console.error("Error fetching responses:", responsesError)
      }

      // 3. Merge
      const mergedFeedbacks = dbFeedbacks.map((feedback: any) => {
        const responses = (dbResponses || [])
          .filter((r: any) => r.feedback_id === feedback.id)
          .map((r: any) => ({
            ...r,
            timestamp: r.created_at
          }))
        
        return {
          ...feedback,
          customerName: feedback.customer_name,
          customerEmail: feedback.customer_email,
          createdAt: feedback.created_at,
          responses
        }
      })

      if (mountedRef.current) setFeedbacks(mergedFeedbacks)
    } catch (err: any) {
      if (mountedRef.current) setError(err.message)
    } finally {
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
