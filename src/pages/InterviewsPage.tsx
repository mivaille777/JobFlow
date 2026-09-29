import { useEffect, useMemo, useState } from 'react'
import { CreateInterviewDialog } from '../features/interviews/CreateInterviewDialog'
import { InterviewDetailDrawer } from '../features/interviews/InterviewDetailDrawer'
import type { ApplicationListItem } from '../shared/application'
import type { InterviewListItem } from '../shared/interview'

type Tab = 'upcoming' | 'past'

function dateLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function resultClass(result: string | null): string {
  if (result === '通过') return 'bg-green-50 text-green-700'
  if (result === '未通过') return 'bg-red-50 text-red-700'
  if (result === '等结果') return 'bg-amber-50 text-amber-700'
  if (result === '待面') return 'bg-blue-50 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}

export function InterviewsPage() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const [interviews, setInterviews] = useState<InterviewListItem[]>([])
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const [interviewRows, applicationRows] = await Promise.all([
      window.jobflow.interviews.list(),
      window.jobflow.applications.list()
    ])
    setInterviews(interviewRows)
    setApplications(applicationRows)
  }

  useEffect(() => {
    let cancelled = false

    void Promise.all([
      window.jobflow.interviews.list(),
      window.jobflow.applications.list()
    ])
      .then(([interviewRows, applicationRows]) => {
        if (cancelled) return
        setInterviews(interviewRows)
        setApplications(applicationRows)
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setError(reason instanceof Error ? reason.message : '无法加载面试数据')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const now = Date.now()
  const upcoming = useMemo(
    () =>
      interviews
        .filter((item) => Date.parse(item.scheduledAt) >= now)
        .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt)),
    [interviews, now]
  )
  const past = useMemo(
    () =>
      interviews
        .filter((item) => Date.parse(item.scheduledAt) < now)
        .sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt)),
    [interviews, now]
  )
  const visible = tab === 'upcoming' ? upcoming : past

  async function afterCreated() {
    await refresh()
    setCreateOpen(false)
  }

  async function afterChanged() {
    await refresh()
  }

  async function afterDeleted() {
    await refresh()
    setSelectedId(null)
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="jobflow-eyebrow">Interviews</p>
          <h1 className="mt-2 jobflow-page-title">面试中心</h1>
          <p className="mt-2 text-sm text-muted">
            安排面试、查看 Upcoming，并在每一轮结束后完成技术复盘。
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          + 添加面试
        </button>
      </div>

      <div className="mt-7 flex items-center gap-1 rounded-xl border border-line bg-white p-1 shadow-panel">
        {([
          ['upcoming', 'Upcoming', upcoming.length],
          ['past', 'Past', past.length]
        ] as const).map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={[
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition',
              tab === value
                ? 'bg-slate-100 font-medium text-ink'
                : 'text-muted hover:text-ink'
            ].join(' ')}
          >
            {label}
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{count}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-panel jobflow-surface-card">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted">加载中…</div>
        ) : visible.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="text-sm font-medium">
              {tab === 'upcoming' ? '还没有待进行的面试' : '还没有历史面试'}
            </div>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
              {tab === 'upcoming'
                ? '收到面试通知后添加到这里，Today 页也会自动显示当天面试。'
                : '完成一轮面试后，复盘记录会长期保留在这里。'}
            </p>
            {tab === 'upcoming' && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-5 rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                添加第一场面试
              </button>
            )}
          </div>
        ) : (
          <div>
            {visible.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="grid w-full grid-cols-[160px_1fr_auto] items-center gap-5 border-b border-line px-5 py-4 text-left transition last:border-b-0 hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-medium text-ink">{dateLabel(item.scheduledAt)}</div>
                  <div className="mt-1 text-xs text-muted">{item.format || '形式未设置'}</div>
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {item.companyName} · {item.jobTitle}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span>{item.round}</span>
                    {item.department && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>{item.department}</span>
                      </>
                    )}
                    {item.selfRating && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>自评 {item.selfRating}/5</span>
                      </>
                    )}
                  </div>
                </div>

                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${resultClass(item.result)}`}>
                  {item.result || '未设置'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <CreateInterviewDialog
          applications={applications}
          onClose={() => setCreateOpen(false)}
          onCreated={() => void afterCreated()}
        />
      )}

      {selectedId && (
        <InterviewDetailDrawer
          interviewId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => void afterChanged()}
          onDeleted={() => void afterDeleted()}
        />
      )}
    </section>
  )
}
