"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MegaMenu } from "./mega-menu";
import { ClearanceMegaMenu } from "./clearance-mega-menu";
import { ProductsOnlyMegaMenu } from "./products-only-mega-menu";
import type { CategoryWithChildren } from "@/lib/loaders";
import type { Product } from "@/lib/supabase-types";

interface MainNavProps {
  categories: CategoryWithChildren[];
  products: Product[];
}

export function MainNav({ categories, products }: MainNavProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();

  // ✅ NEW: Check if there are clearance products
  const hasClearanceProducts = products.some(p => p.is_clearance === true && p.status === 'active');

  // Categories are already root-only with children embedded
  const navItems = categories.map(cat => {
    const hasSubcategories = cat.children && cat.children.length > 0;
    // Check if category has products (for categories without subcategories)
    const hasProducts = products.some(
      p => p.category_id === cat.id && p.status === 'active' && p.is_clearance !== true
    );
    
    return {
      name: cat.name,
      href: `/${cat.slug}`,
      hasSubcategories,
      hasProductsOnly: !hasSubcategories && hasProducts, // No subcategories but has products
      hasMegaMenu: hasSubcategories || (!hasSubcategories && hasProducts), // Show menu for either case
      category: cat
    };
  });

  return (
    <nav
      className="border-b border-border relative hidden md:block z-40"
      onMouseLeave={() => {
        // Delay to allow mouse to enter mega menu
        setTimeout(() => {
          const megaMenu = document.querySelector("[data-mega-menu]");
          if (!megaMenu || !megaMenu.matches(":hover")) {
            setActiveMenu(null);
          }
        }, 100);
      }}
    >
      <div className="container mx-auto max-w-[1400px] px-4">
        <ul className={cn(
          "flex items-center justify-center gap-2",
          "rounded-[50px]",
          //"bg-white",
          "px-6 py-2"
        )}>
          {/* ✅ NEW: Clearance Menu Item - Left side with mega menu on hover */}
          {hasClearanceProducts && (
            <li 
              className="relative"
              onMouseEnter={() => setActiveMenu('clearance')}
            >
              <Link
                href="/clearance"
                className={cn(
                  "block px-6 py-4 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors duration-200",
                  pathname === "/clearance" || pathname.startsWith("/clearance/")
                    ? "text-red-600"
                    : "text-red-500 hover:text-red-600"
                )}
              >
                🔥 Clearance
              </Link>
            </li>
          )}

          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li
                key={item.name}
                className="relative"
                onMouseEnter={() =>
                  item.hasMegaMenu && setActiveMenu(item.name)
                }
                onMouseLeave={() => {
                  // Only close if not entering mega menu
                  setTimeout(() => {
                    const megaMenu = document.querySelector("[data-mega-menu]");
                    if (!megaMenu || !megaMenu.matches(":hover")) {
                      setActiveMenu(null);
                    }
                  }, 100);
                }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "block px-6 py-4 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  )}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}


        </ul>
      </div>

      {/* Mega Menu - Rendered outside li elements for full-width positioning */}
      {navItems.map((item) => (
        item.hasSubcategories && activeMenu === item.name && (
          <div
            key={item.name}
            data-mega-menu
            className="absolute left-0 right-0 w-full"
            style={{ top: '100%', zIndex: 9999 }}
            onMouseEnter={() => setActiveMenu(item.name)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <MegaMenu 
              category={item.category}
              products={products}
            />
          </div>
        )
      ))}

      {/* Products-Only Mega Menu - For categories without subcategories but with products */}
      {navItems.map((item) => (
        item.hasProductsOnly && activeMenu === item.name && (
          <div
            key={`products-${item.name}`}
            data-mega-menu
            className="absolute left-0 right-0 w-full"
            style={{ top: '100%', zIndex: 9999 }}
            onMouseEnter={() => setActiveMenu(item.name)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <ProductsOnlyMegaMenu 
              category={item.category}
              products={products}
            />
          </div>
        )
      ))}

      {/* ✅ NEW: Clearance Mega Menu - rendered when hovering clearance */}
      {activeMenu === 'clearance' && hasClearanceProducts && (
        <div
          data-mega-menu
          className="absolute left-0 right-0 w-full"
          style={{ top: '100%', zIndex: 9999 }}
          onMouseEnter={() => setActiveMenu('clearance')}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <ClearanceMegaMenu 
            products={products}
            categories={categories}
          />
        </div>
      )}


    </nav>
  );
}
