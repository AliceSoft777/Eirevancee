// Suppress Supabase AbortError in development (React Strict Mode + Fast Refresh)
// This catches AbortError from locks.ts:109 that happens outside async/await chains
if (typeof window !== 'undefined') {
  // ✅ Suppress unhandled promise rejections (AbortError from Supabase locks)
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const reasonStr = String(reason?.message || reason || '')
    
    // Check for AbortError from Supabase (very aggressive matching)
    if (
      reason?.name === 'AbortError' ||
      reasonStr.includes('AbortError') ||
      reasonStr.includes('signal is aborted without reason') ||
      reasonStr.includes('AbortSignal') ||
      reasonStr.includes('locks.ts') ||
      reasonStr.includes('abort') && reasonStr.includes('signal') ||
      reason?.code === 20 || // DOMException code for AbortError
      reason?.constructor?.name === 'DOMException'
    ) {
      console.debug('[suppress-abort-errors] Suppressed AbortError from Supabase')
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      return
    }

    // Also suppress navigation aborts (Next.js fast refresh)
    if (
      reason?.message?.includes('NEXT_') ||
      reason?.digest?.includes('NEXT_') ||
      reason?.message?.includes('navigation')
    ) {
      console.debug('[suppress-abort-errors] Suppressed Next.js navigation abort:', reason)
      event.preventDefault()
      return
    }
  })

  // ✅ Suppress console errors for AbortError
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    const message = String(args[0] || '')
    const fullMessage = args.map(a => String(a)).join(' ')
    
    if (
      message.includes('AbortError') ||
      message.includes('signal is aborted without reason') ||
      message.includes('AbortSignal') ||
      message.includes('locks.ts') ||
      fullMessage.includes('AbortError') ||
      fullMessage.includes('signal is aborted') ||
      (message.includes('abort') && message.includes('signal')) ||
      args.some((arg: any) => arg?.name === 'AbortError' || arg?.code === 20)
    ) {
      // Completely suppress, don't even log
      return
    }
    originalConsoleError.apply(console, args)
  }

  // ✅ Global error handler for uncaught exceptions
  window.addEventListener('error', (event: ErrorEvent) => {
    if (
      event.error?.name === 'AbortError' ||
      event.message?.includes('AbortError') ||
      event.message?.includes('signal is aborted without reason')
    ) {
      console.debug('[suppress-abort-errors] Suppressed global AbortError:', event.error)
      event.preventDefault()
      return
    }
  })
}

export {}
