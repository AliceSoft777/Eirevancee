// lib/supabase/client.ts
// ✅ SINGLETON PATTERN: Create ONE instance for entire app lifecycle
// This prevents AbortError from locks.ts when multiple components initialize simultaneously
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/supabase-types"
import type { SupportedStorage } from "@supabase/supabase-js"

// ✅ Custom storage adapter that respects "remember me" preference
// Uses sessionStorage (clears on browser close) when remember me is unchecked,
// otherwise uses localStorage (persists across sessions)
class ConditionalStorage implements SupportedStorage {
  private getActiveStorage(): Storage {
    if (typeof window === 'undefined') {
      // SSR fallback - return a no-op storage
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        length: 0,
        clear: () => {},
        key: () => null,
      } as Storage
    }
    // Check if "remember me" preference exists and is false
    const rememberMe = localStorage.getItem('auth_remember_me')
    // Use sessionStorage if remember me is explicitly set to 'false'
    // Default to localStorage for backward compatibility
    return rememberMe === 'false' ? sessionStorage : localStorage
  }

  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null
    
    // First try the active storage
    const activeStorage = this.getActiveStorage()
    const value = activeStorage.getItem(key)
    if (value) return value
    
    // Fallback: Check both storages (handles switching between remember me states)
    return localStorage.getItem(key) || sessionStorage.getItem(key)
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return
    this.getActiveStorage().setItem(key, value)
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return
    // Remove from both storages to ensure cleanup
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }
}

// ✅ Create client ONCE at module load time with conditional storage
// Simple, clean initialization without error handling that interferes with operations
export const supabaseBrowserClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: new ConditionalStorage(),
      persistSession: true,
      autoRefreshToken: false, // ✅ Disable auto-refresh to prevent lock conflicts
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-client-info': 'celtic-tiles-browser',
      },
    },
  }
)

// ✅ Keep backward compatibility with existing code
export function getSupabaseBrowserClient() {
  return supabaseBrowserClient
}
