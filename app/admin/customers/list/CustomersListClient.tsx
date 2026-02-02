"use client"

import { useState, useMemo, useEffect } from "react"
import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Search } from "lucide-react"
import { Pagination } from "@/components/admin/Pagination"
import { EmptyState } from "@/components/admin/EmptyState"
import { usePagination } from "@/hooks/usePagination"
import { formatPrice } from "@/lib/utils"
import type { CustomerData } from "./page"

interface CustomersListClientProps {
  initialCustomers: CustomerData[]
}

export default function CustomersListClient({ initialCustomers }: CustomersListClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [customers] = useState(initialCustomers)

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
    )
  }, [searchTerm, customers])

  const {
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    itemsPerPage
  } = usePagination({
    totalItems: filteredCustomers.length,
    itemsPerPage: 10
  })

  // Reset page when search changes
  useEffect(() => {
    goToPage(1)
  }, [searchTerm, goToPage])

  const currentCustomers = filteredCustomers.slice(startIndex, endIndex)

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary">Customers</h1>
              <p className="text-muted-foreground mt-1">Manage customer information</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No customers found"
                  description={searchTerm ? "Try adjusting your search terms." : "You haven't added any customers yet."}
                  actionLabel={searchTerm ? "Clear Search" : undefined}
                  onAction={() => setSearchTerm("")}
                />
              ) : (
                <>
                  <div className="space-y-3">
                    {currentCustomers.map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between p-4 border border-border rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                            {customer.name[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">{customer.phone}</p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{customer.totalOrders} orders</p>
                          <p className="text-muted-foreground">{formatPrice(customer.totalSpent)} spent</p>
                          <p className="text-xs text-muted-foreground hidden sm:block mt-1">Joined {new Date(customer.joinedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                      totalItems={filteredCustomers.length}
                      itemsPerPage={itemsPerPage}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
