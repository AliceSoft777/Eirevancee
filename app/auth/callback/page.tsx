import { supabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage() {
  // Get the session code from URL
  const searchParams = new URL(
    `http://localhost${decodeURIComponent(new URL('http://localhost').search)}`
  )
  
  // Redirect to home - the callback is handled by Supabase Auth automatically
  redirect("/")
}
