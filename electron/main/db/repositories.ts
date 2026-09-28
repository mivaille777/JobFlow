import { randomUUID } from 'node:crypto'
import { asc, desc, eq } from 'drizzle-orm'
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
  recruitmentType?: string
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

export interface UpdateInterviewInput {
  round?: string
  scheduledAt?: string
  format?: string | null
  interviewer?: string | null
  department?: string | null
  durationMinutes?: number | null
  result?: string | null
  mainQuestions?: string | null
  codingQuestions?: string | null
  projectQuestions?: string | null
  selfRating?: number | null
  improvements?: string | null
  nextRoundFocus?: string | null
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

  findByName(name: string) {
    return this.db.select().from(companies).where(eq(companies.name, name)).get()
  }

  list() {
    return this.db.select().from(companies).all()
  }
}

const applicationListSelection = {
  id: applications.id,
  companyId: applications.companyId,
  companyName: companies.name,
  jobTitle: applications.jobTitle,
  direction: applications.direction,
  recruitmentType: applications.recruitmentType,
  location: applications.location,
  priority: applications.priority,
  status: applications.status,
  stage: applications.stage,
  channel: applications.channel,
  nextAction: applications.nextAction,
  nextActionDate: applications.nextActionDate,
  applicationDate: applications.applicationDate,
  lastProgressAt: applications.lastProgressAt,
  updatedAt: applications.updatedAt
}

const applicationDetailSelection = {
  ...applicationListSelection,
  jobUrl: applications.jobUrl,
  jobId: applications.jobId,
  referral: applications.referral,
  resumeVersion: applications.resumeVersion,
  finalResult: applications.finalResult,
  notes: applications.notes,
  createdAt: applications.createdAt
}

const recentEventSelection = {
  id: applicationEvents.id,
  applicationId: applicationEvents.applicationId,
  companyName: companies.name,
  jobTitle: applications.jobTitle,
  eventType: applicationEvents.eventType,
  title: applicationEvents.title,
  description: applicationEvents.description,
  createdAt: applicationEvents.createdAt
}

const interviewDetailSelection = {
  id: interviews.id,
  applicationId: interviews.applicationId,
  companyName: companies.name,
  jobTitle: applications.jobTitle,
  round: interviews.round,
  scheduledAt: interviews.scheduledAt,
  format: interviews.format,
  interviewer: interviews.interviewer,
  department: interviews.department,
  durationMinutes: interviews.durationMinutes,
  result: interviews.result,
  mainQuestions: interviews.mainQuestions,
  codingQuestions: interviews.codingQuestions,
  projectQuestions: interviews.projectQuestions,
  selfRating: interviews.selfRating,
  improvements: interviews.improvements,
  nextRoundFocus: interviews.nextRoundFocus,
  createdAt: interviews.createdAt,
  updatedAt: interviews.updatedAt
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
      recruitmentType: input.recruitmentType ?? '校招',
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
      .select(applicationListSelection)
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(applications.id, id))
      .get()
  }

  getDetailWithCompany(id: string) {
    return this.db
      .select(applicationDetailSelection)
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
      .select(applicationListSelection)
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

  listRecentWithApplication(limit = 10) {
    return this.db
      .select(recentEventSelection)
      .from(applicationEvents)
      .innerJoin(applications, eq(applicationEvents.applicationId, applications.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .orderBy(desc(applicationEvents.createdAt))
      .limit(limit)
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

  getById(id: string) {
    return this.db.select().from(interviews).where(eq(interviews.id, id)).get()
  }

  getWithApplication(id: string) {
    return this.db
      .select(interviewDetailSelection)
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(interviews.id, id))
      .get()
  }

  listByApplication(applicationId: string) {
    return this.db
      .select()
      .from(interviews)
      .where(eq(interviews.applicationId, applicationId))
      .orderBy(interviews.scheduledAt)
      .all()
  }

  listWithApplication() {
    return this.db
      .select(interviewDetailSelection)
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .orderBy(asc(interviews.scheduledAt))
      .all()
  }

  update(id: string, changes: UpdateInterviewInput) {
    this.db
      .update(interviews)
      .set({ ...changes, updatedAt: now() })
      .where(eq(interviews.id, id))
      .run()
    return this.getById(id)
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
