import { describe, expect, it } from 'vitest'
import {
  filterAndSortApplications,
  type ApplicationFilters
} from '../src/features/applications/applicationFilters'
import type { ApplicationListItem } from '../src/shared/application'

const items: ApplicationListItem[] = [
  {
    id: '1',
    companyId: 'c1',
    companyName: 'ByteDance',
    jobTitle: 'AI Agent Engineer',
    direction: 'AI Agent',
    location: 'Beijing',
    priority: 'S',
    status: '面试中',
    stage: '二面待面',
    nextAction: null,
    nextActionDate: '2026-09-29',
    applicationDate: '2026-09-20',
    lastProgressAt: '2026-09-27',
    updatedAt: '2026-09-27'
  },
  {
    id: '2',
    companyId: 'c2',
    companyName: 'vivo',
    jobTitle: 'LLM Algorithm Engineer',
    direction: 'LLM算法',
    location: 'Shenzhen',
    priority: 'A',
    status: '已投递',
    stage: '简历筛选中',
    nextAction: null,
    nextActionDate: '2026-10-20',
    applicationDate: '2026-09-25',
    lastProgressAt: '2026-09-25',
    updatedAt: '2026-09-25'
  }
]

const base: ApplicationFilters = {
  search: '',
  status: '',
  direction: '',
  priority: '',
  quick: 'all',
  sort: 'updatedAt'
}

describe('application filters', () => {
  it('searches company, job title and direction', () => {
    expect(filterAndSortApplications(items, { ...base, search: 'agent' })).toHaveLength(1)
    expect(filterAndSortApplications(items, { ...base, search: 'vivo' })[0]?.id).toBe('2')
    expect(filterAndSortApplications(items, { ...base, search: 'LLM算法' })[0]?.id).toBe('2')
  })

  it('supports structured filters', () => {
    expect(filterAndSortApplications(items, { ...base, status: '面试中' })[0]?.id).toBe('1')
    expect(filterAndSortApplications(items, { ...base, priority: 'A' })[0]?.id).toBe('2')
  })

  it('finds actions due within seven days', () => {
    const result = filterAndSortApplications(
      items,
      { ...base, quick: 'action' },
      new Date('2026-09-28T00:00:00Z')
    )
    expect(result.map((item) => item.id)).toEqual(['1'])
  })

  it('sorts by priority and next action date', () => {
    expect(filterAndSortApplications(items, { ...base, sort: 'priority' })[0]?.id).toBe('1')
    expect(filterAndSortApplications(items, { ...base, sort: 'nextActionDate' })[0]?.id).toBe('1')
  })
})
