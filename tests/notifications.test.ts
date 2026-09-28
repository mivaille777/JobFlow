import { describe, expect, it } from 'vitest'
import {
  buildDesktopNotificationPlans,
  type NotificationApplication,
  type NotificationInterview
} from '../src/shared/notifications'

function application(
  overrides: Partial<NotificationApplication> = {}
): NotificationApplication {
  return {
    id: 'application-1',
    companyName: 'OpenAI',
    jobTitle: 'Agent Engineer',
    status: '已投递',
    nextAction: '准备技术面试',
    nextActionDate: '2026-09-28',
    ...overrides
  }
}

function interview(
  overrides: Partial<NotificationInterview> = {}
): NotificationInterview {
  return {
    id: 'interview-1',
    companyName: 'OpenAI',
    jobTitle: 'Agent Engineer',
    round: '一面',
    scheduledAt: new Date(2026, 8, 29, 12, 0, 0, 0).toISOString(),
    result: '待面',
    ...overrides
  }
}

describe('desktop notification planning', () => {
  it('creates 24-hour and 1-hour interview reminders', () => {
    const now = new Date(2026, 8, 28, 8, 0, 0, 0)
    const plans = buildDesktopNotificationPlans([], [interview()], now)

    expect(plans.map((plan) => plan.kind)).toEqual([
      'interview-24h',
      'interview-1h'
    ])
    expect(plans[0]?.fireAt).toBe(
      new Date(2026, 8, 28, 12, 0, 0, 0).toISOString()
    )
    expect(plans[1]?.fireAt).toBe(
      new Date(2026, 8, 29, 11, 0, 0, 0).toISOString()
    )
  })

  it('skips reminders that already passed and cancelled interviews', () => {
    const now = new Date(2026, 8, 29, 10, 30, 0, 0)

    expect(buildDesktopNotificationPlans([], [interview()], now).map((plan) => plan.kind)).toEqual([
      'interview-1h'
    ])
    expect(
      buildDesktopNotificationPlans(
        [],
        [interview({ result: '取消/改期' })],
        now
      )
    ).toHaveLength(0)
  })

  it('schedules today next actions for 09:00 when the app starts early', () => {
    const now = new Date(2026, 8, 28, 8, 0, 0, 0)
    const plans = buildDesktopNotificationPlans([application()], [], now)

    expect(plans).toHaveLength(1)
    expect(plans[0]?.kind).toBe('next-action')
    expect(plans[0]?.fireAt).toBe(
      new Date(2026, 8, 28, 9, 0, 0, 0).toISOString()
    )
  })

  it('queues an immediate in-session reminder when today morning already passed', () => {
    const now = new Date(2026, 8, 28, 12, 0, 0, 0)
    const plans = buildDesktopNotificationPlans([application()], [], now)

    expect(plans[0]?.fireAt).toBe(
      new Date(now.getTime() + 2_000).toISOString()
    )
  })

  it('ignores next actions outside today and inactive applications', () => {
    const now = new Date(2026, 8, 28, 8, 0, 0, 0)

    expect(
      buildDesktopNotificationPlans(
        [application({ nextActionDate: '2026-09-29' })],
        [],
        now
      )
    ).toHaveLength(0)
    expect(
      buildDesktopNotificationPlans(
        [application({ status: '已结束' })],
        [],
        now
      )
    ).toHaveLength(0)
  })
})
