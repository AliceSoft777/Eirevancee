import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { getServerSession } from "@/lib/loaders"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session.userId || (session.userRole !== "admin" && session.userRole !== "sales")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false })

    if (feedbacksError) {
      return NextResponse.json({ error: feedbacksError.message }, { status: 500 })
    }

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json({ feedbacks: [] })
    }

    const feedbackIds = feedbacks.map((feedback: any) => feedback.id)
    const { data: responses, error: responsesError } = await supabase
      .from("feedback_responses")
      .select("*")
      .in("feedback_id", feedbackIds)
      .order("created_at", { ascending: true })

    if (responsesError) {
      return NextResponse.json({ error: responsesError.message }, { status: 500 })
    }

    const mergedFeedbacks = feedbacks.map((feedback: any) => ({
      ...feedback,
      customerName: feedback.customer_name,
      customerEmail: feedback.customer_email,
      createdAt: feedback.created_at,
      responses: (responses || [])
        .filter((response: any) => response.feedback_id === feedback.id)
        .map((response: any) => ({
          ...response,
          timestamp: response.created_at,
        })),
    }))

    return NextResponse.json({ feedbacks: mergedFeedbacks })
  } catch {
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 })
  }
}
