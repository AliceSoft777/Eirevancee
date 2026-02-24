"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useStore } from "@/hooks/useStore"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users,
  UserRoundCog,
  MessageSquare,
  Star,
  Tag,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

// Navigation items with role restrictions
const allNavigation: NavItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders/list", icon: ShoppingBag },
  { name: "Products", href: "/admin/products/list", icon: Package },
  { name: "Reviews", href: "/admin/reviews/pending", icon: Star },
  { name: "Customers", href: "/admin/customers/list", icon: Users },
  //{ name: "Support", href: "/admin/feedback/list", icon: MessageSquare },
  // Admin-only items
  { name: "Team", href: "/admin/team/list", icon: UserRoundCog, adminOnly: true },
  { name: "Marketing", href: "/admin/marketing/coupons", icon: Tag, adminOnly: true },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail, adminOnly: true },
  { name: "Reports", href: "/admin/reports/sales", icon: BarChart3, adminOnly: true },
  { name: "Settings", href: "/admin/settings/general", icon: Settings, adminOnly: true },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, canAccessDashboard, isAdmin, logout, _hasHydrated } = useStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Filter navigation based on role
  const navigation = useMemo(() => {
    if (isAdmin()) {
      return allNavigation
    }
    return allNavigation.filter(item => !item.adminOnly)
  }, [isAdmin])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // Redirect if not authorized
  useEffect(() => {
    if (_hasHydrated && (!user || !canAccessDashboard())) {
      router.push("/login")
    }
  }, [_hasHydrated, user, canAccessDashboard, router])

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      
      // ✅ Sign out from Supabase
      await supabase.auth.signOut()
      
      // ✅ Clear Zustand state & localStorage
      await logout()
      
      // ✅ Clear all storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // ✅ Hard redirect with page reload
      window.location.href = '/'
    } catch (err) {
      console.error("Logout error:", err)
      logout()
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      window.location.href = '/'
    }
  }

  // Loading state
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authorized
  if (!user || !canAccessDashboard()) {
    return null
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden shrink-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between" suppressHydrationWarning>
        <h1 className="text-lg font-serif font-bold text-primary">
          Celtic Tiles <span className="text-xs font-sans text-muted-foreground">{isAdmin() ? "Admin" : "Staff"}</span>
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          suppressHydrationWarning
          className="hover:text-foreground"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar Overlay — outside flex container so it covers the ENTIRE viewport */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Neumorphic Design */}
        <aside className={cn(
          "fixed lg:relative left-0 top-0 h-full flex flex-col transition-transform duration-300 ease-in-out shrink-0",
          "w-60 sm:w-64",
          "z-50 lg:z-auto",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          background: 'hsl(var(--neu-bg))',
          borderRight: '1px solid hsl(var(--border) / 0.3)'
        }}>
          {/* Logo - Desktop only */}
          <div className="hidden lg:block px-5 py-4" style={{
            borderBottom: '1px solid hsl(var(--border) / 0.3)'
          }}>
            <h1 className="text-lg font-serif font-bold text-primary">
              Celtic Tiles <span className="text-sm font-sans text-muted-foreground">{isAdmin() ? "Admin" : "Staff"}</span>
            </h1>
          </div>

          {/* Mobile close button */}
          <div className="lg:hidden p-4 flex items-center justify-between" style={{
            borderBottom: '1px solid hsl(var(--border) / 0.3)'
          }}>
            <span className="font-medium text-foreground">Menu</span>
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)} suppressHydrationWarning
              className="hover:bg-transparent rounded-xl neu-raised"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Navigation — flat by default, inset when active, raised on hover */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "neu-nav-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl",
                    isActive
                      ? "neu-inset text-primary font-semibold"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
            {/* Divider + bottom actions */}
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 rounded-xl"
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Back to Store</span>
              </Link>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-red-600 transition-all duration-200 rounded-xl cursor-pointer bg-transparent border-none text-left"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5 lg:p-6 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
