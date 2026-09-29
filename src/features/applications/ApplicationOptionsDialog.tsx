import { useEffect, useState } from 'react'
import type { JobFlowSettings } from '../../shared/settings'

interface ApplicationOptionsDialogProps {
  open: boolean
  onClose: () => void
  onChanged: (settings: JobFlowSettings) => void
}

export function ApplicationOptionsDialog({
  open,
  onClose,
  onChanged
}: ApplicationOptionsDialogProps) {
  const [settings, setSettings] = useState<JobFlowSettings | null>(null)
  const [newDirection, setNewDirection] = useState('')
  const [newChannel, setNewChannel] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    void window.jobflow.settings
      .get()
      .then(setSettings)
      .catch(() => setError('读取投递选项失败。'))

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  async function update(patch: { directions?: string[]; channels?: string[] }) {
    setError('')
    try {
      const next = await window.jobflow.settings.update(patch)
      setSettings(next)
      onChanged(next)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '保存投递选项失败。')
    }
  }

  async function addDirection() {
    if (!settings) return
    const value = newDirection.trim()
    if (!value || settings.directions.includes(value)) return
    await update({ directions: [...settings.directions, value] })
    setNewDirection('')
  }

  async function addChannel() {
    if (!settings) return
    const value = newChannel.trim()
    if (!value || settings.channels.includes(value)) return
    await update({ channels: [...settings.channels, value] })
    setNewChannel('')
  }

  return (
    <div className="jobflow-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4 backdrop-blur-md">
      <button
        type="button"
        aria-label="关闭投递选项设置"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-label="投递选项设置"
        className="jobflow-dialog-in relative z-10 w-full max-w-2xl jobflow-dialog-in"
      >
        <header className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">投递选项设置</h2>
            <p className="mt-1 text-sm text-muted">统一维护岗位方向和投递渠道，新建、编辑和筛选会同步使用。</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-ink">×</button>
        </header>

        <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
          {settings ? (
            <>
              <OptionGroup
                title="岗位方向"
                description="最多 20 个，每项不超过 40 个字符。"
                values={settings.directions}
                newValue={newDirection}
                inputLabel="新增岗位方向"
                inputPlaceholder="例如：具身智能"
                addLabel="添加方向"
                onNewValue={setNewDirection}
                onAdd={() => void addDirection()}
                onRemove={(value) => {
                  if (settings.directions.length <= 1) return
                  void update({ directions: settings.directions.filter((item) => item !== value) })
                }}
              />

              <OptionGroup
                title="投递渠道"
                description="例如官网、内推、牛客、招聘公众号。"
                values={settings.channels}
                newValue={newChannel}
                inputLabel="新增投递渠道"
                inputPlaceholder="例如：校园官网"
                addLabel="添加渠道"
                onNewValue={setNewChannel}
                onAdd={() => void addChannel()}
                onRemove={(value) => {
                  if (settings.channels.length <= 1) return
                  void update({ channels: settings.channels.filter((item) => item !== value) })
                }}
              />
            </>
          ) : (
            <div className="md:col-span-2 rounded-xl border border-line bg-slate-50 px-4 py-10 text-center text-sm text-muted">
              正在读取投递选项…
            </div>
          )}
        </div>

        {error ? (
          <div className="mx-6 mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <footer className="flex justify-end border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            完成
          </button>
        </footer>
      </section>
    </div>
  )
}

function OptionGroup({
  title,
  description,
  values,
  newValue,
  inputLabel,
  inputPlaceholder,
  addLabel,
  onNewValue,
  onAdd,
  onRemove
}: {
  title: string
  description: string
  values: string[]
  newValue: string
  inputLabel: string
  inputPlaceholder: string
  addLabel: string
  onNewValue: (value: string) => void
  onAdd: () => void
  onRemove: (value: string) => void
}) {
  return (
    <div className="rounded-xl border border-line bg-slate-50/60 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted">{description}</p>

      <div className="mt-4 flex min-h-16 flex-wrap content-start gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm"
          >
            {value}
            {values.length > 1 ? (
              <button
                type="button"
                aria-label={`删除 ${value}`}
                onClick={() => onRemove(value)}
                className="text-slate-400 hover:text-rose-600"
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          aria-label={inputLabel}
          value={newValue}
          maxLength={40}
          placeholder={inputPlaceholder}
          onChange={(event) => onNewValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onAdd()
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!newValue.trim()}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium disabled:opacity-40"
        >
          {addLabel}
        </button>
      </div>
    </div>
  )
}
