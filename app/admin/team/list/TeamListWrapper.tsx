import { createServerSupabase } from "@/lib/supabase/server"
import TeamListClient from "./TeamListClient"
import type { TeamMember } from "@/hooks/useTeamMembers"

export default async function TeamListWrapper() {
  let initialTeamMembers: TeamMember[] = []
  let error = null

  try {
    const supabase = await createServerSupabase()
    
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role_id,
        permissions,
        created_at,
        role:roles(name)
      `)
      .not('role_id', 'is', null)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[TeamList] Fetch error:', fetchError)
      error = fetchError.message
    } else if (data) {
      // Transform to expected format with role name
      const transformed = (data || []).map((member: any) => ({
        id: member.id,
        email: member.email,
        full_name: member.full_name,
        name: member.full_name || '',
        role: (member.role?.name || 'customer') as any,
        permissions: member.permissions,
        created_at: member.created_at
      }))
      
      // Filter for admin and sales only (case-insensitive)
      initialTeamMembers = transformed.filter((m: any) => {
        const role = m.role?.toLowerCase() || ''
        return role === 'admin' || role === 'sales'
      })
    }
  } catch (err: any) {
    console.error('[TeamList] Server fetch error:', err)
    error = err.message || 'Failed to fetch team members'
  }

  return <TeamListClient initialTeamMembers={initialTeamMembers} serverError={error} />
}
