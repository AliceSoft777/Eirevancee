"use client"

import { useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useStore } from "@/hooks/useStore"
import type { UserRole } from "@/lib/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { login, logout } = useStore()
    
    // ✅ FIX: Use useMemo to prevent re-initialization on every render
    // This prevents AbortError from locks.ts in React Strict Mode
    const supabase = useMemo(() => getSupabaseBrowserClient(), [])

    // Stable reference to fetchUserProfile using useCallback
    const fetchUserProfile = useCallback(async (userId: string) => {
        try {
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("role_id, roles(name)")
                .eq("id", userId)
                .single()

            if (error) {
                if (error.code !== 'PGRST116') {
                    console.error("Error fetching profile:", error)
                }
                return
            }

            // ✅ Direct auth call without queue
            const session = await supabase.auth.getSession()
            const user = session.data.session?.user
            
            if (user && profile && user.id === userId) {
                const profileData = profile as Record<string, unknown>
                const rolesData = profileData.roles as { name?: string } | undefined
                const roleName = rolesData?.name || 'customer'
                login(
                    user.id,
                    user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                    user.email || '',
                    roleName as UserRole
                )
            }
        } catch (err: unknown) {
             const error = err as { name?: string; message?: string }
             // ✅ Silently ignore AbortError (expected in dev mode)
             if (error.name !== 'AbortError' && !error.message?.includes('AbortError')) {
                console.error("Error in fetchUserProfile:", err)
             }
        }
    }, [login, supabase])

    useEffect(() => {
        let mounted = true
        
        // ✅ Client-side only check to prevent SSR issues
        if (typeof window === 'undefined') return

        // Check current session on mount
        const initSession = async () => {
            try {
                // ✅ Direct auth call without queue
                const { data: { user }, error } = await supabase.auth.getUser()
                
                // Handle invalid refresh token error
                if (error?.message?.includes('Refresh Token') || 
                    error?.message?.includes('Invalid')) {
                    console.warn('Invalid session detected, clearing...')
                    await supabase.auth.signOut()
                    await logout()
                    return
                }
                
                if (mounted && user) {
                    await fetchUserProfile(user.id)
                }
            } catch (err: any) {
                // ✅ Silently ignore AbortError completely (no logging)
                if (err?.name === 'AbortError' || 
                    err?.message?.includes('AbortError') || 
                    err?.message?.includes('signal is aborted')) {
                    return
                }
                console.warn('Auth error:', err?.message)
            }
        }
        
        // ✅ Small delay to ensure DOM is ready and error handlers are loaded
        const timer = setTimeout(initSession, 100)
        
        return () => {
            clearTimeout(timer)
        }

        // Listen for auth changes (setup after init completes)
        const setupAuthListener = () => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (_event, session) => {
                    if (mounted) {
                        if (session?.user) {
                            await fetchUserProfile(session.user.id)
                        } else {
                            await logout()
                        }
                    }
                }
            )
            
            return subscription
        }
        
        const subscription = setupAuthListener()

        return () => {
            mounted = false
            subscription?.unsubscribe()
        }
    }, [fetchUserProfile, logout, supabase])



    return <>{children}</>
}
