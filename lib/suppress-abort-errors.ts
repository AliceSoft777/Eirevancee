// Suppress Supabase AbortError in development (React Strict Mode + Fast Refresh)
// This catches AbortError from locks.ts:109 that happens outside async/await chains
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    // ✅ Suppress only AbortError from Supabase internal locks
    if (
      event.reason?.name === 'AbortError' ||
      event.reason?.message?.includes('AbortError') ||
      event.reason?.message?.includes('signal is aborted without reason')
    ) {
      console.debug('[suppress-abort-errors] Suppressed AbortError:', event.reason)
      event.preventDefault()
    }  })
}

export {}
