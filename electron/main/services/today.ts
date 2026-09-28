import type { ApplicationListItem } from '../../../src/shared/application'
import type {
  TodayDashboardData,
  TodayEventItem,
  TodayInterviewItem
} from '../../../src/shared/today'
import type { JobFlowDatabase } from '../db/client'
import {
  ApplicationRepository,
  EventRepository,
  InterviewRepository
} from '../db/repositories'

const DAY_MS = 24 * 60 * 60 * 1000

function calendarDay(value: string, dateOnly = false): number | null {
  if (dateOnly || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    if (!match) return null
    const [, year, month, day] = match
    return Date.UTC(Number(year), Number(month) - 1, Number(day)) / DAY_MS
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
}

function currentCalendarDay(now: Date): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS
}

function offsetFromToday(value: string | null, today: number, dateOnly = false): number | null {
  if (!value) return null
  const day = calendarDay(value, dateOnly)
  return day === null ? null : day - today
}

function isActive(item: ApplicationListItem): boolean {
  return !['已结束', '暂停'].includes(item.status)
}

function byNextActionDate(a: ApplicationListItem, b: ApplicationListItem): number {
  return (a.nextActionDate ?? '').localeCompare(b.nextActionDate ?? '')
}

function byLastProgress(a: ApplicationListItem, b: ApplicationListItem): number {
  return (a.lastProgressAt ?? '').localeCompare(b.lastProgressAt ?? '')
}

export function buildTodayDashboard(
  applications: ApplicationListItem[],
  interviews: TodayInterviewItem[],
  events: TodayEventItem[],
  now = new Date()
): TodayDashboardData {
  const today = currentCalendarDay(now)
  const active = applications.filter(isActive)

  const todayActions = active
    .filter((item) => offsetFromToday(item.nextActionDate, today, true) === 0)
    .sort(byNextActionDate)

  const upcomingActions = active
    .filter((item) => {
      const offset = offsetFromToday(item.nextActionDate, today, true)
      return offset !== null && offset >= 1 && offset <= 7
    })
    .sort(byNextActionDate)

  const overdueActions = active
    .filter((item) => {
      const offset = offsetFromToday(item.nextActionDate, today, true)
      return offset !== null && offset < 0
    })
    .sort(byNextActionDate)

  const staleApplications = active
    .filter((item) => {
      const offset = offsetFromToday(item.lastProgressAt, today)
      return offset !== null && offset <= -7
    })
    .sort(byLastProgress)

  const todayInterviews = interviews
    .filter((item) => offsetFromToday(item.scheduledAt, today) === 0)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  return {
    generatedAt: now.toISOString(),
    counts: {
      totalApplications: applications.length,
      interviewing: applications.filter((item) => item.status === '面试中').length,
      offers: applications.filter((item) => item.status === 'Offer阶段').length
    },
    todayActions,
    upcomingActions,
    overdueActions,
    staleApplications,
    todayInterviews,
    recentEvents: events.slice(0, 10)
  }
}

export class TodayService {
  private readonly applications: ApplicationRepository
  private readonly interviews: InterviewRepository
  private readonly events: EventRepository

  constructor(db: JobFlowDatabase) {
    this.applications = new ApplicationRepository(db)
    this.interviews = new InterviewRepository(db)
    this.events = new EventRepository(db)
  }

  getDashboard(now = new Date()): TodayDashboardData {
    return buildTodayDashboard(
      this.applications.listWithCompany(),
      this.interviews.listWithApplication(),
      this.events.listRecentWithApplication(10),
      now
    )
  }
}
