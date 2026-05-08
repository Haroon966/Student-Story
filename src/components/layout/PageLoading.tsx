/** Shown while lazy route modules load; kept inside the shell so headers stay visible. */
export function PageLoading() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-sm text-[var(--theme-charcoal-muted)]"
      aria-busy="true"
      aria-live="polite"
    >
      <span>Loading…</span>
    </div>
  )
}
