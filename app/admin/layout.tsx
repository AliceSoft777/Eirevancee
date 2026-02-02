import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/loaders"
import { AdminHeader } from "@/components/admin/AdminHeader"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  // HARD BLOCK — server side (allow admin and sales)
  if (!session.userId || (session.userRole !== "admin" && session.userRole !== "sales")) {
    redirect("/")
  }

  return (
  <>
    <AdminHeader session={session} />
    <main className="min-h-screen bg-background">
      {children}
    </main>
  </>
)
}
