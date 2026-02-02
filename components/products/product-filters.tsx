
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface FilterOption {
  label: string
  value: string
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "tile_type",
    label: "Tile Type",
    options: [
      { label: "Floor Tiles", value: "Floor" },
      { label: "Wall Tiles", value: "Wall" },
    ]
  },
  {
    id: "material",
    label: "Material",
    options: [
      { label: "Porcelain", value: "Porcelain" },
      { label: "Ceramic", value: "Ceramic" },
      { label: "Natural Stone", value: "Natural Stone" },
    ]
  },
  {
    id: "finish",
    label: "Finish",
    options: [
      { label: "Glossy", value: "Glossy" },
      { label: "Matt", value: "Matt" },
      { label: "High Glossy", value: "High Glossy" },
      { label: "Carving", value: "Carving" },
    ]
  },
  {
    id: "application_area",
    label: "Usage",
    options: [
        { label: "Indoor", value: "Indoor" },
        { label: "Outdoor", value: "Outdoor" },
    ]
  },
  {
    id: "price",
    label: "Price",
    options: [
        { label: "Under €20", value: "0-20" },
        { label: "€20 - €40", value: "20-40" },
        { label: "€40 - €60", value: "40-60" },
        { label: "Over €60", value: "60-5000" },
    ]
  }
]

const SORT_OPTIONS = [
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
]

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Helper to update URL params
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      
      // Toggle logic for filters (single select for now per group to keep it simple, or replace)
      // For this implementation, we'll assume single select per filter group for simplicity as per screenshot dropdown style
      // If value is already selected, remove it. Otherwise set it.
      if (params.get(name) === value) {
         params.delete(name)
      } else {
         params.set(name, value)
      }
      
      return params.toString()
    },
    [searchParams]
  )

  const handleFilterChange = (group: string, value: string) => {
      router.push(`?${createQueryString(group, value)}`, { scroll: false })
  }
  
  const handleSortChange = (value: string) => {
      router.push(`?${createQueryString("sort", value)}`, { scroll: false })
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6">
      
      {/* Filters (Left) */}
      <div className="flex flex-wrap gap-3">
        {FILTER_GROUPS.map((group) => {
            const selectedValue = searchParams.get(group.id)
            
            return (
                <DropdownMenu key={group.id}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                        variant="outline" 
                        className={cn(
                            "rounded-full border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700 font-medium",
                            selectedValue && "border-primary bg-primary/5 text-primary hover:bg-primary/10"
                        )}
                    >
                      {group.label}
                      {selectedValue && <span className="ml-1 text-xs">({group.options.find(o => o.value === selectedValue)?.label})</span>}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuLabel>
                        Filter by {group.label}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {group.options.map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={selectedValue === option.value}
                        onCheckedChange={() => handleFilterChange(group.id, option.value)}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {selectedValue && (
                        <>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 justify-center text-xs"
                                onSelect={() => handleFilterChange(group.id, selectedValue)}
                             >
                                Clear Filter
                             </DropdownMenuItem>
                        </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
            )
        })}
      </div>

      {/* Sorting (Right) */}
      <div className="flex items-center gap-2">
           <span className="text-sm text-muted-foreground hidden md:inline-block">
               {/* Could add total count here if passed as prop */}
           </span>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium text-gray-700 hover:text-primary hover:bg-transparent">
                  Sort by
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  {SORT_OPTIONS.map((option) => (
                      <DropdownMenuItem 
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={cn(
                            "cursor-pointer",
                            searchParams.get("sort") === option.value && "font-bold text-primary"
                        )}
                      >
                          {option.label}
                          {searchParams.get("sort") === option.value && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
           </DropdownMenu>
      </div>
    </div>
  )
}
