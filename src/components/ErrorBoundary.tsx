import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('JobFlow renderer error', error, info)
  }

  private reload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-canvas px-6 text-ink">
          <section className="w-full max-w-md rounded-2xl border border-line bg-white p-7 text-center shadow-panel">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
              Renderer Error
            </div>
            <h1 className="mt-3 text-2xl font-semibold">页面出现异常</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              当前页面没有继续渲染，以避免错误扩散。详细异常已写入开发控制台。
            </p>
            <button
              type="button"
              onClick={this.reload}
              className="mt-6 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition duration-150 ease-out hover:bg-slate-800"
            >
              重新加载 JobFlow
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
