import { HeaderServerWrapper } from "@/components/layout/header-server-wrapper"
import { FooterServerWrapper } from "@/components/layout/footer-server-wrapper"

/**
 * Storefront layout — renders Header and Footer once for ALL customer-facing pages.
 * Admin routes are NOT inside this route group and remain isolated.
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <HeaderServerWrapper />
      <div className="flex-1">
        {children}
      </div>
      <FooterServerWrapper />
    </div>
  )
}
