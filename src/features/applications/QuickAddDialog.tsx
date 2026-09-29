import { useEffect, useState, type FormEvent } from 'react'
import { showToast } from '../../app/toast'
import {
  applicationPriorities,
  applicationRecruitmentTypes,
  applicationStatuses,
  type ApplicationDetail,
  type ApplicationPriority,
  type CreateApplicationRequest
} from '../../shared/application'
import {
  defaultApplicationChannels,
  defaultJobDirections
} from '../../shared/settings'

interface QuickAddDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (application: ApplicationDetail) => void
}

const today = () => new Date().toISOString().slice(0, 10)

const initialForm = (
  defaultPriority: ApplicationPriority = 'A',
  direction: string = defaultJobDirections[0]
): CreateApplicationRequest => ({
  companyName: '',
  jobTitle: '',
  direction,
  recruitmentType: '校招',
  priority: defaultPriority,
  status: '待投递',
  jobUrl: '',
  location: '',
  jobId: '',
  channel: '',
  referral: '',
  resumeVersion: '',
  applicationDate: today(),
  notes: ''
})

export function QuickAddDialog({ open, onClose, onCreated }: QuickAddDialogProps) {
  const [form, setForm] = useState<CreateApplicationRequest>(initialForm)
  const [directions, setDirections] = useState<string[]>([...defaultJobDirections])
  const [channels, setChannels] = useState<string[]>([...defaultApplicationChannels])
  const [defaultPriority, setDefaultPriority] = useState<ApplicationPriority>('A')
  const [advanced, setAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    let cancelled = false
    void window.jobflow.settings
      .get()
      .then((settings) => {
        if (cancelled) return
        setDirections(settings.directions)
        setChannels(settings.channels)
        setDefaultPriority(settings.defaultPriority)
        setForm(initialForm(settings.defaultPriority, settings.directions[0]))
      })
      .catch(() => {
        if (!cancelled) setForm(initialForm())
      })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      cancelled = true
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  function update<K extends keyof CreateApplicationRequest>(
    key: K,
    value: CreateApplicationRequest[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.companyName.trim() || !form.jobTitle.trim()) {
      setError('公司和岗位为必填项。')
      return
    }

    setSaving(true)
    setError('')
    try {
      const created = await window.jobflow.applications.create(form)
      onCreated(created)
      setForm(initialForm(defaultPriority, directions[0]))
      setAdvanced(false)
      onClose()
    } catch (reason) {
      console.error('Failed to create application', reason)
      showToast('操作失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="jobflow-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4 backdrop-blur-md">
      <button
        type="button"
        aria-label="关闭新增岗位"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <form
        onSubmit={(event) => void submit(event)}
        className="jobflow-dialog-in relative z-10 w-full max-w-2xl rounded-2xl border border-line bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">新增岗位</h2>
            <p className="mt-1 text-sm text-muted">只填公司和岗位也可以，其他信息以后再补。</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-ink">
            ×
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">公司 *</span>
              <input
                autoFocus
                value={form.companyName}
                onChange={(event) => update('companyName', event.target.value)}
                placeholder="例如：字节跳动"
                className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-slate-400"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">岗位 *</span>
              <input
                value={form.jobTitle}
                onChange={(event) => update('jobTitle', event.target.value)}
                placeholder="例如：AI Agent Engineer"
                className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-slate-400"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">岗位方向</span>
              <select
                value={form.direction ?? ''}
                onChange={(event) => update('direction', event.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2"
              >
                {directions.map((direction) => (
                  <option key={direction} value={direction}>{direction}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">招聘类型</span>
              <select
                value={form.recruitmentType}
                onChange={(event) => update('recruitmentType', event.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2"
              >
                {applicationRecruitmentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">优先级</span>
              <select
                value={form.priority}
                onChange={(event) => update('priority', event.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2"
              >
                {applicationPriorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">状态</span>
              <select
                value={form.status}
                onChange={(event) => update('status', event.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2"
              >
                {applicationStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">JD 链接</span>
            <input
              value={form.jobUrl ?? ''}
              onChange={(event) => update('jobUrl', event.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-line px-3 py-2"
            />
          </label>

          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            className="text-sm font-medium text-accent hover:underline"
          >
            {advanced ? '收起更多信息 ↑' : '更多信息 ↓'}
          </button>

          {advanced ? (
            <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              {[
                ['location', 'Base / 地点'],
                ['jobId', 'Job ID'],
                ['referral', '内推人 / 内推码'],
                ['resumeVersion', '简历版本']
              ].map(([key, label]) => (
                <label key={key} className="space-y-1.5 text-sm">
                  <span className="font-medium">{label}</span>
                  <input
                    value={(form[key as keyof CreateApplicationRequest] as string | null) ?? ''}
                    onChange={(event) =>
                      update(key as keyof CreateApplicationRequest, event.target.value)
                    }
                    className="w-full rounded-lg border border-line bg-white px-3 py-2"
                  />
                </label>
              ))}
              <label className="space-y-1.5 text-sm">
                <span className="font-medium">投递渠道</span>
                <select
                  value={form.channel ?? ''}
                  onChange={(event) => update('channel', event.target.value || null)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2"
                >
                  <option value="">未设置</option>
                  {channels.map((channel) => (
                    <option key={channel} value={channel}>{channel}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium">投递日期</span>
                <input
                  type="date"
                  value={form.applicationDate ?? ''}
                  onChange={(event) => update('applicationDate', event.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2"
                />
              </label>
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium">备注</span>
                <textarea
                  rows={3}
                  value={form.notes ?? ''}
                  onChange={(event) => update('notes', event.target.value)}
                  className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2"
                />
              </label>
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-slate-100"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存岗位'}
          </button>
        </div>
      </form>
    </div>
  )
}
