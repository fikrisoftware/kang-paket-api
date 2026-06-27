import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Menangkap error render agar app tidak blank total — menampilkan pesan + tombol reload. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Render error:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full w-full gap-4 p-8"
          style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <div className="text-base font-semibold">Terjadi kesalahan</div>
          <pre
            className="text-xs max-w-[600px] overflow-auto p-3 rounded-md"
            style={{ background: 'var(--color-surface)', color: '#ef4444', border: '1px solid var(--color-border)' }}
          >
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs px-4 py-2 rounded-md"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            Coba lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
