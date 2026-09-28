import type { AnalyticsDashboardData } from '../../../src/shared/analytics'
import { AnalyticsRepository } from '../db/analyticsRepository'
import type { JobFlowDatabase } from '../db/client'

interface AnalyticsApplication {
  id: string
  direction: string | null
  channel: string | null
  status: string
  applicationDate: string | null
  finalResult: string | null
  createdAt: string
}

interface AnalyticsInterview {
  applicationId: string
  round: string
}

interface AnalyticsEvent {
  applicationId: string
  eventType: string
  newValue: string | null
  createdAt: string
}

function isOffer(application: AnalyticsApplication): boolean {
  return application.status === 'Offer阶段' || application.finalResult === 'Offer'
}

function isSecondPlus(round: string): boolean {
  return round !== '一面' && round !== '其他'
}

function startTimestamp(application: AnalyticsApplication): number | null {
  if (application.applicationDate) {
    const parsed = Date.parse(`${application.applicationDate}T00:00:00`)
    if (!Number.isNaN(parsed)) return parsed
  }

  const created = Date.parse(application.createdAt)
  return Number.isNaN(created) ? null : created
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) return sorted[middle] ?? null
  const left = sorted[middle - 1]
  const right = sorted[middle]
  if (left === undefined || right === undefined) return null
  return (left + right) / 2
}

export function buildAnalyticsDashboard(
  applications: AnalyticsApplication[],
  interviews: AnalyticsInterview[],
  events: AnalyticsEvent[]
): AnalyticsDashboardData {
  const interviewApplications = new Set(interviews.map((item) => item.applicationId))
  const secondPlusApplications = new Set(
    interviews.filter((item) => isSecondPlus(item.round)).map((item) => item.applicationId)
  )
  const offerApplications = new Set(
    applications.filter(isOffer).map((item) => item.id)
  )

  const explicitAssessment = new Set(
    applications
      .filter((item) => item.status === '测评/笔试')
      .map((item) => item.id)
  )
  for (const event of events) {
    if (event.newValue === '测评/笔试') explicitAssessment.add(event.applicationId)
  }

  const assessmentApplications = new Set([
    ...explicitAssessment,
    ...interviewApplications,
    ...offerApplications
  ])

  const appliedApplications = new Set(
    applications
      .filter(
        (item) =>
          Boolean(item.applicationDate) ||
          item.status !== '待投递' ||
          assessmentApplications.has(item.id)
      )
      .map((item) => item.id)
  )

  const directionMap = new Map<
    string,
    { applications: number; interviews: number; offers: number }
  >()

  for (const application of applications) {
    const direction = application.direction || '未分类'
    const metric = directionMap.get(direction) ?? {
      applications: 0,
      interviews: 0,
      offers: 0
    }
    metric.applications += 1
    if (interviewApplications.has(application.id)) metric.interviews += 1
    if (offerApplications.has(application.id)) metric.offers += 1
    directionMap.set(direction, metric)
  }

  const channelMap = new Map<string, number>()
  for (const application of applications) {
    const channel = application.channel || '未记录'
    channelMap.set(channel, (channelMap.get(channel) ?? 0) + 1)
  }

  const eventsByApplication = new Map<string, AnalyticsEvent[]>()
  for (const event of events) {
    if (event.eventType === 'CREATED') continue
    const rows = eventsByApplication.get(event.applicationId) ?? []
    rows.push(event)
    eventsByApplication.set(event.applicationId, rows)
  }

  const responseDays: number[] = []
  for (const application of applications) {
    const start = startTimestamp(application)
    if (start === null) continue

    const firstEvent = (eventsByApplication.get(application.id) ?? [])
      .map((event) => Date.parse(event.createdAt))
      .filter((value) => !Number.isNaN(value) && value >= start)
      .sort((a, b) => a - b)[0]

    if (firstEvent === undefined) continue
    responseDays.push((firstEvent - start) / 86_400_000)
  }

  const average =
    responseDays.length === 0
      ? null
      : responseDays.reduce((sum, value) => sum + value, 0) / responseDays.length
  const responseMedian = median(responseDays)

  return {
    funnel: [
      { key: 'applied', label: '已投递', value: appliedApplications.size },
      { key: 'assessment', label: '测评 / 笔试+', value: assessmentApplications.size },
      { key: 'interview', label: '进入面试', value: interviewApplications.size },
      { key: 'secondPlus', label: '二面及以上', value: secondPlusApplications.size },
      { key: 'offer', label: 'Offer', value: offerApplications.size }
    ],
    directions: [...directionMap.entries()]
      .map(([direction, metric]) => ({ direction, ...metric }))
      .sort((a, b) => b.applications - a.applications),
    channels: [...channelMap.entries()]
      .map(([channel, count]) => ({ channel, applications: count }))
      .sort((a, b) => b.applications - a.applications),
    responseTime: {
      sampleCount: responseDays.length,
      averageDays: average === null ? null : roundOneDecimal(average),
      medianDays: responseMedian === null ? null : roundOneDecimal(responseMedian)
    }
  }
}

export class AnalyticsService {
  private readonly repository: AnalyticsRepository

  constructor(db: JobFlowDatabase) {
    this.repository = new AnalyticsRepository(db)
  }

  getDashboard(): AnalyticsDashboardData {
    return buildAnalyticsDashboard(
      this.repository.applications(),
      this.repository.interviews(),
      this.repository.events()
    )
  }
}
