import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/loaders"
import { createWorker, Worker } from "tesseract.js"

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
// Tesseract raw output contains noise: vertical bars, lone punctuation, random
// characters. This produces clean lines the GRN parser can reliably consume.
function normaliseOcrText(raw: string): string {
  return raw
    .split("\n")
    .map((line) =>
      line
        .replace(/\|/g, "1")               // pipe → 1 (common OCR error)
        .replace(/[ \t]+/g, " ")            // collapse horizontal whitespace
        .replace(/[^a-zA-Z0-9 '"/\-.:,()xX×]/g, "") // strip noise chars
        .trim()
    )
    .filter((line) => line.length >= 3)    // drop very short artefact lines
    .join("\n")
}

export async function POST(req: Request) {
  try {
    // 1. AUTH
    const session = await getServerSession()
    if (!session || (session.userRole !== "admin" && session.userRole !== "sales")) {
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
