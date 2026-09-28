import type { ApplicationListItem } from '../../shared/application'

export const kanbanColumns = [
  { status: '待投递', label: '待投递' },
  { status: '已投递', label: '已投递' },
  { status: '测评/笔试', label: '测评 / 笔试' },
  { status: '面试中', label: '面试' },
  { status: 'Offer阶段', label: 'Offer' },
  { status: '已结束', label: '已结束' },
  { status: '暂停', label: '暂停' }
] as const

export function groupApplicationsByKanbanColumn(items: ApplicationListItem[]) {
  return Object.fromEntries(
    kanbanColumns.map((column) => [
      column.status,
      items.filter((item) => item.status === column.status)
    ])
  ) as Record<(typeof kanbanColumns)[number]['status'], ApplicationListItem[]>
}
