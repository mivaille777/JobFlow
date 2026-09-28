import { useEffect, useState } from 'react'
import { PageShell } from '../components/PageShell'

export function TodayPage() {
  const [version, setVersion] = useState('…')

  useEffect(() => {
    void window.jobflow.app.getVersion().then(setVersion)
  }, [])

  return (
    <PageShell
      eyebrow="Today"
      title="今天需要处理什么？"
      description="后续这里会聚合今日面试、即将到期、已逾期和停滞岗位。"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {['今日待办', '面试中', 'Offer'].map((label) => (
          <div key={label} className="rounded-xl border border-line bg-slate-50 p-4">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-3 text-2xl font-semibold">0</div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-xs text-slate-400">JobFlow v{version}</div>
    </PageShell>
  )
}
