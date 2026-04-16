import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getServerSession } from "@/lib/loaders"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminLayout as AdminShell } from "@/components/admin/AdminLayout"

// Prevent Next.js from caching any admin page — always fetch fresh data
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const hasSupabaseAuthCookie = cookieStore
    .getAll()
    .some((cookie) => cookie.name.includes('-auth-token'))

  // Fast path: avoid auth/profile queries when no session cookie exists.
  if (!hasSupabaseAuthCookie) {
    redirect('/admin/login')
  }

  const session = await getServerSession()

  // HARD BLOCK — server side (allow admin and sales)
  if (!session.userId || (session.userRole !== "admin" && session.userRole !== "sales")) {
    redirect("/")
  }

  return (
  <>
    <AdminHeader session={session} />
    <AdminShell userRole={session.userRole}>
      {children}
    </AdminShell>
  </>
)
}

