import * as ToastPrimitives from '@radix-ui/react-toast'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import * as React from 'react'

export const ToastProvider = ToastPrimitives.Provider

export const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] mx-auto flex max-h-screen w-full max-w-[min(100vw-1.5rem,420px)] flex-col gap-2 p-4 outline-none sm:bottom-auto sm:right-4 sm:top-4 sm:flex-col md:max-w-[420px]',
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = 'ToastViewport'

export const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: 'default' | 'destructive'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 pr-10 shadow-lg transition-[opacity,transform] duration-200',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=cancel]:transition-[transform_200ms_ease-out]',
        variant === 'default' &&
          'border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-charcoal)]',
        variant === 'destructive' &&
          'border-[var(--theme-danger)]/40 bg-[var(--theme-surface)] text-[var(--theme-charcoal)]',
        className,
      )}
      {...props}
    />
  )
})
Toast.displayName = 'Toast'

export const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold leading-tight', className)}
    {...props}
  />
))
ToastTitle.displayName = 'ToastTitle'

export const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm leading-snug opacity-90', className)}
    {...props}
  />
))
ToastDescription.displayName = 'ToastDescription'

export const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    type="button"
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-[var(--theme-charcoal-muted)] opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)]',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="size-4" aria-hidden />
  </ToastPrimitives.Close>
))
ToastClose.displayName = 'ToastClose'
