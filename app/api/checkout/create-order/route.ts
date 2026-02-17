import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getServerSession } from '@/lib/loaders'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderPayload, stripeSessionId } = body

    if (!orderPayload) {
      return NextResponse.json({ error: 'Missing order payload' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    const payload = stripeSessionId
      ? { ...orderPayload, stripe_session_id: stripeSessionId }
      : orderPayload

    const { data, error } = await supabase
      .from('orders' as any)
      .insert(payload)
      .select()
      .single()

    if (error || !data) {
      console.error('[create-order] Insert error:', error)
      return NextResponse.json(
        { error: error?.message || 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ order: data })
  } catch (err: any) {
    console.error('[create-order] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
