import { useMemo, useState, type FormEvent } from 'react'
import type { ApplicationListItem } from '../../shared/application'
import {
  interviewFormats,
  interviewResults,
  interviewRounds
} from '../../shared/interview'

interface Props {
  applications: ApplicationListItem[]
  onClose: () => void
  onCreated: () => void
}

function initialDateTime(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function CreateInterviewDialog({ applications, onClose, onCreated }: Props) {
  const activeApplications = useMemo(
    () => applications.filter((item) => !['已结束', '暂停'].includes(item.status)),
    [applications]
  )
  const [applicationId, setApplicationId] = useState(activeApplications[0]?.id ?? '')
  const [round, setRound] = useState('一面')
  const [scheduledAt, setScheduledAt] = useState(initialDateTime)
  const [format, setFormat] = useState('线上视频')
  const [result, setResult] = useState('待面')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!applicationId || !scheduledAt) return

    setSaving(true)
    setError(null)
    try {
      await window.jobflow.interviews.create({
        applicationId,
        round,
        scheduledAt: new Date(scheduledAt).toISOString(),
        format,
        result
      })
      onCreated()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '创建面试失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-5">
      <form
        onSubmit={(event) => void submit(event)}
        className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">添加面试</h2>
            <p className="mt-1 text-sm text-muted">安排一轮面试，并自动写入岗位 Timeline。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-slate-100"
          >
            关闭
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-muted">岗位</span>
            <select
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            >
              {activeApplications.length === 0 && <option value="">暂无可用岗位</option>}
              {activeApplications.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.companyName} · {item.jobTitle}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-muted">轮次</span>
              <select
                value={round}
                onChange={(event) => setRound(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
              >
                {interviewRounds.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-muted">形式</span>
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
              >
                {interviewFormats.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-muted">时间</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted">当前结果</span>
            <select
              value={result}
              onChange={(event) => setResult(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
            >
              {interviewResults.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving || !applicationId}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? '保存中…' : '添加面试'}
          </button>
        </div>
      </form>
    </div>
  )
}
