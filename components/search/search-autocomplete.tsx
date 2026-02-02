"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchPlaceholderTypewriter } from "@/hooks/useSearchPlaceholderTypewriter";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  category_id: string | null;
  categories?: { name: string } | null;
}

interface SearchAutocompleteProps {
  onSearch?: (query: string) => void;
}

export function SearchAutocomplete({ onSearch }: SearchAutocompleteProps) {
  const supabase = getSupabaseBrowserClient();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Typewriter effect for placeholder
  useSearchPlaceholderTypewriter("#tile-search-input", [
    "Floor Tiles",
    "Wall Tiles",
    "Bathroom Tiles",
    "Kitchen Tiles",
    "Outdoor Tiles",
    "Marble Tiles",
    "Wood Effect Tiles",
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Search products from Supabase with debounce
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

    if (searchQuery.trim().length < 1) {
      
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, image, category_id, categories(name)")
        .ilike("name", `%${searchQuery}%`)
        .eq("status", "active")
        .limit(8);

      if (error) throw error;

      setSuggestions(data || []);
      setIsOpen((data || []).length > 0);
      setSelectedIndex(-1);
    } catch (err: any) {
  // Silently ignore AbortError
  if (err?.name === 'AbortError') return;
  console.error("Search error:", err);
  setSuggestions([]);
} finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length > 0) {
      debounceRef.current = setTimeout(() => {
        searchProducts(query);
      }, 200); // 200ms debounce
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchProducts]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          window.location.href = `/product/${suggestions[selectedIndex].slug}`;
        } else if (query.trim()) {
          onSearch?.(query);
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query);
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <Input
            id="tile-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() =>
              query.trim().length > 0 && suggestions.length > 0 && setIsOpen(true)
            }
            onInput={() => {
              // Keep dropdown open as user types (after search results come back)
              if (query.trim().length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder="Search for tiles..."
            className="w-full pl-12 pr-4 h-12 bg-transparent neu-inset border-none rounded-full ring-0 focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              <>
                <div className="text-xs text-muted-foreground px-3 py-2 font-semibold uppercase tracking-wide">
                  Products
                </div>
                {suggestions.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                      index === selectedIndex ? "bg-gray-100" : ""
                    }`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                  >
                    {/* Product Image Thumbnail */}
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {product.name}
                      </div>
                      {product.categories?.name && (
                        <div className="text-xs text-muted-foreground">
                          in {product.categories.name}
                        </div>
                      )}
                    </div>
                    
                    {/* Price */}
                    <div className="text-sm font-semibold text-accent flex-shrink-0">
                      {formatPrice(product.price)}
                    </div>
                  </Link>
                ))}
              </>
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No products found for "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
