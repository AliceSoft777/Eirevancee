"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Edit, Trash2, FileText, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteQuotation } from "@/lib/quotation-actions"
import type { Quotation } from "@/lib/supabase-types"
import { toast } from "sonner"
import { generateQuotationPDF } from "@/lib/quotation-pdf"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface QuotationsTableProps {
  initialQuotations: Quotation[]
}

export function QuotationsTable({ initialQuotations }: QuotationsTableProps) {
  const [quotations, setQuotations] = useState(initialQuotations)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null)

  const confirmDelete = async () => {
    if (!quoteToDelete) return

    setDeletingId(quoteToDelete)
    try {
      await deleteQuotation(quoteToDelete)
      setQuotations(quotations.filter(q => q.id !== quoteToDelete))
      toast.success("Quotation deleted")
    } catch (e: any) {
      toast.error("Failed to delete quotation")
    } finally {
      setDeletingId(null)
      setQuoteToDelete(null)
    }
  }

  const handleDownloadPDF = async (quote: Quotation) => {
    setGeneratingId(quote.id)
    try {
      const blob = await generateQuotationPDF(quote)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quote.quote_number || 'quote'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error("Failed to generate PDF")
      console.error(error)
    } finally {
      setGeneratingId(null)
    }
  }



  if (quotations.length === 0) {
    return (
      <div className="neu-raised rounded-2xl p-12 text-center text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-gray-900">No quotations found</h3>
        <p className="mt-1">Get started by creating a new quotation.</p>
        <Button asChild className="mt-6">
          <Link href="/admin/quotations/new">Create Quotation</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
    <div className="neu-raised rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left bg-transparent">
          <thead className="text-xs text-gray-500 uppercase border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium">Quote No.</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Total</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {quotations.map((quote) => (
              <tr key={quote.id} className="hover:bg-black/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                  <span className="text-slate-700 font-semibold">
                    {quote.quote_number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{quote.customer_name}</div>
                  {quote.customer_email && <div className="text-xs text-slate-500">{quote.customer_email}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {quote.quote_date ? format(new Date(quote.quote_date), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">
                  €{quote.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadPDF(quote)}
                      disabled={generatingId === quote.id}
                      title="Download PDF"
                      className="h-8 w-8 px-0 neu-raised hover:bg-black/5"
                    >
                      {generatingId === quote.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 px-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 neu-raised"
                      onClick={() => setQuoteToDelete(quote.id)}
                      disabled={deletingId === quote.id}
                      title="Delete Quote"
                    >
                      {deletingId === quote.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <Dialog open={!!quoteToDelete} onOpenChange={(open) => !deletingId && !open && setQuoteToDelete(null)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Quotation</DialogTitle>
          <DialogDescription>
            Are you sure you want to completely delete this quotation? This action cannot be reversed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
          <Button variant="outline" type="button" onClick={() => setQuoteToDelete(null)} disabled={!!deletingId}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={confirmDelete} disabled={!!deletingId}>
            {deletingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Yes, Delete Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
