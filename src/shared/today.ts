import type { ApplicationListItem } from './application'

export interface TodayInterviewItem {
  id: string
  applicationId: string
  companyName: string
  jobTitle: string
  round: string
  scheduledAt: string
  format: string | null
  result: string | null
}

export interface TodayEventItem {
  id: string
  applicationId: string
  companyName: string
  jobTitle: string
  eventType: string
  title: string
  description: string | null
  createdAt: string
}

export interface TodayDashboardData {
  generatedAt: string
  counts: {
    totalApplications: number
    interviewing: number
    offers: number
  }
  todayActions: ApplicationListItem[]
  upcomingActions: ApplicationListItem[]
  overdueActions: ApplicationListItem[]
  staleApplications: ApplicationListItem[]
  todayInterviews: TodayInterviewItem[]
  recentEvents: TodayEventItem[]
}
