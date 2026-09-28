import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { applicationPriorityClass, applicationStatusClass } from '../app/presentation'
import { PageShell } from '../components/PageShell'
import { showToast } from '../app/toast'
import { ApplicationDetailDrawer } from '../features/applications/ApplicationDetailDrawer'
import { ApplicationOptionsDialog } from '../features/applications/ApplicationOptionsDialog'
import { KanbanBoard } from '../features/applications/KanbanBoard'
import { QuickAddDialog } from '../features/applications/QuickAddDialog'
import {
  filterAndSortApplications,
  type ApplicationFilters,
  type QuickFilter
} from '../features/applications/applicationFilters'
import {
  applicationPriorities,
  applicationRecruitmentTypes,
  applicationStatuses,
  type ApplicationDetail,
  type ApplicationListItem,
  type ApplicationPatch
} from '../shared/application'
import type { JobFlowSettings } from '../shared/settings'

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
  recruitmentType: '',
  priority: '',
  channel: '',
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

export function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<ApplicationListItem[]>([])
  const [filters, setFilters] = useState<ApplicationFilters>(initialFilters)
  const [loading, setLoading] = useState(true)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [optionSettings, setOptionSettings] = useState<JobFlowSettings | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  useEffect(() => {
    void window.jobflow.settings.get().then(setOptionSettings).catch(() => undefined)
    void window.jobflow.applications
      .list()
      .then(setItems)
      .catch((reason) => {
        console.error('Failed to load applications', reason)
        showToast('操作失败，请重试', 'error')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const openNew = searchParams.get('new') === '1'
    const focusSearch = searchParams.get('focus') === 'search'
    if (!openNew && !focusSearch) return

    if (openNew) setQuickAddOpen(true)
    if (focusSearch) {
      window.requestAnimationFrame(() => searchInputRef.current?.focus())
    }

    const next = new URLSearchParams(searchParams)
    next.delete('new')
    next.delete('focus')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const directions = useMemo(
    () =>
      Array.from(
        new Set([
          ...(optionSettings?.directions ?? []),
          ...items.map((item) => item.direction).filter((value): value is string => Boolean(value))
        ])
      ).sort(),
    [items, optionSettings]
  )

  const channels = useMemo(
    () =>
      Array.from(
        new Set([
          ...(optionSettings?.channels ?? []),
          ...items.map((item) => item.channel).filter((value): value is string => Boolean(value))
        ])
      ).sort(),
    [items, optionSettings]
  )

  const visibleItems = useMemo(
    () => filterAndSortApplications(items, filters),
    [items, filters]
  )

  function mergeDetail(updated: ApplicationDetail) {
    setItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
  }

  async function patchApplication(id: string, patch: ApplicationPatch) {
    const previous = items
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )

    try {
      const updated = await window.jobflow.applications.update(id, patch)
      mergeDetail(updated)
      showToast('已更新')
    } catch (reason) {
      console.error('Failed to update application', reason)
      setItems(previous)
      showToast('操作失败，请重试', 'error')
    }
  }

  function handleCreated(application: ApplicationDetail) {
    setItems((current) => [application, ...current])
    setSelectedId(application.id)
    showToast('岗位已新增')
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={[
                  'rounded-md px-3 py-1.5 transition',
                  viewMode === 'list' ? 'bg-white font-medium text-ink shadow-sm' : 'text-muted'
                ].join(' ')}
              >
                列表
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={[
                  'rounded-md px-3 py-1.5 transition',
                  viewMode === 'kanban' ? 'bg-white font-medium text-ink shadow-sm' : 'text-muted'
                ].join(' ')}
              >
                看板
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOptionsOpen(true)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              选项设置
            </button>
            <div className="text-sm text-muted">
              {visibleItems.length} / {items.length} 个岗位
            </div>
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              + 新增岗位
            </button>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_135px_145px_105px_95px_130px_130px]">
          <input
            ref={searchInputRef}
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
              <option key={status} value={status}>{status}</option>
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
              <option key={direction} value={direction}>{direction}</option>
            ))}
          </select>
          <select
            value={filters.recruitmentType}
            onChange={(event) =>
              setFilters((current) => ({ ...current, recruitmentType: event.target.value }))
            }
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="">全部类型</option>
            {applicationRecruitmentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
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
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          <select
            value={filters.channel}
            onChange={(event) =>
              setFilters((current) => ({ ...current, channel: event.target.value }))
            }
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="">全部渠道</option>
            {channels.map((channel) => (
              <option key={channel} value={channel}>{channel}</option>
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

        {viewMode === 'list' ? (
          <div className="overflow-hidden rounded-xl border border-line">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">优先级</th>
                  <th className="px-4 py-3 font-medium">公司 / 岗位</th>
                  <th className="px-4 py-3 font-medium">方向</th>
                  <th className="px-4 py-3 font-medium">类型</th>
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
                    <td colSpan={9} className="px-4 py-6">
                      <div className="space-y-3" aria-label="正在读取投递数据">
                        {[0, 1, 2, 3].map((key) => (
                          <div
                            key={key}
                            className="h-10 animate-pulse rounded-lg bg-slate-100"
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center">
                      <div className="font-medium text-slate-600">
                        {items.length === 0 ? '还没有投递记录' : '没有符合条件的岗位'}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {items.length === 0
                          ? '添加你的第一个岗位，开始管理投递流程。'
                          : '调整搜索词或筛选条件后再试。'}
                      </div>
                      {items.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setQuickAddOpen(true)}
                          className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition duration-150 ease-out hover:bg-slate-800"
                        >
                          + 新增岗位
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  visibleItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3">
                        <select
                          aria-label={`${item.companyName} 优先级`}
                          value={item.priority}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            void patchApplication(item.id, { priority: event.target.value })
                          }
                          className={`rounded-md border-0 px-2 py-1 font-semibold ${applicationPriorityClass(item.priority)}`}
                        >
                          {applicationPriorities.map((priority) => (
                            <option key={priority} value={priority}>{priority}</option>
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
                        <span className={[
                          'rounded-full px-2.5 py-1 text-xs font-medium',
                          item.recruitmentType === '实习'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-violet-50 text-violet-700'
                        ].join(' ')}>
                          {item.recruitmentType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`${item.companyName} 状态`}
                          value={item.status}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            void patchApplication(item.id, { status: event.target.value })
                          }
                          className={`rounded-md border-0 px-2 py-1 text-xs font-medium ${applicationStatusClass(item.status)}`}
                        >
                          {applicationStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          key={`${item.id}-${item.stage ?? ''}`}
                          defaultValue={item.stage ?? ''}
                          placeholder="填写节点"
                          onClick={(event) => event.stopPropagation()}
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
                          onClick={(event) => event.stopPropagation()}
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
        ) : (
          <KanbanBoard
            items={visibleItems}
            onOpen={setSelectedId}
            onStatusChange={async (id, status) => {
              await patchApplication(id, { status })
            }}
          />
        )}
      </div>

      <QuickAddDialog
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreated={handleCreated}
      />

      <ApplicationOptionsDialog
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        onChanged={setOptionSettings}
      />

      <ApplicationDetailDrawer
        applicationId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={(updated) => {
          mergeDetail(updated)
          showToast('已更新')
        }}
        onDeleted={(applicationId) => {
          setItems((current) => current.filter((item) => item.id !== applicationId))
          setSelectedId(null)
          showToast('岗位已删除')
        }}
      />
    </PageShell>
  )
}
