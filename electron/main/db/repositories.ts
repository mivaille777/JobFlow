import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import type { JobFlowDatabase } from './client'
import {
  applicationEvents,
  applications,
  companies,
  interviews,
  settings
} from './schema'

const now = () => new Date().toISOString()

export interface CreateApplicationInput {
  companyId: string
  jobTitle: string
  direction?: string | null
  location?: string | null
  priority?: string
  status?: string
  stage?: string | null
  jobUrl?: string | null
  jobId?: string | null
  channel?: string | null
  referral?: string | null
  resumeVersion?: string | null
  applicationDate?: string | null
  nextAction?: string | null
  nextActionDate?: string | null
  lastProgressAt?: string | null
  finalResult?: string | null
  notes?: string | null
}

export class CompanyRepository {
  constructor(private readonly db: JobFlowDatabase) {}

  create(input: { name: string; website?: string | null }) {
    const timestamp = now()
    const row = {
      id: randomUUID(),
      name: input.name,
      website: input.website ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    this.db.insert(companies).values(row).run()
    return row
  }

  getById(id: string) {
    return this.db.select().from(companies).where(eq(companies.id, id)).get()
  }

  list() {
    return this.db.select().from(companies).all()
  }
}

export class ApplicationRepository {
  constructor(private readonly db: JobFlowDatabase) {}

  create(input: CreateApplicationInput) {
    const timestamp = now()
    const row = {
      id: randomUUID(),
      companyId: input.companyId,
      jobTitle: input.jobTitle,
      direction: input.direction ?? null,
      location: input.location ?? null,
      priority: input.priority ?? 'A',
      status: input.status ?? '待投递',
      stage: input.stage ?? null,
      jobUrl: input.jobUrl ?? null,
      jobId: input.jobId ?? null,
      channel: input.channel ?? null,
      referral: input.referral ?? null,
      resumeVersion: input.resumeVersion ?? null,
      applicationDate: input.applicationDate ?? null,
      nextAction: input.nextAction ?? null,
      nextActionDate: input.nextActionDate ?? null,
      lastProgressAt: input.lastProgressAt ?? timestamp,
      finalResult: input.finalResult ?? null,
      notes: input.notes ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    this.db.insert(applications).values(row).run()
    return row
  }

  getById(id: string) {
    return this.db.select().from(applications).where(eq(applications.id, id)).get()
  }

  getWithCompany(id: string) {
    return this.db
      .select({
        id: applications.id,
        companyId: applications.companyId,
        companyName: companies.name,
        jobTitle: applications.jobTitle,
        direction: applications.direction,
        location: applications.location,
        priority: applications.priority,
        status: applications.status,
        stage: applications.stage,
        nextAction: applications.nextAction,
        nextActionDate: applications.nextActionDate,
        applicationDate: applications.applicationDate,
        lastProgressAt: applications.lastProgressAt,
        updatedAt: applications.updatedAt
      })
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(applications.id, id))
      .get()
  }

  list() {
    return this.db.select().from(applications).orderBy(desc(applications.updatedAt)).all()
  }

  listWithCompany() {
    return this.db
      .select({
        id: applications.id,
        companyId: applications.companyId,
        companyName: companies.name,
        jobTitle: applications.jobTitle,
        direction: applications.direction,
        location: applications.location,
        priority: applications.priority,
        status: applications.status,
        stage: applications.stage,
        nextAction: applications.nextAction,
        nextActionDate: applications.nextActionDate,
        applicationDate: applications.applicationDate,
        lastProgressAt: applications.lastProgressAt,
        updatedAt: applications.updatedAt
      })
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .orderBy(desc(applications.updatedAt))
      .all()
  }

  update(
    id: string,
    changes: Partial<Omit<CreateApplicationInput, 'companyId' | 'jobTitle'>> & {
      companyId?: string
      jobTitle?: string
    }
  ) {
    this.db
      .update(applications)
      .set({ ...changes, updatedAt: now() })
      .where(eq(applications.id, id))
      .run()
    return this.getById(id)
  }

  delete(id: string) {
    return this.db.delete(applications).where(eq(applications.id, id)).run()
  }
}

export class EventRepository {
  constructor(private readonly db: JobFlowDatabase) {}

  create(input: {
    applicationId: string
    eventType: string
    title: string
    oldValue?: string | null
    newValue?: string | null
    description?: string | null
  }) {
    const row = {
      id: randomUUID(),
      applicationId: input.applicationId,
      eventType: input.eventType,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      title: input.title,
      description: input.description ?? null,
      createdAt: now()
    }
    this.db.insert(applicationEvents).values(row).run()
    return row
  }

  listByApplication(applicationId: string) {
    return this.db
      .select()
      .from(applicationEvents)
      .where(eq(applicationEvents.applicationId, applicationId))
      .orderBy(desc(applicationEvents.createdAt))
      .all()
  }
}

export class InterviewRepository {
  constructor(private readonly db: JobFlowDatabase) {}

  create(input: {
    applicationId: string
    round: string
    scheduledAt: string
    format?: string | null
    interviewer?: string | null
    department?: string | null
    durationMinutes?: number | null
    result?: string | null
  }) {
    const timestamp = now()
    const row = {
      id: randomUUID(),
      applicationId: input.applicationId,
      round: input.round,
      scheduledAt: input.scheduledAt,
      format: input.format ?? null,
      interviewer: input.interviewer ?? null,
      department: input.department ?? null,
      durationMinutes: input.durationMinutes ?? null,
      result: input.result ?? null,
      mainQuestions: null,
      codingQuestions: null,
      projectQuestions: null,
      selfRating: null,
      improvements: null,
      nextRoundFocus: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    this.db.insert(interviews).values(row).run()
    return row
  }

  listByApplication(applicationId: string) {
    return this.db
      .select()
      .from(interviews)
      .where(eq(interviews.applicationId, applicationId))
      .orderBy(interviews.scheduledAt)
      .all()
  }

  delete(id: string) {
    return this.db.delete(interviews).where(eq(interviews.id, id)).run()
  }
}

export class SettingsRepository {
  constructor(private readonly db: JobFlowDatabase) {}

  get(key: string) {
    return this.db.select().from(settings).where(eq(settings.key, key)).get()
  }

  set(key: string, value: string) {
    const existing = this.get(key)
    const timestamp = now()

    if (existing) {
      this.db
        .update(settings)
        .set({ value, updatedAt: timestamp })
        .where(eq(settings.key, key))
        .run()
    } else {
      this.db.insert(settings).values({ key, value, updatedAt: timestamp }).run()
    }

    return this.get(key)
  }
}
