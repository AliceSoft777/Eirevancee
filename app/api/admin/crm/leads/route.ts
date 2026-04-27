import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getServerSession } from '@/lib/loaders'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session.userId || (session.userRole !== 'admin' && session.userRole !== 'sales')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const supabase = await createServerSupabase()
    const { data, error } = await (supabase as any)
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return NextResponse.json({ leads: data ?? [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch leads'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session.userId || (session.userRole !== 'admin' && session.userRole !== 'sales')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { name, email, phone, message, source } = await req.json()
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    const supabase = await createServerSupabase()
    const orFilter = phone ? `email.eq.${email},phone.eq.${phone}` : `email.eq.${email}`
    const { data: existing } = await (supabase as any)
      .from('leads').select('id').or(orFilter).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'A lead with this email or phone already exists', duplicate: true }, { status: 409 })
    }
    const { data, error } = await (supabase as any)
      .from('leads')
      .insert({ name, email, phone: phone || null, message: message || null, source: source || 'manual', status: 'New' })
      .select().single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ lead: data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create lead'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession()
    if (!session.userId || (session.userRole !== 'admin' && session.userRole !== 'sales')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const supabase = await createServerSupabase()
    const { error } = await (supabase as any).from('leads').update(updates).eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update lead'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession()
    if (!session.userId || session.userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 })
    }
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const supabase = await createServerSupabase()
    const { error } = await (supabase as any).from('leads').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete lead'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
