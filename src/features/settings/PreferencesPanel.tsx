import { useEffect, useState } from 'react'
import { applicationPriorities, type ApplicationPriority } from '../../shared/application'
import {
  themePreferences,
  type JobFlowSettings,
  type ThemePreference
} from '../../shared/settings'
import { applyThemePreference } from '../../app/theme'

const themeLabels: Record<ThemePreference, string> = {
  light: '浅色',
  dark: '深色',
  system: '跟随系统'
}

export function PreferencesPanel() {
  const [settings, setSettings] = useState<JobFlowSettings | null>(null)
  const [newDirection, setNewDirection] = useState('')
  const [newChannel, setNewChannel] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void window.jobflow.settings
      .get()
      .then((value) => {
        if (!cancelled) setSettings(value)
      })
      .catch(() => {
        if (!cancelled) setError('读取设置失败。')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function flash(text: string) {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 1400)
  }

  async function setTheme(theme: ThemePreference) {
    if (!settings) return
    setError('')
    try {
      const updated = await window.jobflow.settings.update({ theme })
      setSettings(updated)
      applyThemePreference(updated.theme)
      flash('主题已更新')
    } catch {
      setError('主题更新失败。')
    }
  }

  async function setPriority(defaultPriority: ApplicationPriority) {
    if (!settings) return
    setError('')
    try {
      const updated = await window.jobflow.settings.update({ defaultPriority })
      setSettings(updated)
      flash('默认优先级已更新')
    } catch {
      setError('默认优先级更新失败。')
    }
  }

  async function saveDirections(directions: string[]) {
    if (!settings) return
    setError('')
    try {
      const updated = await window.jobflow.settings.update({ directions })
      setSettings(updated)
      flash('岗位方向已更新')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '岗位方向更新失败。')
    }
  }

  async function addDirection() {
    if (!settings) return
    const value = newDirection.trim()
    if (!value || settings.directions.includes(value)) return
    await saveDirections([...settings.directions, value])
    setNewDirection('')
  }

  async function saveChannels(channels: string[]) {
    if (!settings) return
    setError('')
    try {
      const updated = await window.jobflow.settings.update({ channels })
      setSettings(updated)
      flash('投递渠道已更新')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '投递渠道更新失败。')
    }
  }

  async function addChannel() {
    if (!settings) return
    const value = newChannel.trim()
    if (!value || settings.channels.includes(value)) return
    await saveChannels([...settings.channels, value])
    setNewChannel('')
  }

  if (!settings) {
    return (
      <section className="rounded-2xl border border-line bg-white p-6 shadow-panel">
        <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 h-28 animate-pulse rounded-xl bg-slate-100" />
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">偏好设置</h2>
          <p className="mt-1 text-sm text-muted">修改后立即保存到本地 SQLite。</p>
        </div>
        {message && <span className="text-xs font-medium text-green-700">✓ {message}</span>}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="text-sm font-medium">外观</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {themePreferences.map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => void setTheme(theme)}
                className={[
                  'rounded-lg border px-3 py-2 text-sm transition',
                  settings.theme === theme
                    ? 'border-slate-800 bg-ink text-white'
                    : 'border-line bg-white text-muted hover:bg-slate-50'
                ].join(' ')}
              >
                {themeLabels[theme]}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium">新增岗位默认优先级</span>
          <select
            value={settings.defaultPriority}
            onChange={(event) =>
              void setPriority(event.target.value as ApplicationPriority)
            }
            className="mt-3 w-full max-w-xs rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
          >
            {applicationPriorities.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-7 border-t border-line pt-6">
        <div className="text-sm font-medium">岗位方向</div>
        <p className="mt-1 text-xs text-muted">用于 Quick Add 的方向选择，最多 20 个。</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {settings.directions.map((direction) => (
            <span
              key={direction}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-slate-50 px-3 py-1.5 text-sm"
            >
              {direction}
              {settings.directions.length > 1 && (
                <button
                  type="button"
                  aria-label={`删除 ${direction}`}
                  onClick={() =>
                    void saveDirections(settings.directions.filter((item) => item !== direction))
                  }
                  className="text-slate-400 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="mt-4 flex max-w-md gap-2">
          <input
            value={newDirection}
            maxLength={40}
            placeholder="添加方向，例如：具身智能"
            onChange={(event) => setNewDirection(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void addDirection()
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void addDirection()}
            disabled={!newDirection.trim()}
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            添加
          </button>
        </div>
      </div>

      <div className="mt-7 border-t border-line pt-6">
        <div className="text-sm font-medium">投递渠道</div>
        <p className="mt-1 text-xs text-muted">用于新增、编辑和筛选岗位，最多 20 个。</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {settings.channels.map((channel) => (
            <span
              key={channel}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-slate-50 px-3 py-1.5 text-sm"
            >
              {channel}
              {settings.channels.length > 1 && (
                <button
                  type="button"
                  aria-label={`删除渠道 ${channel}`}
                  onClick={() =>
                    void saveChannels(settings.channels.filter((item) => item !== channel))
                  }
                  className="text-slate-400 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="mt-4 flex max-w-md gap-2">
          <input
            value={newChannel}
            maxLength={40}
            placeholder="添加渠道，例如：公司招聘公众号"
            onChange={(event) => setNewChannel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void addChannel()
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void addChannel()}
            disabled={!newChannel.trim()}
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            添加
          </button>
        </div>
      </div>

      <div className="mt-7 border-t border-line pt-6">
        <div className="text-sm font-medium">本地数据库</div>
        <div className="mt-2 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-muted">
          {settings.databasePath}
        </div>
      </div>
    </section>
  )
}
