// Patch navigator.locks.request to silently catch AbortError
// This prevents the error from reaching Next.js dev overlay
if (typeof window !== 'undefined' && navigator?.locks?.request) {
  const orig = navigator.locks.request.bind(navigator.locks)

  const patched = (
    name: string,
    second: any,
    third?: any
  ): Promise<any> => {
    const p = third ? orig(name, second, third) : orig(name, second)
    return p.catch((err: any) => {
      if (err?.name === 'AbortError' || err?.message?.includes('signal is aborted') || err?.code === 20) {
        return undefined
      }
      throw err
    })
  }

  navigator.locks.request = patched as any
}

export {}
