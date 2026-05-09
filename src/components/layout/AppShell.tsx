import { BottomNav } from '@/components/layout/BottomNav'
import { PageLoading } from '@/components/layout/PageLoading'
import { LOGO_PNG } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'
import { Link, Outlet, useMatch } from 'react-router-dom'

/** Bottom padding clears the rounded nav bar + FAB overhang + safe area. */
const shellBottomPad = 'pb-[calc(7rem+env(safe-area-inset-bottom))]'

export function AppShell() {
  const isStudentChat    = Boolean(useMatch({ path: '/student/:id', end: true }))
  const isStudentCamera  = Boolean(useMatch('/student/:id/camera'))
  const isStudentProfile = Boolean(useMatch('/student/:id/profile'))
  const isStudentAi      = Boolean(useMatch('/student/:id/ai'))
  const isStudentFocusView = isStudentChat || isStudentCamera || isStudentProfile || isStudentAi

  return (
    <div
      className={cn(
        'flex flex-col bg-[var(--theme-background)]',
        isStudentFocusView
          ? 'h-dvh min-h-0 overflow-hidden'
          : cn('min-h-dvh', shellBottomPad),
      )}
    >
      {!isStudentFocusView ? (
        <header
          className="sticky top-0 z-40 bg-[var(--theme-app-header-bg)] text-[var(--theme-app-header-fg)]"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5 sm:px-5">
            <Link to="/" className="flex min-w-0 flex-1 items-center gap-3">
              <img
                src={LOGO_PNG}
                alt=""
                width={36}
                height={36}
                decoding="async"
                className="size-9 shrink-0 object-contain"
              />
              <span className="min-w-0 leading-tight">
                <span
                  className="block truncate font-semibold"
                  style={{
                    fontSize: 'var(--text-lg)',
                    letterSpacing: 'var(--tracking-tight)',
                    lineHeight: 'var(--leading-tight)',
                  }}
                >
                  Student Story
                </span>
                <span
                  className="block truncate opacity-80"
                  style={{
                    fontSize: 'var(--text-sm)',
                    lineHeight: 'var(--leading-snug)',
                    fontWeight: 400,
                  }}
                >
                  Stories · offline on this device
                </span>
              </span>
            </Link>
          </div>
        </header>
      ) : null}

      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          isStudentFocusView
            ? 'w-full max-w-none p-0'
            : 'mx-auto w-full max-w-3xl px-0 pb-2 pt-0 sm:px-4 sm:pb-4',
        )}
      >
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      {!isStudentFocusView ? (
        <footer
          className="mx-auto hidden max-w-3xl px-5 py-3 text-center sm:block"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--theme-charcoal-muted)' }}
        >
          Stored locally in your browser — nothing leaves until you export or enable the AI coach.
        </footer>
      ) : null}

      {!isStudentFocusView ? <BottomNav /> : null}
    </div>
  )
}
