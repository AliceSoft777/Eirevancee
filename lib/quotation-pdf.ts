import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Quotation } from "./supabase-types"
import { format } from "date-fns"

// Utility to load image to base64 on client
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generateQuotationPDF(quote: Quotation): Promise<Blob> {
  const doc = new jsPDF()
  
  // Load logo
  const logoBase64 = await fetchImageAsBase64("/images/celticlogo.png")

  doc.setFont("helvetica")

  // 1. Company Header
  if (logoBase64) {
    // Attempt to add logo. Adjust dimensions based on your specific logo aspect ratio.
    doc.addImage(logoBase64, 'PNG', 14, 12, 50, 20)
  } else {
    // Fallback if logo fails to load
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Celtic Tiles", 14, 20)
  }

  doc.setFontSize(26)
  doc.setFont("helvetica", "bold")
  doc.text("Quote", 195, 25, { align: "right" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Celtic Tiles Ltd", 70, 18)
  doc.text("Unit D3 Finches industrial Park", 70, 23)
  doc.text("Longmile Road", 70, 28)
  doc.text("Dublin12 D12FP74", 70, 33)

  // 2. Quote To Box
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(14, 45, 80, 40) // x, y, w, h
  
  doc.setFont("helvetica", "bold")
  doc.text("Quote To", 16, 50)
  doc.setLineWidth(0.2)
  doc.line(14, 52, 94, 52) // underline

  doc.setFont("helvetica", "normal")
  doc.text(doc.splitTextToSize(quote.customer_name || "", 75), 16, 58)
  if (quote.quote_type) {
    doc.text(quote.quote_type, 16, 80)
  }

  // 3. Meta Row
  const metaY = 95
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("QTE No.", 14, metaY)
  doc.text("QTE Date", 45, metaY)
  doc.text("Cust. Order No.", 75, metaY)
  doc.text("Delivery/Collection", 115, metaY)
  doc.text("Sales Rep", 155, metaY)

  doc.setFont("helvetica", "normal")
  doc.text(quote.quote_number || "", 14, metaY + 5)
  const dt = quote.quote_date ? format(new Date(quote.quote_date), 'dd/MM/yyyy') : ""
  doc.text(dt, 45, metaY + 5)
  doc.text(quote.customer_order_no || "", 75, metaY + 5)
  doc.text(quote.delivery_collection || "", 115, metaY + 5)
  doc.text(quote.sales_rep_name || "System Default Rep", 155, metaY + 5)

  // 4. Products Table
  const validItems: any[] = []
  
  for (let i = 0; i < quote.items.length; i++) {
    const item = quote.items[i]
    if (item.type === 'section_header') {
      // Check if there are any products following this section header before the next section header
      let hasProducts = false
      for (let j = i + 1; j < quote.items.length; j++) {
        if (quote.items[j].type === 'product') {
          hasProducts = true
          break
        }
        if (quote.items[j].type === 'section_header') {
          break
        }
      }
      if (hasProducts) {
        validItems.push(item)
      }
    } else if (item.type === 'product') {
      validItems.push(item)
    }
  }

  const tableData = validItems.map(item => {
    if (item.type === 'section_header') {
      return [{ content: item.label, colSpan: 6, styles: { fontStyle: 'bold' as const, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } }]
    } else {
      return [
        item.quantity.toFixed(2),
        item.code,
        item.description,
        item.discount_percentage ? item.discount_percentage.toString() : "0",
        `€${item.unit_price.toFixed(2)}`,
        `€${item.amount.toFixed(2)}`
      ]
    }
  })

  autoTable(doc, {
    startY: 105,
    head: [['Total\nQty', 'Code', 'Description', 'Discount %', 'Unit\nPrice', 'Amount']], // 'VAT'
    body: tableData as any,
    theme: 'plain',
    headStyles: { fillColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const, textColor: [0, 0, 0] as [number, number, number], lineColor: [0, 0, 0] as [number, number, number], lineWidth: { top: 1, bottom: 1, left: 0, right: 0 } as any },
    bodyStyles: { textColor: [0, 0, 0] as [number, number, number], lineWidth: 0 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 25 },
      2: { cellWidth: 82 }, // Distributed the VAT column width here
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      // 6: { cellWidth: 22, halign: 'right' }
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  // 5. Totals & Instructions Area
  // Left Box: Instructions + Notes
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(14, finalY, 110, 30) // Instructions box
  doc.rect(14, finalY + 32, 110, 20) // Notes box

  doc.setFont("helvetica", "bold")
  doc.text("Instruction:", 16, finalY + 5)
  doc.setFont("helvetica", "normal")
  doc.text(doc.splitTextToSize(quote.instructions || "", 105), 16, finalY + 10)

  doc.setFont("helvetica", "bold")
  doc.text("Please Note:", 16, finalY + 37)
  doc.setFont("helvetica", "normal")
  const defaultNotes = "Prices are subject to fluctuation due to supplier increase and are valid for only 30 days of the quote date."
  doc.text(doc.splitTextToSize(defaultNotes, 85), 38, finalY + 37)

  // Right Box: Totals
  doc.rect(126, finalY, 70, 52) 
  
  doc.setFont("helvetica", "bold")
  doc.text("Total Amount", 130, finalY + 8)
  doc.text(`€${quote.total.toFixed(2)}`, 190, finalY + 8, { align: "right" })

  // Derive vat rate from what was saved inside an item for display
  const sampleVatRate = quote.items.find(item => item.type === 'product' && typeof item.vat_rate === 'number' && item.vat_rate > 0)?.vat_rate || 0

  doc.setFont("helvetica", "normal")
  doc.text(`VAT Amount (${sampleVatRate}%)`, 130, finalY + 18)
  doc.text(`- €${quote.vat_total.toFixed(2)}`, 190, finalY + 18, { align: "right" })

  doc.text("(Included in Total)", 130, finalY + 22)
  doc.setFontSize(8)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Subtotal", 130, finalY + 30)
  doc.text(`€${quote.subtotal.toFixed(2)}`, 190, finalY + 30, { align: "right" })

  doc.setFontSize(10)
  doc.line(126, finalY + 35, 196, finalY + 35) // separator
  doc.text("Signature:", 130, finalY + 41)

  // 6. Footer (Page level)
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text(`Page ${i} of ${pageCount}`, 190, 275, { align: "right" })

    // Red footer bar
    doc.setFillColor(136, 17, 33) // dark red matching the reference
    doc.rect(14, 277, 182, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text("Phone:+35314090558 Cell:+353870007777 Email:info@celtictiles.ie Website:https://www.celtictiles.ie", 16, 281)
    doc.text("VAT Reg. No.:4047335JH Company Reg No.:725840", 16, 285)
    doc.setTextColor(0, 0, 0) // reset
  }

  return doc.output('blob')
}
