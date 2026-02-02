"use client"

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
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

    const { error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)

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
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  async function fetchFeedbacks() {
    try {
      setIsLoading(true)
      
      // 1. Fetch Feedbacks
      const { data: dbFeedbacks, error: feedbacksError } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })

      if (feedbacksError) throw feedbacksError
      
      if (!dbFeedbacks || dbFeedbacks.length === 0) {
        setFeedbacks([])
        setIsLoading(false)
        return
      }

      // 2. Fetch Responses
      const feedbackIds = dbFeedbacks.map(f => f.id)
      const { data: dbResponses, error: responsesError } = await supabase
        .from('feedback_responses')
        .select('*')
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: true })
      
      if (responsesError) {
        console.error("Error fetching responses:", responsesError)
      }

      // 3. Merge
      const mergedFeedbacks = dbFeedbacks.map(feedback => {
        const responses = (dbResponses || [])
          .filter(r => r.feedback_id === feedback.id)
          .map(r => ({
            ...r,
            timestamp: r.created_at // Map created_at to timestamp as expected by UI
          }))
        
        return {
          ...feedback,
          customerName: feedback.customer_name, // Map snake_case to camelCase expected by UI
          customerEmail: feedback.customer_email,
          createdAt: feedback.created_at,
          responses
        }
      })

      setFeedbacks(mergedFeedbacks)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateFeedbackStatus(feedbackId: string, status: Feedback['status']) {
    const { error } = await supabase
      .from('feedbacks')
      .update({ status })
      .eq('id', feedbackId)

    if (error) throw error
    await fetchFeedbacks()
  }

  async function addFeedbackResponse(
    feedbackId: string,
    message: string,
    respondedBy: string
  ) {
    const { error } = await supabase
      .from('feedback_responses')
      .insert([{
        feedback_id: feedbackId,
        message,
        responded_by: respondedBy
      }])

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
