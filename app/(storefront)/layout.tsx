import { HeaderServerWrapper } from "@/components/layout/header-server-wrapper"
import { FooterServerWrapper } from "@/components/layout/footer-server-wrapper"
import { getNavData } from "@/lib/loaders"
import { PromotionalModal } from "@/components/modals/promotional-modal"

/**
 * Storefront layout — renders Header and Footer once for ALL customer-facing pages.
 * Admin routes are NOT inside this route group and remain isolated.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { categories } = await getNavData()

  return (
    <div className="flex flex-col min-h-screen">
      <PromotionalModal />
      <HeaderServerWrapper categories={categories} />
      <div className="flex-1">
        {children}
      </div>
      <FooterServerWrapper categories={categories} />
    </div>
  )
}
