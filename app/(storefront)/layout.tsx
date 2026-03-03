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
    <>
      <HeaderServerWrapper />
      {children}
      <FooterServerWrapper />
    </>
  )
}
