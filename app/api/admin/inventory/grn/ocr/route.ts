import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/loaders"
import { createWorker, Worker } from "tesseract.js"

export const runtime = "nodejs"

// ── Singleton OCR worker ───────────────────────────────────────────────────────
// Creating a Tesseract worker is expensive (~1 s per request). We keep one
// alive for the server process lifetime and reuse it across all requests.
let _worker: Worker | null = null
let _workerInitialising = false

async function getWorker(): Promise<Worker> {
  if (_worker) return _worker
  // Spin-wait if another concurrent request is already initialising
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
// Drops invoice column headers and reference lines while keeping product names
// that legitimately contain numbers (e.g. "Vanity Model 8112-80 C").
const HEADER_WORDS = [
  "pallets", "boxes", "cajas", "pieces", "piezas", "blisters",
  "formato", "size", "descripcion", "description", "codigo", "code",
  "precio", "price", "importe", "amount", "total", "payment", "dto",
  "m2", "qty", "quantity", "ref", "s/ref", "visit", "alb",
]

function isHeaderOrNoiseLine(line: string): boolean {
  const lower = line.toLowerCase()
  // Drop lines that are purely column headers (all words match known header words)
  const words = lower.split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const headerWordCount = words.filter(w => HEADER_WORDS.some(h => w.includes(h))).length
  // If more than 60% of words are header words → drop the line
  if (headerWordCount / words.length > 0.6) return true
  // Drop lines that look like reference/date lines: contain "/" with numbers (e.g. "Alb. 201.351 / 14-10-25")
  if (/\d{2,}\/\d{2,}/.test(line) || /alb\./i.test(line)) return true
  // Drop lines that are purely numeric with spaces (e.g. "1 36 216 38,88")
  if (/^[\d\s.,]+$/.test(line)) return true
  return false
}

function normaliseOcrText(raw: string): string {
  return raw
    .split("\n")
    .map((line) =>
      line
        .replace(/\|/g, "1")               // pipe → 1 (common OCR error)
        .replace(/[ \t]+/g, " ")            // collapse horizontal whitespace
        .replace(/[^a-zA-Z0-9 '"/.:(),xX\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00fc\u00c1\u00c9\u00cd\u00d3\u00da\u00d1\u00dc-]/g, "") // keep accented chars
        .trim()
    )
    .filter((line) => line.length >= 4)    // drop very short artefact lines
    .filter((line) => !isHeaderOrNoiseLine(line)) // drop header/noise lines
    .join("\n")
}

export async function POST(req: Request) {
  try {
    // 1. AUTH
    const session = await getServerSession()
    if (!session || (session.userRole !== "admin" && session.userRole !== "sales" && session.userRole !== "inventory")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse multipart form
    const formData = await req.formData()
    const file = formData.get("image") as File | null

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "No valid image provided" }, { status: 400 })
    }

    // 3. File → Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 4. Run OCR via singleton worker (no cold-start after first request)
    const worker = await getWorker()
    const { data } = await worker.recognize(buffer)

    const rawText = normaliseOcrText(data.text ?? "")

    return NextResponse.json({
      raw_text: rawText,
      confidence: Math.round(data.confidence ?? 0),
    })
  } catch (err: unknown) {
    // Reset the singleton so the next request rebuilds a clean worker
    _worker = null
    const message = err instanceof Error ? err.message : "OCR failed"
    console.error("[GRN OCR]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
