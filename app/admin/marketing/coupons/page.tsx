"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useCoupons } from "@/hooks/useCoupons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CouponDialog, type CouponFormData } from "@/components/admin/CouponDialog"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import { EmptyState } from "@/components/admin/EmptyState"
import { formatPrice } from "@/lib/utils"
import { Plus, Tag } from "lucide-react"
import { NewsletterSkeleton } from "@/components/admin/AdminSkeletons"

type EditingCoupon = {
  id: string
} & Partial<CouponFormData>

export default function CouponsPage() {
  const { coupons, isLoading, error, addCoupon, updateCoupon, deleteCoupon, refetch } = useCoupons()

  const [isCreating, setIsCreating] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<EditingCoupon | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<EditingCoupon | null>(null)

  const handleCreate = async (data: CouponFormData) => {
    try {
      await addCoupon(data)
      toast.success(`Coupon "${data.code}" created`, {
        description:
          data.discount_type === "percentage"
            ? `${data.discount_value}% off`
            : `${formatPrice(data.discount_value)} off`,
      })
      setIsCreating(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to create coupon")
    }
  }

  const handleEdit = async (data: Partial<CouponFormData>) => {
    if (!editingCoupon) return
    try {
      await updateCoupon(editingCoupon.id, data)
      toast.success(`Coupon "${data.code ?? editingCoupon.code}" updated`)
      setEditingCoupon(null)
    } catch (err: any) {
      toast.error(err?.message || "Failed to update coupon")
    }
  }

  const handleDelete = async () => {
    if (!deletingCoupon) return
    try {
      await deleteCoupon(deletingCoupon.id)
      toast.error(`Coupon "${deletingCoupon.code}" deleted`)
      setDeletingCoupon(null)
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete coupon")
    }
  }

  return (
    <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary">
                Coupons & Discounts
              </h1>
              <p className="text-muted-foreground mt-1">
                {isLoading ? "Loading..." : `${coupons.length} total coupon(s)`}
              </p>
            </div>
            <Button onClick={() => setIsCreating(true)} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Coupons ({coupons.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <NewsletterSkeleton />
              ) : error ? (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900">
                  <p className="font-semibold">Failed to load coupons</p>
                  <p className="text-sm mt-1">{error}</p>
                  <Button className="mt-3" size="sm" variant="outline" onClick={() => refetch()}>
                    Retry
                  </Button>
                </div>
              ) : coupons.length === 0 ? (
                <EmptyState
                  icon={Tag}
                  title="No coupons available"
                  description="Create your first coupon to start running discounts."
                  actionLabel="Create Coupon"
                  onAction={() => setIsCreating(true)}
                />
              ) : (
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg font-mono">
                              {coupon.code}
                            </h4>
                            <Badge
                              variant={
                                coupon.status === "active"
                                  ? "success"
                                  : "secondary"
                              }
                            >
                              {coupon.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {coupon.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setEditingCoupon({
                              id: coupon.id,
                              code: coupon.code,
                              discount_type: coupon.discount_type,
                              discount_value: coupon.discount_value,
                              min_order_value: coupon.min_order_value ?? 0,
                              usage_limit: coupon.usage_limit ?? 100,
                              expires_at: coupon.expires_at ?? "",
                              description: coupon.description ?? "",
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setDeletingCoupon({
                              id: coupon.id,
                              code: coupon.code,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Discount</p>
                        <p className="font-semibold">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : formatPrice(coupon.discount_value)}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Min Order</p>
                        <p className="font-semibold">
                          {coupon.min_order_value ? formatPrice(coupon.min_order_value) : 'None'}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Usage</p>
                        <p className="font-semibold">
                          {coupon.used_count} / {coupon.usage_limit ?? "∞"}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className="font-semibold">
                          {coupon.expires_at
                            ? new Date(coupon.expires_at).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-semibold capitalize">
                          {coupon.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>

        <CouponDialog
          isOpen={isCreating}
          onSave={handleCreate}
          onCancel={() => setIsCreating(false)}
        />

        {editingCoupon && (
          <CouponDialog
            isOpen
            coupon={editingCoupon}
            onSave={handleEdit}
            onCancel={() => setEditingCoupon(null)}
          />
        )}

      {deletingCoupon && (
        <DeleteConfirmDialog
          isOpen
          title="Delete Coupon"
          description="Are you sure you want to delete this coupon code?"
          itemName={deletingCoupon.code ?? "this coupon"}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCoupon(null)}
        />
      )}
    </div>
  )
}
