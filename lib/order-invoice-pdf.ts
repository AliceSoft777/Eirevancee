import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { readFile } from "node:fs/promises"
import path from "node:path"

interface InvoiceItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface InvoiceAddress {
  street?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
}

export interface InvoiceOrderData {
  order_number: string
  created_at: string
  customer_name: string
  payment_method: string | null
  subtotal: number
  tax: number
  discount: number
  shipping_fee: number
  total: number
  items: InvoiceItem[]
  delivery_address: InvoiceAddress | null
}

async function loadLogoDataUri(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "celticlogo.png")
    const file = await readFile(logoPath)
    return `data:image/png;base64,${file.toString("base64")}`
  } catch {
    return null
  }
}

function safeNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  return Number.isFinite(num) ? num : 0
}

export async function generateOrderInvoicePdfBuffer(order: InvoiceOrderData): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const logoDataUri = await loadLogoDataUri()

  doc.setFont("helvetica", "normal")

  if (logoDataUri) {
    doc.addImage(logoDataUri, "PNG", 14, 12, 38, 16)
  } else {
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("CELTIC TILES", 14, 18)
  }

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Celtic Tiles Ltd", 54, 15)
  doc.text("Unit D3 Finches industrial Park", 54, 19)
  doc.text("Longmile Road Dublin12 D12FP74", 54, 23)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Invoice", pageWidth - 14, 20, { align: "right" })

  const boxY = 38
  const boxH = 32

  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.rect(14, boxY, 88, boxH)
  doc.rect(pageWidth - 102, boxY, 88, boxH)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Name/Address", 16, boxY + 5)
  doc.text("Ship To", pageWidth - 100, boxY + 5)

  doc.setLineWidth(0.2)
  doc.line(14, boxY + 7, 102, boxY + 7)
  doc.line(pageWidth - 102, boxY + 7, pageWidth - 14, boxY + 7)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const addressLines = [
    order.customer_name,
    order.delivery_address?.street || "",
    [order.delivery_address?.city, order.delivery_address?.state].filter(Boolean).join(", "),
    [order.delivery_address?.pincode, order.delivery_address?.country].filter(Boolean).join(" "),
  ].filter(Boolean)
  doc.text(addressLines.slice(0, 4), 16, boxY + 12)

  doc.text(order.customer_name || "", pageWidth - 100, boxY + 12)
  doc.text(order.payment_method === "offline_cash" ? "Cash on Collection" : "Card Payment", pageWidth - 100, boxY + 20)

  const metaY = boxY + boxH + 9
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.text("Inv No.", 14, metaY)
  doc.text("Tax Date", 44, metaY)
  doc.text("Cust. Order No.", 74, metaY)
  doc.text("Sales Rep", 114, metaY)
  doc.text("Delivery/Collection", 142, metaY)

  doc.setFont("helvetica", "normal")
  doc.text(order.order_number, 14, metaY + 4)
  doc.text(format(new Date(order.created_at), "dd/MM/yyyy"), 44, metaY + 4)
  doc.text(order.order_number, 74, metaY + 4)
  doc.text("WEB", 114, metaY + 4)
  doc.text(order.payment_method === "offline_cash" ? "Collection" : "Delivery", 142, metaY + 4)

  const vatRate = order.total > 0 && order.tax > 0 ? Math.round((order.tax / Math.max(order.total - order.tax, 1)) * 10000) / 100 : 0

  const rows = order.items.map((item) => {
    const qty = safeNumber(item.quantity)
    const unitPrice = safeNumber(item.unit_price)
    const amount = safeNumber(item.subtotal)
    const vat = vatRate > 0 ? amount * (vatRate / 100) : 0
    return [
      qty.toFixed(2),
      item.product_id || "-",
      item.product_name || "-",
      `€${unitPrice.toFixed(2)}`,
      `€${amount.toFixed(2)}`,
      `€${vat.toFixed(2)}`,
    ]
  })

  autoTable(doc, {
    startY: metaY + 7,
    head: [["Total Qty", "Code", "Description", "Unit Price", "Amount", "VAT"]],
    body: rows,
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: {
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      fontStyle: "bold",
      lineColor: [0, 0, 0],
      lineWidth: { top: 0.4, bottom: 0.4, left: 0, right: 0 },
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 24 },
      2: { cellWidth: 74 },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
    },
  })

  const tableY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 180
  const summaryTop = Math.min(tableY + 8, pageHeight - 52)

  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.rect(14, summaryTop, 74, 34)
  doc.rect(91, summaryTop, 45, 34)
  doc.rect(pageWidth - 68, summaryTop, 54, 34)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Banking Details:", 16, summaryTop + 5)
  doc.setFont("helvetica", "normal")
  doc.text(["AIB", "Sort Code: 932515", "Account No: 97805024"], 16, summaryTop + 10)

  doc.setFont("helvetica", "bold")
  doc.text("Signature", 98, summaryTop + 5)

  const subtotal = Math.max(0, order.total - order.tax - order.shipping_fee)
  const lines = [
    ["Subtotal", `€${subtotal.toFixed(2)}`],
    ["VAT Total", `€${safeNumber(order.tax).toFixed(2)}`],
  ]
  if (safeNumber(order.discount) > 0) {
    lines.push(["Discount", `-€${safeNumber(order.discount).toFixed(2)}`])
  }
  if (safeNumber(order.shipping_fee) > 0) {
    lines.push(["Shipping", `€${safeNumber(order.shipping_fee).toFixed(2)}`])
  }
  lines.push(["Total", `€${safeNumber(order.total).toFixed(2)}`])

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  let lineY = summaryTop + 5
  for (const [label, value] of lines) {
    doc.text(label, pageWidth - 66, lineY)
    doc.text(value, pageWidth - 16, lineY, { align: "right" })
    lineY += 6
  }

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.text(format(new Date(order.created_at), "dd/MM/yyyy HH:mm"), pageWidth / 2, pageHeight - 12, { align: "center" })
  doc.text("Page 1 of 1", pageWidth - 14, pageHeight - 12, { align: "right" })

  doc.setFillColor(136, 17, 33)
  doc.rect(14, pageHeight - 10, pageWidth - 28, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.text("Phone:+35314090558 Cell:+353870007777 Email:info@celtictiles.ie Website:https://www.celtictiles.ie", 16, pageHeight - 6.5)
  doc.text("VAT Reg. No.:4047335JH Company Reg No.:725840", 16, pageHeight - 3.5)
  doc.setTextColor(0, 0, 0)

  const arrayBuffer = doc.output("arraybuffer")
  return Buffer.from(arrayBuffer)
}
