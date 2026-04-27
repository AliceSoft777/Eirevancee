"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Edit,
  Trash2,
  FileText,
  Loader2,
  Download,
  Eye,
  ArrowUpDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteQuotation } from "@/lib/quotation-actions";
import type { Quotation } from "@/lib/supabase-types";
import { toast } from "sonner";
import { generateQuotationPDF } from "@/lib/quotation-pdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuotationsTableProps {
  initialQuotations: Quotation[];
}

type SortField = "date" | "total" | "customer";
type SortDirection = "asc" | "desc";

export function QuotationsTable({ initialQuotations }: QuotationsTableProps) {
  const [quotations, setQuotations] = useState(initialQuotations);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Filter and sort quotations
  const filteredQuotations = useMemo(() => {
    let filtered = quotations.filter((quote) => {
      const query = searchQuery.toLowerCase();
      return (
        quote.quote_number.toLowerCase().includes(query) ||
        quote.customer_name.toLowerCase().includes(query) ||
        quote.customer_email?.toLowerCase().includes(query) ||
        quote.customer_phone?.toLowerCase().includes(query) ||
        (quote.quote_date &&
          format(new Date(quote.quote_date), "dd/MM/yyyy").includes(query))
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case "date":
          aVal = new Date(a.quote_date || 0).getTime();
          bVal = new Date(b.quote_date || 0).getTime();
          break;
        case "total":
          aVal = a.total;
          bVal = b.total;
          break;
        case "customer":
          aVal = a.customer_name;
          bVal = b.customer_name;
          break;
      }

      if (sortDirection === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [quotations, searchQuery, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;

    setDeletingId(quoteToDelete);
    try {
      await deleteQuotation(quoteToDelete);
      setQuotations(quotations.filter((q) => q.id !== quoteToDelete));
      toast.success("Quotation deleted");
    } catch (e: any) {
      toast.error("Failed to delete quotation");
    } finally {
      setDeletingId(null);
      setQuoteToDelete(null);
    }
  };

  const handleDownloadPDF = async (quote: Quotation) => {
    setGeneratingId(quote.id);
    try {
      const blob = await generateQuotationPDF(quote);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quote.quote_number || "quote"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to generate PDF");
      console.error(error);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleViewPDF = async (quote: Quotation) => {
    setGeneratingId(quote.id);
    try {
      const blob = await generateQuotationPDF(quote);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Failed to generate PDF preview");
    } finally {
      setGeneratingId(null);
    }
  };

  const closePdfPreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  if (quotations.length === 0) {
    return (
      <div className="neu-raised rounded-2xl p-12 text-center text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-gray-900">
          No quotations found
        </h3>
        <p className="mt-1">Get started by creating a new quotation.</p>
        <Button asChild className="mt-6">
          <Link href="/admin/quotations/new">Create Quotation</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Search
            </label>
            <Input
              placeholder="Search by quote number, customer name, email, phone or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Sort by
            </label>
            <Select
              value={sortField}
              onValueChange={(value) => setSortField(value as SortField)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Quote Date</SelectItem>
                <SelectItem value="total">Total Amount</SelectItem>
                <SelectItem value="customer">Customer Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            title={
              sortDirection === "asc"
                ? "Sorting ascending"
                : "Sorting descending"
            }
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>
        {filteredQuotations.length < quotations.length && (
          <p className="text-sm text-gray-500">
            Showing {filteredQuotations.length} of {quotations.length}{" "}
            quotations
          </p>
        )}
      </div>

      {filteredQuotations.length === 0 ? (
        <div className="neu-raised rounded-2xl p-8 text-center text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p>No quotations match your search criteria.</p>
        </div>
      ) : (
        <div className="neu-raised rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left bg-transparent">
              <thead className="text-xs text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Quote No.</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Total</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredQuotations.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-black/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      <span className="text-slate-700 font-semibold">
                        {quote.quote_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {quote.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {quote.customer_email && (
                        <div className="text-xs text-slate-500">
                          {quote.customer_email}
                        </div>
                      )}
                      {quote.customer_phone && (
                        <div className="text-xs text-slate-500">
                          {quote.customer_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {quote.quote_date
                        ? format(new Date(quote.quote_date), "MMM d, yyyy")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">
                      €{quote.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPDF(quote)}
                          disabled={generatingId === quote.id}
                          className="h-8 w-8 px-0 neu-raised hover:bg-black/5"
                          title="View Quote PDF"
                        >
                          {generatingId === quote.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 w-8 px-0 neu-raised hover:bg-black/5"
                          title="Edit Quote"
                        >
                          <Link href={`/admin/quotations/${quote.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(quote)}
                          disabled={generatingId === quote.id}
                          title="Download PDF"
                          className="h-8 w-8 px-0 neu-raised hover:bg-black/5"
                        >
                          {generatingId === quote.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 px-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 neu-raised"
                          onClick={() => setQuoteToDelete(quote.id)}
                          disabled={deletingId === quote.id}
                          title="Delete Quote"
                        >
                          {deletingId === quote.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Preview Modal — removed, now opens in new tab */}

      <Dialog
        open={!!quoteToDelete}
        onOpenChange={(open) => !deletingId && !open && setQuoteToDelete(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to completely delete this quotation? This
              action cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => setQuoteToDelete(null)}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Yes, Delete Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
