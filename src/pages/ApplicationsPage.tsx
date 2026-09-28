import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '../components/PageShell'
import {
  filterAndSortApplications,
  type ApplicationFilters,
  type QuickFilter
} from '../features/applications/applicationFilters'
import {
  applicationPriorities,
  applicationStatuses,
  type ApplicationListItem,
  type ApplicationPatch
} from '../shared/application'

const quickFilters: Array<{ value: QuickFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'action', label: '待处理' },
  { value: 'interview', label: '面试' },
  { value: 'offer', label: 'Offer' }
]

const initialFilters: ApplicationFilters = {
  search: '',
  status: '',
  direction: '',
  priority: '',
  quick: 'all',
  sort: 'updatedAt'
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function statusClass(status: string): string {
  if (status === '面试中') return 'bg-violet-50 text-violet-700'
  if (status === 'Offer阶段') return 'bg-emerald-50 text-emerald-700'
  if (status === '测评/笔试') return 'bg-amber-50 text-amber-700'
  if (status === '已结束') return 'bg-rose-50 text-rose-700'
  if (status === '已投递') return 'bg-blue-50 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}

export function ApplicationsPage() {
  const [items, setItems] = useState<ApplicationListItem[]>([])
  const [filters, setFilters] = useState<ApplicationFilters>(initialFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    void window.jobflow.applications
      .list()
      .then(setItems)
      .catch(() => setError('读取投递数据失败，请重试。'))
      .finally(() => setLoading(false))
  }, [])

  const directions = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.direction).filter((value): value is string => Boolean(value)))
      ).sort(),
    [items]
  )

  const visibleItems = useMemo(
    () => filterAndSortApplications(items, filters),
    [items, filters]
  )

  async function patchApplication(id: string, patch: ApplicationPatch) {
    const previous = items
    setError('')
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )

    try {
      const updated = await window.jobflow.applications.update(id, patch)
      setItems((current) => current.map((item) => (item.id === id ? updated : item)))
      setToast('已更新')
      window.setTimeout(() => setToast(''), 1600)
    } catch {
      setItems(previous)
      setError('更新失败，数据已恢复。')
    }
  }

  return (
    <PageShell
      eyebrow="Applications"
      title="投递管理"
      description="用列表快速搜索、筛选和推进岗位状态。高频字段可直接在表格中修改。"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, quick: filter.value }))}
                className={[
                  'rounded-lg px-3 py-2 text-sm transition-colors',
                  filters.quick === filter.value
                    ? 'bg-ink text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                ].join(' ')}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="text-sm text-muted">
            {visibleItems.length} / {items.length} 个岗位
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_160px_120px_150px]">
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="搜索公司 / 岗位 / 方向"
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400"
          />
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="">全部状态</option>
            {applicationStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={filters.direction}
            onChange={(event) =>
              setFilters((current) => ({ ...current, direction: event.target.value }))
            }
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="">全部方向</option>
            {directions.map((direction) => (
              <option key={direction} value={direction}>
                {direction}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(event) =>
              setFilters((current) => ({ ...current, priority: event.target.value }))
            }
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="">优先级</option>
            {applicationPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sort: event.target.value as ApplicationFilters['sort']
              }))
            }
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="updatedAt">最近更新</option>
            <option value="applicationDate">投递日期</option>
            <option value="nextActionDate">截止日期</option>
            <option value="priority">优先级</option>
          </select>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-line">
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">优先级</th>
                  <th className="px-4 py-3 font-medium">公司 / 岗位</th>
                  <th className="px-4 py-3 font-medium">方向</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">当前节点</th>
                  <th className="px-4 py-3 font-medium">下一步日期</th>
                  <th className="px-4 py-3 font-medium">投递</th>
                  <th className="px-4 py-3 font-medium">最近更新</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted">
                      正在读取投递数据…
                    </td>
                  </tr>
                ) : visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center">
                      <div className="font-medium text-slate-600">
                        {items.length === 0 ? '还没有投递记录' : '没有符合条件的岗位'}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {items.length === 0
                          ? 'Stage 3 会加入快速新增岗位。'
                          : '调整搜索词或筛选条件后再试。'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleItems.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <select
                          aria-label={`${item.companyName} 优先级`}
                          value={item.priority}
                          onChange={(event) =>
                            void patchApplication(item.id, { priority: event.target.value })
                          }
                          className="rounded-md border border-line bg-white px-2 py-1 font-semibold"
                        >
                          {applicationPriorities.map((priority) => (
                            <option key={priority} value={priority}>
                              {priority}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{item.companyName}</div>
                        <div className="mt-0.5 max-w-[240px] truncate text-xs text-muted">
                          {item.jobTitle}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{item.direction ?? '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`${item.companyName} 状态`}
                          value={item.status}
                          onChange={(event) =>
                            void patchApplication(item.id, { status: event.target.value })
                          }
                          className={`rounded-md border-0 px-2 py-1 text-xs font-medium ${statusClass(item.status)}`}
                        >
                          {applicationStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          key={`${item.id}-${item.stage ?? ''}`}
                          defaultValue={item.stage ?? ''}
                          placeholder="填写节点"
                          onBlur={(event) => {
                            const value = event.target.value.trim()
                            if (value !== (item.stage ?? '')) {
                              void patchApplication(item.id, { stage: value || null })
                            }
                          }}
                          className="w-36 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none hover:border-line focus:border-slate-400 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={item.nextActionDate?.slice(0, 10) ?? ''}
                          onChange={(event) =>
                            void patchApplication(item.id, {
                              nextActionDate: event.target.value || null
                            })
                          }
                          className="rounded-md border border-line bg-white px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(item.applicationDate)}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(item.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg">
          ✓ {toast}
        </div>
      ) : null}
    </PageShell>
  )
}
