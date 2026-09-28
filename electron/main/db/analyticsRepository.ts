import { asc } from 'drizzle-orm'
import type { JobFlowDatabase } from './client'
import { applicationEvents, applications, interviews } from './schema'

export class AnalyticsRepository {
  constructor(private readonly db: JobFlowDatabase) {}

  applications() {
    return this.db
      .select({
        id: applications.id,
        direction: applications.direction,
        channel: applications.channel,
        status: applications.status,
        applicationDate: applications.applicationDate,
        finalResult: applications.finalResult,
        createdAt: applications.createdAt
      })
      .from(applications)
      .all()
  }

  interviews() {
    return this.db
      .select({
        applicationId: interviews.applicationId,
        round: interviews.round
      })
      .from(interviews)
      .all()
  }

  events() {
    return this.db
      .select({
        applicationId: applicationEvents.applicationId,
        eventType: applicationEvents.eventType,
        newValue: applicationEvents.newValue,
        createdAt: applicationEvents.createdAt
      })
      .from(applicationEvents)
      .orderBy(asc(applicationEvents.createdAt))
      .all()
  }
}
