"use client"

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface TeamMember {
  id: string
  email: string
  full_name: string | null
  name: string // Mapped property
  role: 'admin' | 'sales'
  permissions: string[] | null
  created_at: string
}

export function useTeamMembers() {
  const supabase = getSupabaseBrowserClient()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamMembers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
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

      if (fetchError) throw fetchError
      
      // Transform to expected format with role name
      const transformed = (data || []).map((member: any) => ({
        id: member.id,
        email: member.email,
        full_name: member.full_name,
        name: member.full_name || '', // Map full_name to name
        role: (member.role?.name || 'customer') as any,
        permissions: member.permissions,
        created_at: member.created_at
      }))
      
      // Filter for admin and sales only (case-insensitive)
      setTeamMembers(transformed.filter((m: any) => {
        const role = m.role?.toLowerCase() || ''
        return role === 'admin' || role === 'sales'
      }))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team members')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeamMembers()
  }, [fetchTeamMembers])

  async function addTeamMember(member: Omit<TeamMember, 'id' | 'created_at'> & { password: string }) {
    //Get role_id from role name
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', member.role)
      .single()

    if (!roleData) throw new Error(`Role ${member.role} not found`)

    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        email: member.email,
        full_name: member.full_name,
        role_id: roleData.id,
        permissions: member.permissions
      }])
      .select(`
        id,
        email,
        full_name,
        permissions,
        created_at,
        role:roles(name)
      `)
      .single()

    if (error) throw error
    
    const transformed = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      name: data.full_name || '',
      role: ((data as any).role?.name || 'sales') as 'admin' | 'sales',
      permissions: data.permissions,
      created_at: data.created_at
    }
    
    setTeamMembers(prev => [transformed, ...prev])
    return transformed
  }

  async function updateTeamMember(id: string, updates: Partial<TeamMember>) {
    const updateData: any = {}
    
    if (updates.full_name !== undefined) updateData.full_name = updates.full_name
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions
    
    // If role is being updated, get role_id
    if (updates.role) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', updates.role)
        .single()
      
      if (roleData) updateData.role_id = roleData.id
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        email,
        full_name,
        permissions,
        created_at,
        role:roles(name)
      `)
      .single()

    if (error) throw error
    
    const transformed = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      name: data.full_name || '',
      role: ((data as any).role?.name || 'sales') as 'admin' | 'sales',
      permissions: data.permissions,
      created_at: data.created_at
    }
    
    setTeamMembers(prev => prev.map(m => m.id === id ? transformed : m))
    return transformed
  }

  async function deleteTeamMember(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
    setTeamMembers(prev => prev.filter(m => m.id !== id))
  }

  return {
    teamMembers,
    isLoading,
    error,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    refetch: fetchTeamMembers
  }
}
