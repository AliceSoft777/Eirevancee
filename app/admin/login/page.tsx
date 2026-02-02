"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect old admin login URL to the unified login page
export default function AdminLoginRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/login")
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  )
}
