import { BottomNav } from '@/components/layout/BottomNav'
import { PageLoading } from '@/components/layout/PageLoading'
import { cn } from '@/lib/utils'
import { BookOpen } from 'lucide-react'
import { Suspense } from 'react'
import { Link, Outlet, useMatch } from 'react-router-dom'

/** Clears rounded bar + elevated FAB + safe area. */
const shellBottomPad = 'pb-[calc(7.25rem+env(safe-area-inset-bottom))]'

export function AppShell() {
  const isStudentChat = Boolean(useMatch({ path: '/student/:id', end: true }))
  const isStudentCamera = Boolean(useMatch('/student/:id/camera'))
  const isStudentProfile = Boolean(useMatch('/student/:id/profile'))
  const isStudentAi = Boolean(useMatch('/student/:id/ai'))
  const isStudentFocusView = isStudentChat || isStudentCamera || isStudentProfile || isStudentAi

  return (
    <div
      className={cn(
        'flex flex-col bg-[var(--theme-background)]',
        isStudentFocusView ? 'h-dvh min-h-0 overflow-hidden' : cn('min-h-dvh', shellBottomPad),
      )}
    >
      {!isStudentFocusView ? (
        <header className="sticky top-0 z-40 bg-[var(--theme-app-header-bg)] text-[var(--theme-app-header-fg)] shadow-[var(--shadow)]">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-3 sm:px-4">
            <Link to="/" className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgb(255_255_255_/_0.22)]">
                <BookOpen className="size-[22px]" aria-hidden />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[17px] font-semibold tracking-tight">Student Story</span>
                <span className="block truncate text-[13px] opacity-90">Stories · offline on this device</span>
              </span>
            </Link>
          </div>
        </header>
      ) : null}

      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          isStudentFocusView ? 'w-full max-w-none p-0' : 'mx-auto w-full max-w-3xl px-0 pb-2 pt-0 sm:px-4 sm:pb-4 sm:pt-0',
        )}
      >
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      {!isStudentFocusView ? (
        <footer className="mx-auto hidden max-w-3xl px-4 py-2 text-center text-[11px] text-[var(--theme-charcoal-muted)] sm:block">
          Encrypted by locality: everything stays on your phone or computer until you export it.
        </footer>
      ) : null}

      {!isStudentFocusView ? <BottomNav /> : null}
    </div>
  )
}
