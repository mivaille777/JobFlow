import { useState } from 'react'
import type { ExcelImportPreview } from '../shared/transfer'

export function SettingsPage() {
  const [preview, setPreview] = useState<ExcelImportPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function chooseExcel() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const result = await window.jobflow.transfer.previewExcel()
      if (result) setPreview(result)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '读取 Excel 失败')
    } finally {
      setBusy(false)
    }
  }

  async function confirmImport() {
    if (!preview) return
    setBusy(true)
    setError(null)
    try {
      const result = await window.jobflow.transfer.confirmExcelImport(preview.sessionId)
      setMessage(
        `已导入 ${result.imported} 条岗位，跳过 ${result.skippedDuplicates} 条重复记录。`
      )
      setPreview(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '导入失败')
    } finally {
      setBusy(false)
    }
  }

  async function exportExcel() {
    setBusy(true)
    setError(null)
    try {
      const result = await window.jobflow.transfer.exportExcel()
      if (result) setMessage(`Excel 已导出：${result.fileName}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '导出 Excel 失败')
    } finally {
      setBusy(false)
    }
  }

  async function exportBackup() {
    setBusy(true)
    setError(null)
    try {
      const result = await window.jobflow.transfer.exportBackup()
      if (result) setMessage(`备份已保存：${result.fileName}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '备份失败')
    } finally {
      setBusy(false)
    }
  }

  async function restoreBackup() {
    if (
      !window.confirm(
        '恢复备份会用备份内容替换当前 JobFlow 数据。建议先导出一个当前备份。确定继续吗？'
      )
    ) {
      return
    }

    setBusy(true)
    setError(null)
    try {
      const result = await window.jobflow.transfer.importBackup()
      if (result) {
        setMessage(
          `备份已恢复：${result.applications} 个岗位、${result.interviews} 场面试、${result.events} 条 Timeline。`
        )
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '恢复备份失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Settings</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">设置</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        当前阶段先提供数据迁移与本地备份；主题和个性化配置将在下一阶段补齐。
      </p>

      {(message || error) && (
        <div
          className={[
            'mt-6 rounded-xl border px-4 py-3 text-sm',
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-700'
          ].join(' ')}
        >
          {error ?? message}
        </div>
      )}

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-panel">
          <div>
            <h2 className="text-base font-semibold">Excel 数据迁移</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              可直接导入之前的“秋招投递管理表”。导入前会检查重复岗位，不会直接写数据库。
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => void chooseExcel()}
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              导入 Excel
            </button>
            <button
              disabled={busy}
              onClick={() => void exportExcel()}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              导出 Excel
            </button>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-muted">
            重复规则：优先使用“公司 + 岗位 + Job ID”；没有 Job ID 时使用“公司 + 岗位”。
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-panel">
          <div>
            <h2 className="text-base font-semibold">完整本地备份</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              JSON Backup 会保存岗位、Timeline、面试复盘和设置，适合换电脑或升级前备份。
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => void exportBackup()}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              导出 Backup
            </button>
            <button
              disabled={busy}
              onClick={() => void restoreBackup()}
              className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              恢复 Backup
            </button>
          </div>

          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-800">
            恢复备份会全量替换当前数据库；执行前建议先导出一份当前 Backup。
          </div>
        </section>
      </div>

      {preview && (
        <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/40 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Import Preview
              </div>
              <h2 className="mt-1 text-lg font-semibold">{preview.fileName}</h2>
              <p className="mt-2 text-sm text-muted">
                检测到 {preview.totalRows} 条岗位，其中 {preview.importableRows} 条可导入，
                {preview.duplicateRows} 条疑似重复。
              </p>
            </div>

            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={() => setPreview(null)}
                className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium"
              >
                取消
              </button>
              <button
                disabled={busy || preview.importableRows === 0}
                onClick={() => void confirmImport()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                确认导入
              </button>
            </div>
          </div>

          {preview.duplicates.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white">
              <div className="grid grid-cols-[70px_1fr_1.4fr] bg-slate-50 px-4 py-2 text-xs font-medium text-muted">
                <span>行号</span>
                <span>公司</span>
                <span>岗位</span>
              </div>
              {preview.duplicates.map((item) => (
                <div
                  key={`${item.rowNumber}-${item.companyName}-${item.jobTitle}`}
                  className="grid grid-cols-[70px_1fr_1.4fr] border-t border-line px-4 py-2.5 text-sm"
                >
                  <span className="text-muted">{item.rowNumber}</span>
                  <span>{item.companyName}</span>
                  <span>{item.jobTitle}</span>
                </div>
              ))}
              {preview.duplicateRows > preview.duplicates.length && (
                <div className="border-t border-line px-4 py-2.5 text-xs text-muted">
                  仅显示前 {preview.duplicates.length} 条重复记录。
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </section>
  )
}
