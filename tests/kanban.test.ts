import { describe, expect, it } from 'vitest'
import {
  groupApplicationsByKanbanColumn,
  kanbanColumns
} from '../src/features/applications/kanban'
import type { ApplicationListItem } from '../src/shared/application'

function application(id: string, status: string): ApplicationListItem {
  return {
    id,
    companyId: `company-${id}`,
    companyName: `Company ${id}`,
    jobTitle: 'AI Engineer',
    direction: 'AI Agent',
    location: null,
    priority: 'A',
    status,
    stage: null,
    channel: null,
    nextAction: null,
    nextActionDate: null,
    applicationDate: null,
    lastProgressAt: null,
    updatedAt: '2026-09-28T00:00:00.000Z'
  }
}

describe('kanban grouping', () => {
  it('provides a lane for every supported application status', () => {
    expect(kanbanColumns.map((column) => column.status)).toEqual([
      '待投递',
      '已投递',
      '测评/笔试',
      '面试中',
      'Offer阶段',
      '已结束',
      '暂停'
    ])
  })

  it('groups applications without duplicating or dropping cards', () => {
    const items = [
      application('1', '待投递'),
      application('2', '面试中'),
      application('3', '面试中'),
      application('4', 'Offer阶段'),
      application('5', '暂停')
    ]

    const grouped = groupApplicationsByKanbanColumn(items)

    expect(grouped['面试中'].map((item) => item.id)).toEqual(['2', '3'])
    expect(grouped['Offer阶段'][0]?.id).toBe('4')
    expect(grouped['暂停'][0]?.id).toBe('5')
    expect(Object.values(grouped).flat()).toHaveLength(items.length)
  })
})
