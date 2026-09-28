import type { ApplicationListItem } from '../../shared/application'

export type QuickFilter = 'all' | 'active' | 'action' | 'interview' | 'offer'
export type ApplicationSort = 'updatedAt' | 'applicationDate' | 'nextActionDate' | 'priority'

export interface ApplicationFilters {
  search: string
  status: string
  direction: string
  priority: string
  quick: QuickFilter
  sort: ApplicationSort
}

const priorityOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3 }

function parseDate(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY
  const time = Date.parse(value)
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

function isActionDue(item: ApplicationListItem, now: Date): boolean {
  if (!item.nextActionDate || item.status === '已结束' || item.status === '暂停') return false
  const due = Date.parse(item.nextActionDate)
  if (Number.isNaN(due)) return false
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return due <= now.getTime() + sevenDays
}

export function filterAndSortApplications(
  items: ApplicationListItem[],
  filters: ApplicationFilters,
  now = new Date()
): ApplicationListItem[] {
  const query = filters.search.trim().toLocaleLowerCase()

  return items
    .filter((item) => {
      if (query) {
        const haystack = [item.companyName, item.jobTitle, item.direction ?? '']
          .join(' ')
          .toLocaleLowerCase()
        if (!haystack.includes(query)) return false
      }

      if (filters.status && item.status !== filters.status) return false
      if (filters.direction && item.direction !== filters.direction) return false
      if (filters.priority && item.priority !== filters.priority) return false

      if (filters.quick === 'active' && ['已结束', '暂停'].includes(item.status)) return false
      if (filters.quick === 'action' && !isActionDue(item, now)) return false
      if (filters.quick === 'interview' && item.status !== '面试中') return false
      if (filters.quick === 'offer' && item.status !== 'Offer阶段') return false

      return true
    })
    .sort((a, b) => {
      if (filters.sort === 'priority') {
        return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
      }

      if (filters.sort === 'applicationDate') {
        return parseDate(b.applicationDate) - parseDate(a.applicationDate)
      }

      if (filters.sort === 'nextActionDate') {
        return parseDate(a.nextActionDate) - parseDate(b.nextActionDate)
      }

      return parseDate(b.updatedAt) - parseDate(a.updatedAt)
    })
}
