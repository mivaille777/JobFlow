import { useEffect, useState, type FormEvent } from 'react'
import {
  interviewFormats,
  interviewResults,
  interviewRounds,
  type InterviewDetail,
  type InterviewPatch
} from '../../shared/interview'

interface Props {
  interviewId: string
  onClose: () => void
  onChanged: () => void
  onDeleted: () => void
}

function localDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function InterviewDetailDrawer({
  interviewId,
  onClose,
  onChanged,
  onDeleted
}: Props) {
  const [detail, setDetail] = useState<InterviewDetail | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setDetail(null)
    setError(null)

    void window.jobflow.interviews
      .get(interviewId)
      .then((value) => {
        if (cancelled) return
        setDetail(value)
        setScheduledAt(localDateTime(value.scheduledAt))
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setError(reason instanceof Error ? reason.message : '无法加载面试详情')
      })

    return () => {
      cancelled = true
    }
  }, [interviewId])

  function field<K extends keyof InterviewDetail>(key: K, value: InterviewDetail[K]) {
    setDetail((current) => current ? { ...current, [key]: value } : current)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail || !scheduledAt) return

    const patch: InterviewPatch = {
      round: detail.round,
      scheduledAt: new Date(scheduledAt).toISOString(),
      format: detail.format,
      interviewer: detail.interviewer,
      department: detail.department,
      durationMinutes: detail.durationMinutes,
      result: detail.result,
      mainQuestions: detail.mainQuestions,
      codingQuestions: detail.codingQuestions,
      projectQuestions: detail.projectQuestions,
      selfRating: detail.selfRating,
      improvements: detail.improvements,
      nextRoundFocus: detail.nextRoundFocus
    }

    setSaving(true)
    setError(null)
    try {
      const updated = await window.jobflow.interviews.update(detail.id, patch)
      setDetail(updated)
      setScheduledAt(localDateTime(updated.scheduledAt))
      onChanged()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!detail || !window.confirm('确定删除这条面试记录吗？')) return
    setSaving(true)
    try {
      await window.jobflow.interviews.delete(detail.id)
      onDeleted()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '删除失败')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/20" onMouseDown={onClose}>
      <aside
        className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-line bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-white px-6 py-5">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-accent">Interview</div>
            <h2 className="mt-1 truncate text-xl font-semibold">
              {detail ? `${detail.companyName} · ${detail.round}` : '面试详情'}
            </h2>
            {detail && <p className="mt-1 truncate text-sm text-muted">{detail.jobTitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-slate-100">
            关闭
          </button>
        </div>

        {!detail && !error && (
          <div className="p-6 text-sm text-muted">加载中…</div>
        )}

        {error && !detail && (
          <div className="m-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {detail && (
          <form onSubmit={(event) => void save(event)} className="space-y-7 p-6">
            <section>
              <h3 className="text-sm font-semibold">面试信息</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-xs text-muted">轮次</span>
                  <select
                    value={detail.round}
                    onChange={(event) => field('round', event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
                  >
                    {interviewRounds.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-xs text-muted">结果</span>
                  <select
                    value={detail.result ?? ''}
                    onChange={(event) => field('result', event.target.value || null)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
                  >
                    <option value="">未设置</option>
                    {interviewResults.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted">时间</span>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </label>
                <label>
                  <span className="text-xs text-muted">形式</span>
                  <select
                    value={detail.format ?? ''}
                    onChange={(event) => field('format', event.target.value || null)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
                  >
                    <option value="">未设置</option>
                    {interviewFormats.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-xs text-muted">时长（分钟）</span>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={detail.durationMinutes ?? ''}
                    onChange={(event) =>
                      field('durationMinutes', event.target.value ? Number(event.target.value) : null)
                    }
                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </label>
                <label>
                  <span className="text-xs text-muted">面试官</span>
                  <input
                    value={detail.interviewer ?? ''}
                    onChange={(event) => field('interviewer', event.target.value || null)}
                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </label>
                <label>
                  <span className="text-xs text-muted">部门</span>
                  <input
                    value={detail.department ?? ''}
                    onChange={(event) => field('department', event.target.value || null)}
                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">面试复盘</h3>
                <label className="flex items-center gap-2 text-xs text-muted">
                  自评
                  <select
                    value={detail.selfRating ?? ''}
                    onChange={(event) =>
                      field('selfRating', event.target.value ? Number(event.target.value) : null)
                    }
                    className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-4 space-y-4">
                {[
                  ['mainQuestions', '主要问题'],
                  ['codingQuestions', '手撕题 / 算法'],
                  ['projectQuestions', '项目追问'],
                  ['improvements', '没答好的 / 后续改进'],
                  ['nextRoundFocus', '下一轮重点准备']
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-xs text-muted">{label}</span>
                    <textarea
                      rows={3}
                      value={(detail[key as keyof InterviewDetail] as string | null) ?? ''}
                      onChange={(event) =>
                        field(
                          key as keyof InterviewDetail,
                          (event.target.value || null) as never
                        )
                      }
                      className="mt-1.5 w-full resize-y rounded-lg border border-line px-3 py-2 text-sm leading-6"
                    />
                  </label>
                ))}
              </div>
            </section>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="flex items-center justify-between border-t border-line pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={() => void remove()}
                className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                删除记录
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? '保存中…' : '保存复盘'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  )
}
