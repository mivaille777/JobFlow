import type { ReactNode } from 'react'

interface PageShellProps {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="jobflow-page-header">
        <p className="jobflow-eyebrow">{eyebrow}</p>
        <h1 className="jobflow-page-title">{title}</h1>
        <p className="jobflow-page-description">{description}</p>
      </header>

      <div className="jobflow-page-panel">
        {children ?? (
          <div className="flex min-h-56 items-center justify-center text-sm text-slate-400">
            Workspace ready
          </div>
        )}
      </div>
    </section>
  )
}
