import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ApplicationListItem } from '../shared/application'
import type {
  TodayDashboardData,
  TodayEventItem,
  TodayInterviewItem
} from '../shared/today'

function shortDate(value: string | null): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (match) return `${Number(match[2])}/${Number(match[3])}`
  return '—'
}

function timeLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function dateTimeLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function staleDays(lastProgressAt: string | null, generatedAt: string): number {
  if (!lastProgressAt) return 0
  const start = Date.parse(lastProgressAt)
  const end = Date.parse(generatedAt)
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.max(0, Math.floor((end - start) / 86_400_000))
}

function PriorityBadge({ value }: { value: string }) {
  const className =
    value === 'S'
      ? 'bg-red-50 text-red-700'
      : value === 'A'
        ? 'bg-amber-50 text-amber-700'
        : value === 'B'
          ? 'bg-blue-50 text-blue-700'
          : 'bg-slate-100 text-slate-600'

  return (
    <span className={`inline-flex min-w-7 justify-center rounded-md px-1.5 py-1 text-[11px] font-semibold ${className}`}>
      {value}
    </span>
  )
}

function ApplicationActionRow({
  item,
  meta
}: {
  item: ApplicationListItem
  meta: string
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
      <PriorityBadge value={item.priority} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {item.companyName} · {item.jobTitle}
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted">
          <span className="truncate">{item.nextAction || item.stage || item.status}</span>
          <span className="text-slate-300">·</span>
          <span className="shrink-0">{meta}</span>
        </div>
      </div>
    </div>
  )
}

function InterviewRow({ item }: { item: TodayInterviewItem }) {
  return (
    <div className="flex gap-3 border-b border-line px-4 py-3 last:border-b-0">
      <div className="w-14 shrink-0 pt-0.5 text-sm font-semibold text-accent">
        {timeLabel(item.scheduledAt)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">
          {item.companyName} · {item.jobTitle}
        </div>
        <div className="mt-1 text-xs text-muted">
          {item.round}
          {item.format ? ` · ${item.format}` : ''}
        </div>
      </div>
    </div>
  )
}

function EventRow({ item }: { item: TodayEventItem }) {
  return (
    <div className="flex gap-3 border-b border-line px-4 py-3 last:border-b-0">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
      <div className="min-w-0 flex-1">
        <div className="text-sm">
          <span className="font-medium">{item.companyName}</span>
          <span className="text-muted"> · {item.title}</span>
        </div>
        <div className="mt-1 flex justify-between gap-3 text-xs text-muted">
          <span className="truncate">{item.jobTitle}</span>
          <span className="shrink-0">{dateTimeLabel(item.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  count,
  tone = 'neutral',
  children,
  empty
}: {
  title: string
  count: number
  tone?: 'neutral' | 'danger' | 'warning' | 'accent'
  children: React.ReactNode
  empty: string
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-red-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : tone === 'accent'
          ? 'text-blue-700'
          : 'text-ink'

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className={`text-sm font-semibold ${toneClass}`}>{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted">{count}</span>
      </div>
      {count > 0 ? children : (
        <div className="px-4 py-8 text-center text-sm text-slate-400">{empty}</div>
      )}
    </section>
  )
}

export function TodayPage() {
  const [version, setVersion] = useState('…')
  const [dashboard, setDashboard] = useState<TodayDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void Promise.all([window.jobflow.app.getVersion(), window.jobflow.today.get()])
      .then(([appVersion, data]) => {
        if (cancelled) return
        setVersion(appVersion)
        setDashboard(data)
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setError(reason instanceof Error ? reason.message : '无法加载今日数据')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Today</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">今天需要处理什么？</h1>
        <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-3 w-16 rounded bg-slate-200" />
        <div className="mt-4 h-9 w-64 rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-28 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    {
      label: '已记录岗位',
      value: dashboard.counts.totalApplications,
      hint: '全部求职机会'
    },
    {
      label: '面试中',
      value: dashboard.counts.interviewing,
      hint: '当前 Pipeline'
    },
    {
      label: 'Offer 阶段',
      value: dashboard.counts.offers,
      hint: 'OC / 审批 / Offer'
    }
  ]

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Today</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">今天需要处理什么？</h1>
          <p className="mt-2 text-sm text-muted">
            优先处理逾期和今日事项，再看未来 7 天与停滞机会。
          </p>
        </div>
        <Link
          to="/applications"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
        >
          进入投递管理
        </Link>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-line bg-white p-5 shadow-panel">
            <div className="text-sm text-muted">{card.label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</div>
            <div className="mt-2 text-xs text-slate-400">{card.hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <Section
            title="已逾期"
            count={dashboard.overdueActions.length}
            tone="danger"
            empty="没有逾期事项"
          >
            {dashboard.overdueActions.map((item) => (
              <ApplicationActionRow
                key={item.id}
                item={item}
                meta={`截止 ${shortDate(item.nextActionDate)}`}
              />
            ))}
          </Section>

          <Section
            title="今天"
            count={dashboard.todayActions.length}
            tone="accent"
            empty="今天没有待办"
          >
            {dashboard.todayActions.map((item) => (
              <ApplicationActionRow key={item.id} item={item} meta="今天" />
            ))}
          </Section>

          <Section
            title="未来 7 天"
            count={dashboard.upcomingActions.length}
            empty="未来 7 天没有已安排事项"
          >
            {dashboard.upcomingActions.map((item) => (
              <ApplicationActionRow
                key={item.id}
                item={item}
                meta={shortDate(item.nextActionDate)}
              />
            ))}
          </Section>
        </div>

        <div className="space-y-5">
          <Section
            title="今日面试"
            count={dashboard.todayInterviews.length}
            tone="accent"
            empty="今天没有面试"
          >
            {dashboard.todayInterviews.map((item) => (
              <InterviewRow key={item.id} item={item} />
            ))}
          </Section>

          <Section
            title="停滞 7 天+"
            count={dashboard.staleApplications.length}
            tone="warning"
            empty="没有长期未推进的岗位"
          >
            {dashboard.staleApplications.slice(0, 6).map((item) => (
              <ApplicationActionRow
                key={item.id}
                item={item}
                meta={`${staleDays(item.lastProgressAt, dashboard.generatedAt)} 天未更新`}
              />
            ))}
          </Section>

          <Section
            title="最近动态"
            count={dashboard.recentEvents.length}
            empty="还没有流程动态"
          >
            {dashboard.recentEvents.map((item) => (
              <EventRow key={item.id} item={item} />
            ))}
          </Section>
        </div>
      </div>

      <div className="mt-5 text-right text-[11px] text-slate-400">JobFlow v{version}</div>
    </section>
  )
}
