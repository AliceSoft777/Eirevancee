"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { 
  User, 
  LogOut, 
  ChevronDown,
  ShieldCheck,
  Home
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { useStore } from "@/hooks/useStore"
import type { ServerSession } from "@/lib/loaders"

// Role badge component
function RoleBadge({ role }: { role: string }) {
  const roleConfig = {
    admin: { label: "Admin", className: "bg-purple-100 text-purple-700" },
    sales: { label: "Sales", className: "bg-green-100 text-green-700" },
    customer: { label: "", className: "" },
  }
  
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.customer
  
  if (!config.label) return null
  
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${config.className}`}>
      {config.label}
    </span>
  )
}

export interface AdminHeaderProps {
  session?: ServerSession | null
}

export function AdminHeader({ session }: AdminHeaderProps) {
  const router = useRouter()
  const { logout } = useStore()
  
  const user = session?.userId ? {
    id: session.userId,
    name: session.userName || 'Admin',
    email: session.userEmail || '',
    role: session.userRole
  } : null
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      
      // ✅ Sign out from Supabase (invalidates session server-side)
      await supabase.auth.signOut()
      
      // ✅ Clear Zustand state & localStorage
      await logout()
      
      // ✅ Clear any remaining auth cookies/session data
      if (typeof window !== 'undefined') {
        // Force clear all storage
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // ✅ Hard redirect - forces page reload to clear all memory cache
      window.location.href = '/login'
    } catch (err) {
      console.error("Error signing out", err)
      // Force logout even if error
      logout()
      
      // Clear storage anyway
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Force redirect anyway
      window.location.href = '/login'
    } finally {
      setIsProfileOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-gray-50 shadow-sm">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo - Links to admin dashboard */}
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-3 group flex-shrink-0"
          >
            <Image
              src="/images/celticlogo.png"
              alt="Celtic Tiles Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
              priority
            />
            <span className="hidden sm:inline-block text-sm font-semibold text-primary border-l border-gray-300 pl-3 ml-1">
              Admin Portal
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Back to Store Button */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:flex"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                View Store
              </Link>
            </Button>

            {/* Account Dropdown */}
            {user && (
              <div className="relative" ref={profileRef} suppressHydrationWarning>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 text-foreground hover:text-accent transition-colors group"
                  suppressHydrationWarning
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-xs font-medium">{user.name.split(" ")[0]}</span>
                      <RoleBadge role={user.role} />
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 hidden sm:block transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors sm:hidden"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Home className="h-4 w-4 text-muted-foreground" />
                        View Store
                      </Link>
                      <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        My Account
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      suppressHydrationWarning
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
