import { getNavData } from "@/lib/loaders"
import { Footer } from "./footer"

/**
 * Server Component wrapper for Footer.
 * Fetches categories on the server (no session dependency).
 */
export async function FooterServerWrapper() {
  const { categories } = await getNavData()

  return <Footer categories={categories} />
}
