import { startTransition, useEffect, useState } from 'react'

/**
 * Creates an object URL from a Blob and revokes it on cleanup or when `blob` changes.
 * Use this instead of useMemo(createObjectURL) + revoke: Strict Mode revokes the URL on the
 * simulated unmount, but useMemo still returns the stale revoked string on remount.
 */
export function useBlobUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      startTransition(() => setUrl(null))
      return
    }
    const objectUrl = URL.createObjectURL(blob)
    startTransition(() => setUrl(objectUrl))
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [blob])

  return url
}
