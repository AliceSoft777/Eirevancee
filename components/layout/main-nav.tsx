"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  const [megaTop, setMegaTop] = useState(0);
  const navRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  // 🔥 Calculate nav bottom position for fixed mega-menu
  useEffect(() => {
    const updatePosition = () => {
      if (!navRef.current) return;
      const rect = navRef.current.getBoundingClientRect();
      setMegaTop(rect.bottom);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, []);

  // Clearance products exist?
  const hasClearanceProducts = products.some(
    (p) => p.is_clearance === true && p.status === "active"
  );

  const navItems = categories.map((cat) => {
    const hasSubcategories = cat.children && cat.children.length > 0;

    // Collect this category + all child IDs
const categoryIds = [
  cat.id,
  ...(cat.children?.map(child => child.id) || [])
];

// Check if ANY product belongs to this category tree
const hasProducts = products.some(
  p =>
    categoryIds.includes(p.category_id as string) &&
    p.status === "active" &&
    p.is_clearance !== true
);

    return {
      name: cat.name,
      href: `/${cat.slug}`,
      hasSubcategories,
      hasProductsOnly: !hasSubcategories && hasProducts,
      hasMegaMenu: hasSubcategories || (!hasSubcategories && hasProducts),
      category: cat,
    };
  });

  return (
    <nav
      ref={navRef}
      className="border-b border-border relative hidden md:block z-40"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="container mx-auto max-w-[1400px] px-4">
        <ul className="flex items-center justify-center gap-2 rounded-[50px] px-6 py-2">

          {/* Clearance */}
          {hasClearanceProducts && (
            <li onMouseEnter={() => setActiveMenu("clearance")}>
              <Link
                href="/clearance"
                className={cn(
                  "block px-6 py-4 text-sm font-bold uppercase tracking-wide",
                  pathname.startsWith("/clearance")
                    ? "text-red-600"
                    : "text-red-500 hover:text-red-600"
                )}
              >
                🔥 Clearance
              </Link>
            </li>
          )}

          {/* Categories */}
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li
                key={item.name}
                onMouseEnter={() => item.hasMegaMenu && setActiveMenu(item.name)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "block px-6 py-4 text-sm font-bold uppercase tracking-wide",
                    isActive ? "text-primary" : "hover:text-primary"
                  )}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ================= FIXED MEGA MENUS ================= */}

      {navItems.map(
        (item) =>
          item.hasSubcategories &&
          activeMenu === item.name && (
            <div
              key={item.name}
              className="fixed left-0 right-0 w-full"
              style={{ top: megaTop, zIndex: 9999 }}
              onMouseEnter={() => setActiveMenu(item.name)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <MegaMenu category={item.category} products={products} />
            </div>
          )
      )}

      {navItems.map(
        (item) =>
          item.hasProductsOnly &&
          activeMenu === item.name && (
            <div
              key={`products-${item.name}`}
              className="fixed left-0 right-0 w-full"
              style={{ top: megaTop, zIndex: 9999 }}
              onMouseEnter={() => setActiveMenu(item.name)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <ProductsOnlyMegaMenu
                category={item.category}
                products={products}
              />
            </div>
          )
      )}

      {activeMenu === "clearance" && hasClearanceProducts && (
        <div
          className="fixed left-0 right-0 w-full"
          style={{ top: megaTop, zIndex: 9999 }}
          onMouseEnter={() => setActiveMenu("clearance")}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <ClearanceMegaMenu products={products} categories={categories} />
        </div>
      )}
    </nav>
  );
}
