import { StudentFormDialog } from '@/components/students/StudentFormDialog'
import { LOGO_192_PNG } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { HardDriveDownload, Plus, Settings } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

type SlotId = 'chats' | 'downloads' | 'settings'

export function BottomNav() {
  const location = useLocation()
  const [addOpen, setAddOpen] = useState(false)

  const panelRef        = useRef<HTMLDivElement>(null)
  const chatsSlotRef    = useRef<HTMLDivElement>(null)
  const downloadsSlotRef = useRef<HTMLDivElement>(null)
  const settingsSlotRef  = useRef<HTMLDivElement>(null)

  const [pill, setPill] = useState<{ left: number; width: number; height: number; visible: boolean }>({
    left: 0, width: 0, height: 48, visible: false,
  })

  const activeSlot: SlotId | null = (() => {
    const seg = location.pathname.replace(/\/+$/, '') || '/'
    if (seg === '/') return 'chats'
    if (seg === '/downloads' || seg.startsWith('/downloads/')) return 'downloads'
    if (seg === '/settings'  || seg.startsWith('/settings/'))  return 'settings'
    return null
  })()

  const measurePill = useCallback(() => {
    const panel   = panelRef.current
    const slotKey = activeSlot
    if (!panel || !slotKey) { setPill((p) => ({ ...p, visible: false })); return }
    const slotEl =
      slotKey === 'chats'    ? chatsSlotRef.current
      : slotKey === 'downloads' ? downloadsSlotRef.current
      : settingsSlotRef.current
    if (!slotEl) return
    const pr   = panel.getBoundingClientRect()
    const sr   = slotEl.getBoundingClientRect()
    const left = sr.left - pr.left
    const width = sr.width
    const height = Math.max(sr.height, 44)
    setPill({ left, width, height, visible: width > 0 })
  }, [activeSlot])

  useLayoutEffect(() => { measurePill() }, [measurePill, location.pathname])

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

  const navItemBase = cn(
    'flex min-h-[52px] w-full min-w-0 touch-manipulation flex-col items-center justify-center gap-[5px]',
    'rounded-[var(--radius-xl)] px-1 py-1.5 outline-none',
    'motion-safe:transition-colors motion-safe:duration-150',
    'focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-surface)]',
    'active:motion-safe:scale-[1.05] motion-reduce:active:scale-100',
  )

  return (
    <>
      <nav
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <div className="pointer-events-auto w-full max-w-lg">
          <div
            ref={panelRef}
            className="relative overflow-hidden rounded-t-[28px] border border-b-0 border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 pb-3 pt-9 sm:rounded-t-[30px]"
            style={{ boxShadow: '0 -8px 32px rgb(21 91 91 / 0.08), 0 -2px 8px rgb(0 0 0 / 0.04)' }}
          >
            {/* Sliding highlight pill */}
            <div
              className="pointer-events-none absolute inset-0 flex items-end justify-stretch rounded-t-[28px] sm:rounded-t-[30px]"
              aria-hidden
            >
              <div className="relative h-full w-full overflow-hidden rounded-t-[inherit] pb-3">
                <div
                  className={cn(
                    'absolute bottom-3 left-0 rounded-[var(--radius-xl)] bg-[var(--theme-primary-soft)]',
                    'motion-safe:transition-[transform,width,height,opacity] motion-safe:duration-[380ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
                    'motion-reduce:transition-none',
                    pill.visible ? 'opacity-100' : 'opacity-0',
                  )}
                  style={{ width: pill.width, height: pill.height, transform: `translateX(${pill.left}px)` }}
                />
              </div>
            </div>

            <div className="relative grid min-w-0 grid-cols-4 items-end gap-0.5 px-0.5 sm:gap-1 sm:px-1">

              {/* Stories */}
              <div ref={chatsSlotRef} className="flex min-h-[56px] w-full min-w-0 items-end justify-center pb-0.5">
                <NavLink to="/" end className={({ isActive }) => cn(navItemBase, isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-charcoal-muted)] hover:text-[var(--theme-charcoal)]')}>
                  {({ isActive }) => (
                    <>
                      <img
                        src={LOGO_192_PNG}
                        alt=""
                        width={24}
                        height={24}
                        decoding="async"
                        className={cn(
                          'size-[22px] shrink-0 object-contain opacity-90 sm:size-6',
                          isActive && 'opacity-100',
                        )}
                      />
                      <span className={cn('text-center', isActive ? 'font-semibold' : 'font-medium')} style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wide)', lineHeight: 'var(--leading-snug)' }}>Stories</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* Downloads */}
              <div ref={downloadsSlotRef} className="flex min-h-[56px] w-full min-w-0 items-end justify-center pb-0.5">
                <NavLink to="/downloads" className={({ isActive }) => cn(navItemBase, isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-charcoal-muted)] hover:text-[var(--theme-charcoal)]')}>
                  {({ isActive }) => (
                    <>
                      <HardDriveDownload className={cn('size-[22px] shrink-0 sm:size-6', isActive ? 'stroke-[2.4]' : 'stroke-[1.9]')} strokeLinecap="round" strokeLinejoin="round" />
                      <span className={cn('text-center', isActive ? 'font-semibold' : 'font-medium')} style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wide)', lineHeight: 'var(--leading-snug)' }}>Backup</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* FAB — Add student */}
              <div className="flex w-full min-w-0 flex-col items-stretch justify-end pb-0.5">
                <button
                  type="button"
                  className="touch-manipulation -mt-[46px] mb-1 flex min-h-[62px] w-full min-w-0 flex-col items-center justify-center gap-[5px] rounded-[var(--radius-xl)] bg-[var(--theme-primary)] px-1 py-2 text-[var(--theme-primary-foreground)] outline-none sm:-mt-[50px] sm:min-h-[66px] sm:px-2"
                  style={{
                    boxShadow: '0 8px 24px rgb(21 91 91 / 0.38)',
                    transition: 'transform 150ms ease-out, box-shadow 150ms ease-out, background-color 150ms',
                  }}
                  aria-label="Add student"
                  onClick={() => setAddOpen(true)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 30px rgb(21 91 91 / 0.46)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgb(21 91 91 / 0.38)' }}
                >
                  <Plus className="size-[22px] shrink-0 stroke-[2.5] sm:size-6" strokeLinecap="round" strokeLinejoin="round" aria-hidden />
                  <span className="font-semibold" style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wide)', lineHeight: 'var(--leading-snug)' }}>
                    Student
                  </span>
                </button>
              </div>

              {/* Settings */}
              <div ref={settingsSlotRef} className="flex min-h-[56px] w-full min-w-0 items-end justify-center pb-0.5">
                <NavLink to="/settings" className={({ isActive }) => cn(navItemBase, isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-charcoal-muted)] hover:text-[var(--theme-charcoal)]')}>
                  {({ isActive }) => (
                    <>
                      <Settings className={cn('size-[22px] shrink-0 sm:size-6', isActive ? 'stroke-[2.4]' : 'stroke-[1.9]')} strokeLinecap="round" strokeLinejoin="round" />
                      <span className={cn('text-center', isActive ? 'font-semibold' : 'font-medium')} style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wide)', lineHeight: 'var(--leading-snug)' }}>Settings</span>
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
