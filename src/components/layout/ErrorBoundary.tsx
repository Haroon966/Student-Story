import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { error: Error | null }

/** Catches render errors so a broken subtree does not blank the whole app without feedback. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    globalThis.reportError?.(error)
    if (import.meta.env.DEV) {
      console.error(error.message, info.componentStack)
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      const msg = this.state.error.message || 'Unexpected error'
      return (
        <div
          role="alert"
          className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--theme-background)] px-6 text-center"
        >
          <div className="max-w-md space-y-2">
            <h1 className="text-lg font-semibold text-[var(--theme-charcoal)]">Something went wrong</h1>
            <p className="text-sm leading-relaxed text-[var(--theme-charcoal-muted)]">{msg}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className="rounded-full bg-[var(--theme-primary-soft)] px-4 py-2 text-sm font-medium text-[var(--theme-primary)] hover:opacity-90"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <button
              type="button"
              className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-sm font-medium text-[var(--theme-charcoal)] hover:bg-[var(--theme-surface-muted)]"
              onClick={() => window.location.reload()}
            >
              Reload app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
