import { StudentFormDialog } from '@/components/students/StudentFormDialog'
import { cn } from '@/lib/utils'
import { BookOpen, HardDriveDownload, Plus, Settings } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

type SlotId = 'chats' | 'downloads' | 'settings'

export function BottomNav() {
  const location = useLocation()
  const [addOpen, setAddOpen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const chatsSlotRef = useRef<HTMLDivElement>(null)
  const downloadsSlotRef = useRef<HTMLDivElement>(null)
  const settingsSlotRef = useRef<HTMLDivElement>(null)

  const [pill, setPill] = useState<{ left: number; width: number; height: number; visible: boolean }>({
    left: 0,
    width: 0,
    height: 48,
    visible: false,
  })

  const activeSlot: SlotId | null = (() => {
    const seg = location.pathname.replace(/\/+$/, '') || '/'
    if (seg === '/') return 'chats'
    if (seg === '/downloads' || seg.startsWith('/downloads/')) return 'downloads'
    if (seg === '/settings' || seg.startsWith('/settings/')) return 'settings'
    return null
  })()

  const measurePill = useCallback(() => {
    const panel = panelRef.current
    const slotKey = activeSlot
    if (!panel || !slotKey) {
      setPill((prev) => ({ ...prev, visible: false }))
      return
    }
    const slotEl =
      slotKey === 'chats' ? chatsSlotRef.current : slotKey === 'downloads' ? downloadsSlotRef.current : settingsSlotRef.current
    if (!slotEl) return

    const pr = panel.getBoundingClientRect()
    const sr = slotEl.getBoundingClientRect()
    const left = sr.left - pr.left
    const width = sr.width
    const height = Math.max(sr.height, 44)

    setPill({ left, width, height, visible: width > 0 })
  }, [activeSlot])

  useLayoutEffect(() => {
    measurePill()
  }, [measurePill, location.pathname])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measurePill())
    ro.observe(panel)
    return () => ro.disconnect()
  }, [measurePill])

  useLayoutEffect(() => {
    window.addEventListener('resize', measurePill)
    return () => window.removeEventListener('resize', measurePill)
  }, [measurePill])

  return (
    <>
      <nav
        className={cn(
          'pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center',
          'pb-[env(safe-area-inset-bottom)]',
        )}
        aria-label="Main navigation"
      >
        <div className="pointer-events-auto w-full max-w-lg">
          <div
            ref={panelRef}
            className={cn(
              'relative overflow-hidden rounded-t-[28px] border border-[var(--theme-border)] border-b-0 bg-[var(--theme-surface)]',
              'shadow-[0_-10px_40px_rgb(21_91_91_/_0.09),0_-2px_12px_rgb(0_0_0_/_0.04)]',
              'px-2 pb-3 pt-9 sm:rounded-t-[30px]',
            )}
          >
            {/* Sliding highlight (reference `.con-effect` / `.effect`) */}
            <div
              className="pointer-events-none absolute inset-0 flex items-end justify-stretch rounded-t-[28px] sm:rounded-t-[30px]"
              aria-hidden
            >
              <div className="relative h-full w-full overflow-hidden rounded-t-[inherit] pb-3">
                <div
                  className={cn(
                    'absolute bottom-3 left-0 rounded-[18px] bg-[color-mix(in_srgb,var(--theme-primary)_16%,transparent)]',
                    'motion-safe:transition-[transform,width,height,opacity] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
                    'motion-reduce:transition-none',
                    pill.visible ? 'opacity-100' : 'opacity-0',
                  )}
                  style={{
                    width: pill.width,
                    height: pill.height,
                    transform: `translateX(${pill.left}px)`,
                  }}
                />
              </div>
            </div>

            <div className="relative grid min-w-0 grid-cols-4 items-end gap-0.5 px-0.5 sm:gap-1 sm:px-1">
              <div ref={chatsSlotRef} className="flex min-h-[56px] min-w-0 w-full items-end justify-center pb-0.5">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[52px] w-full min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-1.5 outline-none transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-surface)]',
                      'active:motion-safe:scale-[1.06] motion-reduce:active:scale-100',
                      isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-charcoal-muted)] hover:text-[var(--theme-charcoal)]',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <BookOpen
                        className={cn('size-[22px] shrink-0 sm:size-6', isActive ? 'stroke-[2.35]' : 'stroke-[2]')}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <span
                        className={cn(
                          'line-clamp-2 max-w-full text-center text-[10px] leading-[1.15] tracking-[0.02em] text-balance sm:text-[11px]',
                          isActive ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        Stories
                      </span>
                    </>
                  )}
                </NavLink>
              </div>

              <div ref={downloadsSlotRef} className="flex min-h-[56px] min-w-0 w-full items-end justify-center pb-0.5">
                <NavLink
                  to="/downloads"
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[52px] w-full min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-1.5 outline-none transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-surface)]',
                      'active:motion-safe:scale-[1.06] motion-reduce:active:scale-100',
                      isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-charcoal-muted)] hover:text-[var(--theme-charcoal)]',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <HardDriveDownload
                        className={cn('size-[22px] shrink-0 sm:size-6', isActive ? 'stroke-[2.35]' : 'stroke-[2]')}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <span
                        className={cn(
                          'line-clamp-2 max-w-full text-center text-[10px] leading-[1.15] tracking-[0.02em] text-balance sm:text-[11px]',
                          isActive ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        Download
                      </span>
                    </>
                  )}
                </NavLink>
              </div>

              <div className="flex min-w-0 w-full flex-col items-stretch justify-end pb-0.5">
                <button
                  type="button"
                  className={cn(
                    'touch-manipulation rounded-[22px] bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)]',
                    'shadow-[0_12px_28px_color-mix(in_srgb,var(--theme-primary)_42%,transparent)]',
                    'motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:ease-out',
                    '-mt-[44px] mb-1 flex min-h-[60px] w-full min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 outline-none sm:-mt-[48px] sm:min-h-[64px] sm:px-2',
                    'hover:bg-[var(--theme-primary-hover)] hover:shadow-[0_14px_32px_color-mix(in_srgb,var(--theme-primary)_48%,transparent)]',
                    'focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-background)]',
                    'active:motion-safe:scale-[0.94]',
                  )}
                  aria-label="Add student"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="size-[22px] shrink-0 stroke-[2.5] sm:size-6" strokeLinecap="round" strokeLinejoin="round" aria-hidden />
                  <span className="line-clamp-2 max-w-full text-center text-[10px] font-semibold leading-[1.1] tracking-[0.02em] text-balance sm:text-[11px]">
                    Student
                  </span>
                </button>
              </div>

              <div ref={settingsSlotRef} className="flex min-h-[56px] min-w-0 w-full items-end justify-center pb-0.5">
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[52px] w-full min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-1.5 outline-none transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-surface)]',
                      'active:motion-safe:scale-[1.06] motion-reduce:active:scale-100',
                      isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-charcoal-muted)] hover:text-[var(--theme-charcoal)]',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Settings
                        className={cn('size-[22px] shrink-0 sm:size-6', isActive ? 'stroke-[2.35]' : 'stroke-[2]')}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <span
                        className={cn(
                          'line-clamp-2 max-w-full text-center text-[10px] leading-[1.15] tracking-[0.02em] text-balance sm:text-[11px]',
                          isActive ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        Settings
                      </span>
                    </>
                  )}
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <StudentFormDialog variant="headless" open={addOpen} onOpenChange={setAddOpen} />
    </>
  )
}
