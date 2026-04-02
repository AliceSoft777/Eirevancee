"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react"
import { saveQuotation } from "@/lib/quotation-actions"
import { QuotationProductSearch } from "./QuotationProductSearch"
import { generateQuotationPDF } from "@/lib/quotation-pdf"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Quotation, QuotationItem, QuotationProductItem, QuotationSectionHeader } from "@/lib/supabase-types"

interface QuotationBuilderProps {
  initialData?: Quotation | null
  vatRate: number
  currentUserName?: string
}

export function QuotationBuilder({ initialData, vatRate, currentUserName }: QuotationBuilderProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [formData, setFormData] = useState({
    customer_name: initialData?.customer_name || "",
    customer_email: initialData?.customer_email || "",
    customer_phone: initialData?.customer_phone || "",
    quote_type: initialData?.quote_type || "Material Quote",
    delivery_collection: initialData?.delivery_collection || "Collection",
    customer_order_no: initialData?.customer_order_no || "",
    sales_rep_name: initialData?.sales_rep_name || currentUserName || "",
    instructions: initialData?.instructions || "",
    status: initialData?.status || "draft",
  })

  const [items, setItems] = useState<QuotationItem[]>(initialData?.items || [])

  // Auto-calculate amounts when items change
  const totals = useMemo(() => {
    let totalIncVat = 0
    
    // Recalculate item amounts
    const updatedItems = items.map(item => {
      if (item.type === 'product') {
        // Issue 3: Discount is display-only, does not affect amount.
        // Issue 4 & 5: Prices are inclusive of VAT.
        const amountIncVat = item.unit_price * item.quantity
        totalIncVat += amountIncVat

        return { ...item, amount: amountIncVat, vat_amount: 0, vat_rate: vatRate }
      }
      return item
    })

    const vat = totalIncVat * (vatRate / 100)
    const sub = totalIncVat - vat

    return {
      items: updatedItems,
      subtotal: sub,
      vat_total: vat,
      total: totalIncVat
    }
  }, [items, vatRate])

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddProduct = (product: any) => {
    const newItem: QuotationProductItem = {
      id: crypto.randomUUID(),
      type: 'product',
      sort_order: items.length,
      product_id: product.id,
      code: product.assigned_code || "N/A",
      description: product.name,
      quantity: 1,
      unit_price: product.price || 0,
      discount_percentage: 0,
      amount: product.price || 0,
      vat_rate: vatRate,
      vat_amount: (product.price || 0) * (vatRate / 100)
    }
    setItems([...items, newItem])
  }

  const handleAddSection = () => {
    const newItem: QuotationSectionHeader = {
      id: crypto.randomUUID(),
      type: 'section_header',
      sort_order: items.length,
      label: "New Section Header..."
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, updates: Partial<QuotationProductItem | QuotationSectionHeader>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } as QuotationItem : item))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    const newItems = [...items]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    
    const temp = newItems[index]
    newItems[index] = newItems[swapIndex]
    newItems[swapIndex] = temp
    
    setItems(newItems)
  }

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customer_name) {
      toast.error("Customer name is required.")
      return
    }

    if (items.length === 0) {
      toast.error("Please add at least one item to the quotation.")
      return
    }

    setShowConfirm(true)
  }

  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payloadData = {
        ...formData,
        items: totals.items,
        subtotal: totals.subtotal,
        vat_total: totals.vat_total,
        total: totals.total,
      }

      if (initialData?.id) {
        // Update
        const saved = await saveQuotation({ id: initialData.id, ...payloadData }, false)
        toast.success("Quotation updated")
        setShowConfirm(false)
        router.push(`/admin/quotations`)
      } else {
        // Create
        const saved = await saveQuotation(payloadData, true)
        toast.success("Quotation created")
        setShowConfirm(false)

        try {
          const blob = await generateQuotationPDF(saved)
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${saved.quote_number || 'quote'}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } catch (pdfErr) {
          toast.error("Saved, but PDF failed to generate.")
        }
        
        router.push(`/admin/quotations`)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle enter key to prevent accidental form submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault()
    }
  }

  return (
    <>
    <form onSubmit={handlePreSubmit} onKeyDown={handleKeyDown} className="space-y-8 pb-20">
      
      {/* Settings Panel */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
        <h2 className="font-semibold text-lg border-b pb-2">Customer Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Customer Name *</Label>
            <Input value={formData.customer_name} onChange={e => handleFieldChange("customer_name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={formData.customer_email} onChange={e => handleFieldChange("customer_email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={formData.customer_phone} onChange={e => handleFieldChange("customer_phone", e.target.value)} />
          </div>
        </div>

        <h2 className="font-semibold text-lg border-b pb-2 pt-4">Quote Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Quote Type</Label>
            <Input value={formData.quote_type} onChange={e => handleFieldChange("quote_type", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Delivery/Collection</Label>
            <Input value={formData.delivery_collection} onChange={e => handleFieldChange("delivery_collection", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cust. Order No.</Label>
            <Input value={formData.customer_order_no} onChange={e => handleFieldChange("customer_order_no", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Sales Rep Name</Label>
            <Input value={formData.sales_rep_name} onChange={e => handleFieldChange("sales_rep_name", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Line Items Panel */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <h2 className="font-semibold text-lg">Line Items</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <div className="w-full sm:w-80 relative">
               <QuotationProductSearch onSelectProduct={handleAddProduct} />
            </div>
            <Button type="button" variant="outline" onClick={handleAddSection} className="shrink-0 w-full sm:w-auto neu-raised border-transparent">
              <Plus className="w-4 h-4 mr-2"/> Add Sub-header
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            Search for products above to build the quote.
          </div>
        ) : (
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">Ord</th>
                  <th className="px-4 py-3 w-20">Qty</th>
                  <th className="px-4 py-3 w-32">Code</th>
                  <th className="px-4 py-3 min-w-[200px]">Description</th>
                  <th className="px-4 py-3 w-24">Disc%</th>
                  <th className="px-4 py-3 w-24">Unit Price</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  {/* <th className="px-4 py-3 text-right">VAT</th> */}
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {totals.items.map((item, index) => {
                  if (item.type === 'section_header') {
                    return (
                      <tr key={item.id} className="bg-gray-100 border-b">
                        <td className="px-4 py-2 border-r align-middle text-center">
                          <div className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100">
                             <button type="button" onClick={() => moveItem(index, 'up')}><ArrowUp className="w-3 h-3 hover:text-blue-600" /></button>
                             <button type="button" onClick={() => moveItem(index, 'down')}><ArrowDown className="w-3 h-3 hover:text-blue-600" /></button>
                          </div>
                        </td>
                        <td colSpan={6} className="px-4 py-2">
                          <Input 
                            value={item.label} 
                            onChange={(e) => updateItem(item.id, { label: e.target.value })}
                            className="font-bold border-gray-300"
                            placeholder="Enter section title..."
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 border-r align-middle text-center">
                         <div className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100">
                             <button type="button" onClick={() => moveItem(index, 'up')}><ArrowUp className="w-3 h-3 hover:text-blue-600" /></button>
                             <button type="button" onClick={() => moveItem(index, 'down')}><ArrowDown className="w-3 h-3 hover:text-blue-600" /></button>
                          </div>
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          type="number" 
                          min="0"
                          step="0.01"
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                          value={item.quantity === 0 ? "" : item.quantity} 
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </td>
                      <td className="px-4 py-2 font-medium">{item.code}</td>
                      <td className="px-4 py-2">
                        <Input 
                            value={item.description} 
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            className="min-w-[200px]"
                          />
                      </td>
                      <td className="px-4 py-2">
                         <Input 
                          type="number" 
                          min="0"
                          max="100"
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                          value={item.discount_percentage === 0 ? "" : item.discount_percentage} 
                          onChange={(e) => updateItem(item.id, { discount_percentage: parseFloat(e.target.value) || 0 })}
                          className="w-20 text-center"
                          placeholder="%"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                          value={item.unit_price === 0 ? "" : item.unit_price} 
                          onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                          className="w-24 text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        €{item.amount.toFixed(2)}
                      </td>
                      {/* <td className="px-4 py-2 text-right font-medium text-gray-500">
                        €{item.vat_amount.toFixed(2)}
                      </td> */}
                      <td className="px-4 py-2 text-right">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between gap-6 pt-6">
            <div className="w-full md:w-1/2 space-y-4">
               <div className="space-y-2">
                <Label>Instructions / Notes</Label>
                <Textarea 
                  rows={4}
                  value={formData.instructions} 
                  onChange={e => handleFieldChange("instructions", e.target.value)} 
                  placeholder="Installation instructions or special notes..."
                />
              </div>
            </div>
            <div className="w-full md:w-1/3 space-y-3 p-5 rounded-3xl neu-inset border-transparent">
               <div className="flex justify-between text-sm">
                 <span className="font-bold text-gray-800">Total Amount</span>
                 <span className="font-bold">€{totals.total.toFixed(2)}</span>
               </div>
               <div className="flex justify-between font-medium text-sm items-end text-gray-500">
                 <div className="flex flex-col">
                   <span>VAT Amount ({vatRate}%)</span>
                   <span className="text-xs font-normal text-gray-400 mt-0.5">(Included in Total)</span>
                 </div>
                 <span>- €{totals.vat_total.toFixed(2)}</span>
               </div>
               <div className="flex justify-between font-bold text-lg pt-2 border-t text-gray-800">
                 <div className="flex flex-col">
                   <span>Subtotal</span>
                 </div>
                 <span>€{totals.subtotal.toFixed(2)}</span>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-10 bg-white border-t p-4 shadow-lg flex justify-end gap-3">
         <Button type="button" variant="outline" onClick={() => router.push("/admin/quotations")} disabled={isSubmitting} className="neu-raised border-transparent">
           Cancel
         </Button>
         <Button type="submit" disabled={isSubmitting || items.length === 0} className="w-32 neu-raised text-white border-transparent hover:text-white">
           {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save Quote"}
         </Button>
      </div>

    </form>

    <Dialog open={showConfirm} onOpenChange={(open) => !isSubmitting && setShowConfirm(open)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Quotation</DialogTitle>
          <DialogDescription>
            {initialData?.id ? "Are you sure you want to update this quotation?" : "Are you sure you want to save this quotation? Once saved, the PDF will be generated immediately."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
          <Button variant="outline" type="button" onClick={() => setShowConfirm(false)} disabled={isSubmitting} className="neu-raised border-transparent">
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirmedSubmit} disabled={isSubmitting} className="neu-raised text-white border-transparent hover:text-white">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
