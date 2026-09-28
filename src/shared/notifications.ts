export type DesktopNotificationKind =
  | 'interview-24h'
  | 'interview-1h'
  | 'next-action'

export interface NotificationApplication {
  id: string
  companyName: string
  jobTitle: string
  status: string
  nextAction: string | null
  nextActionDate: string | null
}

export interface NotificationInterview {
  id: string
  companyName: string
  jobTitle: string
  round: string
  scheduledAt: string
  result: string | null
}

export interface DesktopNotificationPlan {
  id: string
  kind: DesktopNotificationKind
  fireAt: string
  title: string
  body: string
}

const HOUR_MS = 60 * 60 * 1000

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), 9, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function nextActionPlan(
  application: NotificationApplication,
  now: Date
): DesktopNotificationPlan | null {
  if (!application.nextActionDate || ['已结束', '暂停'].includes(application.status)) return null

  const morning = parseDateOnly(application.nextActionDate)
  if (!morning || !sameLocalDay(morning, now)) return null

  const fireAt =
    morning.getTime() > now.getTime()
      ? morning
      : new Date(now.getTime() + 2_000)

  return {
    id: `next-action:${application.id}:${application.nextActionDate}`,
    kind: 'next-action',
    fireAt: fireAt.toISOString(),
    title: `今日待办 · ${application.companyName}`,
    body: application.nextAction
      ? `${application.jobTitle}：${application.nextAction}`
      : `${application.jobTitle}：今天有需要处理的下一步事项`
  }
}

function interviewPlans(
  interview: NotificationInterview,
  now: Date
): DesktopNotificationPlan[] {
  if (interview.result === '取消/改期' || interview.result === '未通过') return []

  const scheduledAt = new Date(interview.scheduledAt)
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= now.getTime()) return []

  const reminders: Array<{
    kind: Extract<DesktopNotificationKind, 'interview-24h' | 'interview-1h'>
    offsetMs: number
    label: string
  }> = [
    { kind: 'interview-24h', offsetMs: 24 * HOUR_MS, label: '24 小时' },
    { kind: 'interview-1h', offsetMs: HOUR_MS, label: '1 小时' }
  ]

  return reminders.flatMap((reminder) => {
    const fireAt = new Date(scheduledAt.getTime() - reminder.offsetMs)
    if (fireAt.getTime() <= now.getTime()) return []

    return [
      {
        id: `${reminder.kind}:${interview.id}:${interview.scheduledAt}`,
        kind: reminder.kind,
        fireAt: fireAt.toISOString(),
        title: `面试提醒 · ${interview.companyName}`,
        body: `${interview.jobTitle} · ${interview.round} 将在 ${reminder.label}后开始`
      }
    ]
  })
}

export function buildDesktopNotificationPlans(
  applications: NotificationApplication[],
  interviews: NotificationInterview[],
  now = new Date()
): DesktopNotificationPlan[] {
  return [
    ...applications.flatMap((application) => {
      const plan = nextActionPlan(application, now)
      return plan ? [plan] : []
    }),
    ...interviews.flatMap((interview) => interviewPlans(interview, now))
  ].sort((a, b) => a.fireAt.localeCompare(b.fireAt))
}
