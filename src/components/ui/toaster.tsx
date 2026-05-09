import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { dismissToast, useToast } from '@/hooks/use-toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant ?? 'default'}
          duration={4_000}
          onOpenChange={(open) => {
            if (!open) dismissToast(t.id)
          }}
        >
          <div className="grid flex-1 gap-1">
            {t.title ? <ToastTitle>{t.title}</ToastTitle> : null}
            {t.description ? (
              <ToastDescription
                className={t.variant === 'destructive' ? 'text-[var(--theme-danger)]' : undefined}
              >
                {t.description}
              </ToastDescription>
            ) : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
