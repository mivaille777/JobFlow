import { useEffect, useState } from 'react'
import { applicationPriorityClass, applicationStatusClass } from '../../app/presentation'
import { showToast } from '../../app/toast'
import type { JobFlowSettings } from '../../shared/settings'
import {
  applicationPriorities,
  applicationRecruitmentTypes,
  applicationStatuses,
  type ApplicationDetail,
  type ApplicationEvent,
  type ApplicationPatch
} from '../../shared/application'

interface ApplicationDetailDrawerProps {
  applicationId: string | null
  onClose: () => void
  onUpdated: (application: ApplicationDetail) => void
  onDeleted: (applicationId: string) => void
}

function Field({
  label,
  value,
  placeholder,
  onCommit
}: {
  label: string
  value: string | null
  placeholder?: string
  onCommit: (value: string | null) => void
}) {
  const [draft, setDraft] = useState(value ?? '')
  useEffect(() => setDraft(value ?? ''), [value])

  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const next = draft.trim() || null
          if (next !== value) onCommit(next)
        }}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-slate-400"
      />
    </label>
  )
}

function eventSummary(event: ApplicationEvent): string | null {
  if (event.oldValue && event.newValue) return `${event.oldValue} → ${event.newValue}`
  if (event.newValue) return event.newValue
  if (event.oldValue) return `${event.oldValue} → 空`
  return event.description
}

function formatTimelineTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function ApplicationDetailDrawer({
  applicationId,
  onClose,
  onUpdated,
  onDeleted
}: ApplicationDetailDrawerProps) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null)
  const [events, setEvents] = useState<ApplicationEvent[]>([])
  const [settings, setSettings] = useState<JobFlowSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!applicationId) {
      setDetail(null)
      setEvents([])
      return
    }

    setLoading(true)
    setError('')
    void Promise.all([
      window.jobflow.applications.get(applicationId),
      window.jobflow.applications.events(applicationId),
      window.jobflow.settings.get()
    ])
      .then(([application, timeline, currentSettings]) => {
        setDetail(application)
        setEvents(timeline)
        setSettings(currentSettings)
      })
      .catch(() => setError('读取岗位详情失败。'))
      .finally(() => setLoading(false))
  }, [applicationId])

  useEffect(() => {
    if (!applicationId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [applicationId, onClose])

  if (!applicationId) return null

  async function deleteApplication() {
    if (!detail || deleting) return
    setDeleting(true)
    setError('')
    try {
      await window.jobflow.applications.delete(detail.id)
      onDeleted(detail.id)
    } catch (reason) {
      console.error('Failed to delete application', reason)
      setError('删除岗位失败，请重试。')
      setDeleting(false)
    }
  }

  async function save(patch: ApplicationPatch) {
    if (!detail) return
    const previous = detail
    setDetail({ ...detail, ...patch })
    setError('')
    try {
      const updated = await window.jobflow.applications.update(detail.id, patch)
      setDetail(updated)
      onUpdated(updated)
      if (
        patch.status !== undefined ||
        patch.stage !== undefined ||
        patch.finalResult !== undefined
      ) {
        setEvents(await window.jobflow.applications.events(detail.id))
      }
    } catch (reason) {
      console.error('Failed to save application detail', reason)
      setDetail(previous)
      showToast('操作失败，请重试', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="关闭岗位详情"
        className="jobflow-fade-in absolute inset-0 bg-slate-950/15 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside aria-label="岗位详情" className="jobflow-drawer-in absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col border-l border-line bg-white shadow-2xl">
        {loading ? (
          <div className="space-y-4 p-6">
            <div className="h-7 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="mt-8 h-32 animate-pulse rounded-xl bg-slate-50" />
          </div>
        ) : detail ? (
          <>
            <header className="border-b border-line px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-muted">{detail.companyName}</div>
                  <h2 className="mt-1 text-xl font-semibold leading-7">{detail.jobTitle}</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${applicationPriorityClass(detail.priority)}`}>
                      {detail.priority}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 ${applicationStatusClass(detail.status)}`}>
                      {detail.status}{detail.stage ? ` · ${detail.stage}` : ''}
                    </span>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700">
                      {detail.recruitmentType}
                    </span>
                    {detail.location ? (
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-muted">
                        {detail.location}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="关闭岗位详情"
                  onClick={onClose}
                  className="text-2xl text-slate-400 hover:text-ink"
                >
                  ×
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {error ? (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
              ) : null}

              <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h3 className="text-sm font-semibold">下一步</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="行动"
                    value={detail.nextAction}
                    placeholder="例如：准备二面"
                    onCommit={(value) => void save({ nextAction: value })}
                  />
                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs font-medium text-muted">日期</span>
                    <input
                      type="date"
                      value={detail.nextActionDate?.slice(0, 10) ?? ''}
                      onChange={(event) =>
                        void save({ nextActionDate: event.target.value || null })
                      }
                      className="w-full rounded-lg border border-line bg-white px-3 py-2"
                    />
                  </label>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">流程</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs font-medium text-muted">优先级</span>
                    <select
                      value={detail.priority}
                      onChange={(event) => void save({ priority: event.target.value })}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2"
                    >
                      {applicationPriorities.map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs font-medium text-muted">状态</span>
                    <select
                      value={detail.status}
                      onChange={(event) => void save({ status: event.target.value })}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2"
                    >
                      {applicationStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs font-medium text-muted">招聘类型</span>
                    <select
                      value={detail.recruitmentType}
                      onChange={(event) => void save({ recruitmentType: event.target.value })}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2"
                    >
                      {applicationRecruitmentTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="当前节点"
                    value={detail.stage}
                    placeholder="例如：二面待面"
                    onCommit={(value) => void save({ stage: value })}
                  />
                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs font-medium text-muted">岗位方向</span>
                    <select
                      value={detail.direction ?? ''}
                      onChange={(event) => void save({ direction: event.target.value || null })}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2"
                    >
                      <option value="">未设置</option>
                      {Array.from(new Set([
                        ...(settings?.directions ?? []),
                        ...(detail.direction ? [detail.direction] : [])
                      ])).map((direction) => (
                        <option key={direction} value={direction}>{direction}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Timeline</h3>
                  <span className="text-xs text-muted">{events.length} 条</span>
                </div>
                {events.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-muted">
                    暂无流程事件。
                  </div>
                ) : (
                  <ol className="space-y-0">
                    {events.map((event, index) => (
                      <li key={event.id} className="relative pl-6">
                        {index < events.length - 1 ? (
                          <span className="absolute bottom-0 left-[5px] top-3 w-px bg-line" />
                        ) : null}
                        <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-200" />
                        <div className="pb-5">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm font-medium">{event.title}</span>
                            <span className="shrink-0 text-[11px] text-slate-400">
                              {formatTimelineTime(event.createdAt)}
                            </span>
                          </div>
                          {eventSummary(event) ? (
                            <div className="mt-1 text-xs text-muted">{eventSummary(event)}</div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">岗位信息</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Base" value={detail.location} onCommit={(value) => void save({ location: value })} />
                  <Field label="Job ID" value={detail.jobId} onCommit={(value) => void save({ jobId: value })} />
                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs font-medium text-muted">投递渠道</span>
                    <select
                      value={detail.channel ?? ''}
                      onChange={(event) => void save({ channel: event.target.value || null })}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2"
                    >
                      <option value="">未设置</option>
                      {Array.from(new Set([
                        ...(settings?.channels ?? []),
                        ...(detail.channel ? [detail.channel] : [])
                      ])).map((channel) => (
                        <option key={channel} value={channel}>{channel}</option>
                      ))}
                    </select>
                  </label>
                  <Field label="内推人 / 内推码" value={detail.referral} onCommit={(value) => void save({ referral: value })} />
                  <Field label="简历版本" value={detail.resumeVersion} onCommit={(value) => void save({ resumeVersion: value })} />
                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs font-medium text-muted">投递日期</span>
                    <input
                      type="date"
                      value={detail.applicationDate?.slice(0, 10) ?? ''}
                      onChange={(event) =>
                        void save({ applicationDate: event.target.value || null })
                      }
                      className="w-full rounded-lg border border-line bg-white px-3 py-2"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <Field
                      label="JD 链接"
                      value={detail.jobUrl}
                      placeholder="https://..."
                      onCommit={(value) => void save({ jobUrl: value })}
                    />
                    {detail.jobUrl ? (
                      <a
                        href={detail.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-block text-xs text-accent hover:underline"
                      >
                        打开原始 JD ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">备注</h3>
                <textarea
                  key={`${detail.id}-notes-${detail.updatedAt}`}
                  defaultValue={detail.notes ?? ''}
                  rows={6}
                  placeholder="记录面试准备、岗位观察或其他信息…"
                  onBlur={(event) => {
                    const value = event.target.value.trim() || null
                    if (value !== detail.notes) void save({ notes: value })
                  }}
                  className="w-full resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </section>

              <section className="border-t border-line pt-5">
                {!confirmDelete ? (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-rose-700">删除岗位</h3>
                      <p className="mt-1 text-xs text-muted">关联面试和 Timeline 将一并删除。</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                    >
                      删除岗位
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="text-sm font-semibold text-rose-800">确认删除这个岗位？</div>
                    <p className="mt-1 text-xs leading-5 text-rose-700">
                      此操作无法撤销，关联的面试记录和 Timeline 也会被删除。
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/70"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteApplication()}
                        disabled={deleting}
                        className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {deleting ? '删除中…' : '确认删除'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <div className="p-6 text-sm text-rose-600">{error || '岗位不存在。'}</div>
        )}
      </aside>
    </div>
  )
}
