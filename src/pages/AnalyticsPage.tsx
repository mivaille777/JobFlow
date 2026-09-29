import { useEffect, useMemo, useState } from 'react'
import type { AnalyticsDashboardData } from '../shared/analytics'

function metric(value: number | null, suffix = ''): string {
  return value === null ? '—' : `${value}${suffix}`
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void window.jobflow.analytics
      .get()
      .then((value) => {
        if (!cancelled) setData(value)
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : '无法加载统计数据')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const funnelMax = useMemo(
    () => Math.max(...(data?.funnel.map((item) => item.value) ?? [0]), 1),
    [data]
  )
  const directionMax = useMemo(
    () => Math.max(...(data?.directions.map((item) => item.applications) ?? [0]), 1),
    [data]
  )
  const channelMax = useMemo(
    () => Math.max(...(data?.channels.map((item) => item.applications) ?? [0]), 1),
    [data]
  )

  if (error) {
    return (
      <section className="mx-auto w-full max-w-7xl">
        <p className="jobflow-eyebrow">Analytics</p>
        <h1 className="mt-2 jobflow-page-title">求职数据</h1>
        <div className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="mx-auto w-full max-w-7xl animate-pulse">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="mt-4 h-9 w-48 rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-28 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </section>
    )
  }

  const applied = data.funnel.find((item) => item.key === 'applied')?.value ?? 0
  const interviewed = data.funnel.find((item) => item.key === 'interview')?.value ?? 0
  const offers = data.funnel.find((item) => item.key === 'offer')?.value ?? 0
  const interviewRate = applied === 0 ? null : Math.round((interviewed / applied) * 100)
  const offerRate = applied === 0 ? null : Math.round((offers / applied) * 100)

  return (
    <section className="mx-auto w-full max-w-7xl">
      <p className="jobflow-eyebrow">Analytics</p>
      <h1 className="mt-2 jobflow-page-title">求职数据</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        只保留能帮助判断投递策略的数据。统计基于你已经记录的岗位、面试和 Timeline 事件。
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['已投递', String(applied), '进入正式求职流程'],
          ['面试率', metric(interviewRate, '%'), `${interviewed} 个岗位进入面试`],
          ['Offer 率', metric(offerRate, '%'), `${offers} 个岗位进入 Offer 阶段`],
          [
            '平均响应时间',
            metric(data.responseTime.averageDays, ' 天'),
            `${data.responseTime.sampleCount} 个有效样本`
          ]
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-5 shadow-panel jobflow-surface-card">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
            <div className="mt-2 text-xs text-slate-400">{hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-panel jobflow-surface-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">投递 Funnel</h2>
              <p className="mt-1 text-xs text-muted">依据当前记录的流程事实统计</p>
            </div>
            <div className="text-right text-xs text-muted">
              中位响应 {metric(data.responseTime.medianDays, ' 天')}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {data.funnel.map((item) => {
              const width = Math.max(4, (item.value / funnelMax) * 100)
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted">{item.value}</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-700"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-panel jobflow-surface-card">
          <div>
            <h2 className="text-sm font-semibold">投递渠道</h2>
            <p className="mt-1 text-xs text-muted">看你的岗位主要从哪里进入</p>
          </div>

          <div className="mt-5 space-y-4">
            {data.channels.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">暂无渠道数据</div>
            ) : (
              data.channels.slice(0, 8).map((item) => (
                <div key={item.channel}>
                  <div className="flex justify-between text-sm">
                    <span>{item.channel}</span>
                    <span className="text-muted">{item.applications}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.max(4, (item.applications / channelMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-panel jobflow-surface-card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold">岗位方向</h2>
          <p className="mt-1 text-xs text-muted">记录数、进入面试数与 Offer 数并排查看</p>
        </div>

        {data.directions.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">暂无岗位方向数据</div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_100px_100px_100px] border-b border-line bg-slate-50 px-5 py-2.5 text-xs font-medium text-muted">
              <span>方向</span>
              <span className="text-right">记录</span>
              <span className="text-right">面试</span>
              <span className="text-right">Offer</span>
            </div>
            {data.directions.map((item) => (
              <div
                key={item.direction}
                className="grid grid-cols-[1fr_100px_100px_100px] items-center border-b border-line px-5 py-4 text-sm last:border-b-0"
              >
                <div className="pr-8">
                  <div className="font-medium">{item.direction}</div>
                  <div className="mt-2 h-1.5 max-w-md overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-500"
                      style={{ width: `${Math.max(4, (item.applications / directionMax) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-right text-muted">{item.applications}</span>
                <span className="text-right text-muted">{item.interviews}</span>
                <span className="text-right font-medium text-green-700">{item.offers}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
