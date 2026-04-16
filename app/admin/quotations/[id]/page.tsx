import { QuotationBuilder } from "@/components/admin/QuotationBuilder"
import { getStoreVatRate, getQuotationById } from "@/lib/quotation-actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { QuotationHeaderActions } from "@/components/admin/QuotationHeaderActions"
export const revalidate = 0

export const metadata = {
  title: "Edit Quotation | Admin",
  description: "Edit quotation details",
}

export default async function EditQuotationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const [vatRate, quote] = await Promise.all([
    getStoreVatRate(),
    getQuotationById(params.id)
  ])
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/quotations" className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Quote: {quote.quote_number}</h1>
            <p className="text-sm text-slate-500 mt-1">{quote.customer_name}</p>
          </div>
        </div>
        
        <QuotationHeaderActions quote={quote} />
      </div>
      
      <QuotationBuilder vatRate={vatRate} initialData={quote} />
    </div>
  )
}

