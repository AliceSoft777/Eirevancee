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
  { name: "Support", href: "/admin/feedback/list", icon: MessageSquare },
  // Admin-only items
  { name: "Team", href: "/admin/team/list", icon: UserRoundCog, adminOnly: true },
  { name: "Marketing", href: "/admin/marketing/coupons", icon: Tag, adminOnly: true },
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
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-serif font-bold text-primary">
          Celtic Tiles <span className="text-xs font-sans text-muted-foreground">{isAdmin() ? "Admin" : "Staff"}</span>
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar Overlay (mobile) */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Logo - Desktop only */}
          <div className="hidden lg:block p-6 border-b border-border">
            <h1 className="text-xl font-serif font-bold text-primary">
              Celtic Tiles <span className="text-sm font-sans text-muted-foreground">{isAdmin() ? "Admin" : "Staff"}</span>
            </h1>
          </div>

          {/* Mobile close button */}
          <div className="lg:hidden p-4 border-b border-border flex items-center justify-between">
            <span className="font-medium">Menu</span>
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                      : "text-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-border">
            <div className="mb-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Store
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)] overflow-auto">
          {/* Responsive padding: mobile (p-4), tablet (p-6), desktop (p-8) */}
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
