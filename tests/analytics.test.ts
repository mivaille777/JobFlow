import { describe, expect, it } from 'vitest'
import { buildAnalyticsDashboard } from '../electron/main/services/analytics'

describe('analytics dashboard', () => {
  it('calculates funnel, directions, channels and response time from recorded facts', () => {
    const applications = [
      {
        id: 'a1',
        direction: 'AI Agent',
        channel: '内推',
        status: '面试中',
        applicationDate: null,
        finalResult: null,
        createdAt: '2026-09-20T00:00:00.000Z'
      },
      {
        id: 'a2',
        direction: 'LLM算法',
        channel: '官网',
        status: 'Offer阶段',
        applicationDate: null,
        finalResult: 'Offer',
        createdAt: '2026-09-21T00:00:00.000Z'
      },
      {
        id: 'a3',
        direction: 'AI Agent',
        channel: '官网',
        status: '待投递',
        applicationDate: null,
        finalResult: null,
        createdAt: '2026-09-22T00:00:00.000Z'
      }
    ]

    const interviews = [
      { applicationId: 'a1', round: '一面' },
      { applicationId: 'a1', round: '二面' },
      { applicationId: 'a2', round: 'HR面' }
    ]

    const events = [
      {
        applicationId: 'a1',
        eventType: 'CREATED',
        newValue: '已投递',
        createdAt: '2026-09-20T00:00:00.000Z'
      },
      {
        applicationId: 'a1',
        eventType: 'STATUS_CHANGED',
        newValue: '测评/笔试',
        createdAt: '2026-09-22T00:00:00.000Z'
      },
      {
        applicationId: 'a2',
        eventType: 'INTERVIEW_CREATED',
        newValue: null,
        createdAt: '2026-09-24T00:00:00.000Z'
      }
    ]

    const data = buildAnalyticsDashboard(applications, interviews, events)

    expect(data.funnel.map((item) => item.value)).toEqual([2, 2, 2, 2, 1])
    expect(data.directions[0]).toEqual({
      direction: 'AI Agent',
      applications: 2,
      interviews: 1,
      offers: 0
    })
    expect(data.channels).toEqual([
      { channel: '官网', applications: 2 },
      { channel: '内推', applications: 1 }
    ])
    expect(data.responseTime).toEqual({
      sampleCount: 2,
      averageDays: 2.5,
      medianDays: 2.5
    })
  })

  it('returns null response metrics when no response event exists', () => {
    const data = buildAnalyticsDashboard(
      [
        {
          id: 'a1',
          direction: null,
          channel: null,
          status: '已投递',
          applicationDate: null,
          finalResult: null,
          createdAt: '2026-09-20T00:00:00.000Z'
        }
      ],
      [],
      [],
    )

    expect(data.responseTime).toEqual({
      sampleCount: 0,
      averageDays: null,
      medianDays: null
    })
    expect(data.directions[0]?.direction).toBe('未分类')
    expect(data.channels[0]?.channel).toBe('未记录')
  })
})
