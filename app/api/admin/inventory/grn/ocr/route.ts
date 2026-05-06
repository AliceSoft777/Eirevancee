import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/loaders"
import { createWorker, Worker } from "tesseract.js"

export const runtime = "nodejs"

// ── Singleton OCR worker ───────────────────────────────────────────────────────
let _worker: Worker | null = null
let _workerInitialising = false

async function getWorker(): Promise<Worker> {
  if (_worker) return _worker
  if (_workerInitialising) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!_workerInitialising) { clearInterval(interval); resolve() }
      }, 50)
    })
    return _worker!
  }
  _workerInitialising = true
  try {
    _worker = await createWorker("eng")
  } finally {
    _workerInitialising = false
  }
  return _worker!
}

// ── OCR text normalisation ─────────────────────────────────────────────────────
const HEADER_WORDS = [
  "pallets", "boxes", "cajas", "pieces", "piezas", "blisters",
  "formato", "size", "descripcion", "description", "codigo", "code",
  "precio", "price", "importe", "amount", "total", "payment", "dto",
  "m2", "qty", "quantity", "ref", "s/ref", "visit", "alb",
]

function isHeaderOrNoiseLine(line: string): boolean {
  const lower = line.toLowerCase()
  const words = lower.split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const headerWordCount = words.filter(w => HEADER_WORDS.some(h => w.includes(h))).length
  if (headerWordCount / words.length > 0.6) return true
  if (/\d{2,}\/\d{2,}/.test(line) || /alb\./i.test(line)) return true
  if (/^[\d\s.,]+$/.test(line)) return true
  return false
}

// Extracts the product description from a full table row.
// Delivery-note rows have leading numeric columns (pallets, boxes, pieces, m2,
// size) before the name and trailing codes/prices after. We find the longest
// contiguous run of tokens that contains real alphabetic words.
function extractDescriptionSegment(line: string): string {
  const tokens = line.split(/\s+/).filter(Boolean)

  let bestStart = -1
  let bestLen = 0
  let cur = -1
  let curLen = 0

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const hasLetters = /[a-zA-Zà-ɏ]/.test(t)
    const isPureNumeric = /^[\d.,]+$/.test(t)
    // Short all-uppercase tokens are likely column codes (ST, CI, E) — skip them
    const isShortCode = t.length <= 2 && /^[A-Z]+$/.test(t)

    if (hasLetters && !isPureNumeric && !isShortCode) {
      if (cur === -1) { cur = i; curLen = 1 } else curLen++
    } else {
      if (curLen > bestLen) { bestStart = cur; bestLen = curLen }
      cur = -1; curLen = 0
    }
  }
  if (curLen > bestLen) { bestStart = cur; bestLen = curLen }

  if (bestStart === -1 || bestLen === 0) return line
  return tokens.slice(bestStart, bestStart + bestLen).join(" ")
}

function normaliseOcrText(raw: string): string {
  return raw
    .split("\n")
    .map((line) =>
      line
        .replace(/\|/g, "1")
        .replace(/[ \t]+/g, " ")
        .replace(/[^a-zA-Z0-9 '"\/.:(),xXáéíóúñüÁÉÍÓÚÑÜ-]/g, "")
        .trim()
    )
    .filter((line) => line.length >= 4)
    .filter((line) => !isHeaderOrNoiseLine(line))
    .map((line) => {
      // Lines starting with digits are full table rows — extract only the description
      if (/^\d/.test(line)) return extractDescriptionSegment(line)
      return line
    })
    .filter((line) => line.length >= 4)
    .join("\n")
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session || (session.userRole !== "admin" && session.userRole !== "sales" && session.userRole !== "inventory")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("image") as File | null

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "No valid image provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const worker = await getWorker()
    const { data } = await worker.recognize(buffer)

    const rawText = normaliseOcrText(data.text ?? "")

    return NextResponse.json({
      raw_text: rawText,
      confidence: Math.round(data.confidence ?? 0),
    })
  } catch (err: unknown) {
    _worker = null
    const message = err instanceof Error ? err.message : "OCR failed"
    console.error("[GRN OCR]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
