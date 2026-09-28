import type { ReactNode } from 'react'

interface PageShellProps {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>

      <div className="mt-7 rounded-2xl border border-line bg-white p-6 shadow-panel">
        {children ?? (
          <div className="flex min-h-56 items-center justify-center text-sm text-slate-400">
            Stage 0 · Workspace ready
          </div>
        )}
      </div>
    </section>
  )
}
