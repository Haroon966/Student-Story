import * as React from 'react'

const TOAST_LIMIT = 5

export type ToastVariant = 'default' | 'destructive'

export type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
}

type Action =
  | { type: 'ADD'; toast: ToastProps }
  | { type: 'REMOVE'; toastId: string }

const listeners = new Set<() => void>()
let memoryState: { toasts: ToastProps[] } = { toasts: [] }

function dispatch(action: Action) {
  switch (action.type) {
    case 'ADD':
      memoryState = {
        toasts: [...memoryState.toasts, action.toast].slice(-TOAST_LIMIT),
      }
      break
    case 'REMOVE':
      memoryState = {
        toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
      }
      break
  }
  listeners.forEach((fn) => fn())
}

let count = 0
function genId() {
  count = (count + 1) % 1_000_000
  return `toast-${count}-${Date.now()}`
}

export function dismissToast(toastId: string) {
  dispatch({ type: 'REMOVE', toastId })
}

type ToastFn = (props: Omit<ToastProps, 'id'>) => { id: string; dismiss: () => void }

export const toast: ToastFn = ({ ...props }) => {
  const id = genId()
  dispatch({ type: 'ADD', toast: { id, ...props } })
  return {
    id,
    dismiss: () => dismissToast(id),
  }
}

export function useToast() {
  const [, rerender] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    const sync = () => rerender()
    listeners.add(sync)
    return () => {
      listeners.delete(sync)
    }
  }, [])

  return {
    toasts: memoryState.toasts,
    toast,
    dismiss: dismissToast,
  }
}
