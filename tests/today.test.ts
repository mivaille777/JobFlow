import { describe, expect, it } from 'vitest'
import type { ApplicationListItem } from '../src/shared/application'
import type { TodayEventItem, TodayInterviewItem } from '../src/shared/today'
import { buildTodayDashboard } from '../electron/main/services/today'

function application(
  id: string,
  overrides: Partial<ApplicationListItem> = {}
): ApplicationListItem {
  return {
    id,
    companyId: `company-${id}`,
    companyName: `Company ${id}`,
    jobTitle: `Role ${id}`,
    direction: 'AI Agent',
    recruitmentType: '校招',
    location: null,
    priority: 'A',
    status: '已投递',
    stage: null,
    channel: '官网',
    nextAction: null,
    nextActionDate: null,
    applicationDate: '2026-09-20',
    lastProgressAt: '2026-09-28T02:00:00.000Z',
    updatedAt: '2026-09-28T02:00:00.000Z',
    ...overrides
  }
}

describe('today dashboard rules', () => {
  const now = new Date('2026-09-28T08:00:00.000Z')

  it('groups action dates and ignores closed applications', () => {
    const data = buildTodayDashboard(
      [
        application('today', { nextActionDate: '2026-09-28' }),
        application('soon', { nextActionDate: '2026-10-02' }),
        application('overdue', { nextActionDate: '2026-09-27' }),
        application('closed', {
          status: '已结束',
          nextActionDate: '2026-09-27'
        })
      ],
      [],
      [],
      now
    )

    expect(data.todayActions.map((item) => item.id)).toEqual(['today'])
    expect(data.upcomingActions.map((item) => item.id)).toEqual(['soon'])
    expect(data.overdueActions.map((item) => item.id)).toEqual(['overdue'])
  })

  it('flags stale active applications after seven days', () => {
    const data = buildTodayDashboard(
      [
        application('stale', { lastProgressAt: '2026-09-20T08:00:00.000Z' }),
        application('fresh', { lastProgressAt: '2026-09-24T08:00:00.000Z' }),
        application('paused', {
          status: '暂停',
          lastProgressAt: '2026-09-01T08:00:00.000Z'
        })
      ],
      [],
      [],
      now
    )

    expect(data.staleApplications.map((item) => item.id)).toEqual(['stale'])
  })

  it('returns todays interviews, recent events and KPI counts', () => {
    const interviews: TodayInterviewItem[] = [
      {
        id: 'i1',
        applicationId: 'a1',
        companyName: '字节跳动',
        jobTitle: 'AI Agent Engineer',
        round: '二面',
        scheduledAt: '2026-09-28T11:00:00.000Z',
        format: '线上视频',
        result: '待面'
      },
      {
        id: 'i2',
        applicationId: 'a2',
        companyName: 'vivo',
        jobTitle: 'LLM Engineer',
        round: '一面',
        scheduledAt: '2026-09-29T11:00:00.000Z',
        format: null,
        result: null
      }
    ]

    const events: TodayEventItem[] = Array.from({ length: 12 }, (_, index) => ({
      id: `e${index}`,
      applicationId: 'a1',
      companyName: '字节跳动',
      jobTitle: 'AI Agent Engineer',
      eventType: 'STATUS_CHANGED',
      title: '状态更新',
      description: null,
      createdAt: `2026-09-28T0${index % 10}:00:00.000Z`
    }))

    const data = buildTodayDashboard(
      [
        application('a1', { status: '面试中' }),
        application('a2', { status: 'Offer阶段' }),
        application('a3')
      ],
      interviews,
      events,
      now
    )

    expect(data.todayInterviews).toHaveLength(1)
    expect(data.todayInterviews[0]?.id).toBe('i1')
    expect(data.recentEvents).toHaveLength(10)
    expect(data.counts).toEqual({
      totalApplications: 3,
      interviewing: 1,
      offers: 1
    })
  })
})
