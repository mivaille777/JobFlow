import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { JobFlowDatabase } from './client'
import {
  applicationEvents,
  applications,
  companies,
  interviews,
  settings
} from './schema'

export interface ImportedApplicationRow {
  companyName: string
  jobTitle: string
  direction: string | null
  recruitmentType: string
  location: string | null
  priority: string
  status: string
  stage: string | null
  batch: string | null
  jobUrl: string | null
  jobId: string | null
  channel: string | null
  referral: string | null
  resumeVersion: string | null
  applicationDate: string | null
  nextAction: string | null
  nextActionDate: string | null
  lastProgressAt: string | null
  finalResult: string | null
  notes: string | null
}

export type BackupData = {
  companies: Array<typeof companies.$inferSelect>
  applications: Array<typeof applications.$inferSelect>
  applicationEvents: Array<typeof applicationEvents.$inferSelect>
  interviews: Array<typeof interviews.$inferSelect>
  settings: Array<typeof settings.$inferSelect>
}

export class TransferRepository {
  constructor(private readonly db: JobFlowDatabase) {}

  listApplicationIdentities() {
    return this.db
      .select({
        companyName: companies.name,
        jobTitle: applications.jobTitle,
        jobId: applications.jobId
      })
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .all()
  }

  listApplicationsForExport() {
    return this.db
      .select({
        priority: applications.priority,
        companyName: companies.name,
        jobTitle: applications.jobTitle,
        direction: applications.direction,
        recruitmentType: applications.recruitmentType,
        location: applications.location,
        status: applications.status,
        stage: applications.stage,
        nextAction: applications.nextAction,
        nextActionDate: applications.nextActionDate,
        lastProgressAt: applications.lastProgressAt,
        applicationDate: applications.applicationDate,
        resumeVersion: applications.resumeVersion,
        batch: applications.batch,
        channel: applications.channel,
        referral: applications.referral,
        jobId: applications.jobId,
        jobUrl: applications.jobUrl,
        finalResult: applications.finalResult,
        notes: applications.notes
      })
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .all()
  }

  importApplication(input: ImportedApplicationRow) {
    const timestamp = new Date().toISOString()
    let company = this.db.select().from(companies).where(eq(companies.name, input.companyName)).get()

    if (!company) {
      company = {
        id: randomUUID(),
        name: input.companyName,
        website: null,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      this.db.insert(companies).values(company).run()
    }

    const row = {
      id: randomUUID(),
      companyId: company.id,
      jobTitle: input.jobTitle,
      direction: input.direction,
      recruitmentType: input.recruitmentType,
      location: input.location,
      priority: input.priority,
      status: input.status,
      stage: input.stage,
      batch: input.batch,
      jobUrl: input.jobUrl,
      jobId: input.jobId,
      channel: input.channel,
      referral: input.referral,
      resumeVersion: input.resumeVersion,
      applicationDate: input.applicationDate,
      nextAction: input.nextAction,
      nextActionDate: input.nextActionDate,
      lastProgressAt: input.lastProgressAt ?? timestamp,
      finalResult: input.finalResult,
      notes: input.notes,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    this.db.insert(applications).values(row).run()
    this.db.insert(applicationEvents).values({
      id: randomUUID(),
      applicationId: row.id,
      eventType: 'CREATED',
      oldValue: null,
      newValue: row.status,
      title: '从 Excel 导入',
      description: `${input.companyName} · ${input.jobTitle}`,
      createdAt: timestamp
    }).run()

    return row
  }

  dump(): BackupData {
    return {
      companies: this.db.select().from(companies).all(),
      applications: this.db.select().from(applications).all(),
      applicationEvents: this.db.select().from(applicationEvents).all(),
      interviews: this.db.select().from(interviews).all(),
      settings: this.db.select().from(settings).all()
    }
  }

  restore(data: BackupData): void {
    this.db.transaction((tx) => {
      tx.delete(applicationEvents).run()
      tx.delete(interviews).run()
      tx.delete(applications).run()
      tx.delete(companies).run()
      tx.delete(settings).run()

      if (data.companies.length) tx.insert(companies).values(data.companies).run()
      if (data.applications.length) tx.insert(applications).values(data.applications).run()
      if (data.applicationEvents.length) {
        tx.insert(applicationEvents).values(data.applicationEvents).run()
      }
      if (data.interviews.length) tx.insert(interviews).values(data.interviews).run()
      if (data.settings.length) tx.insert(settings).values(data.settings).run()
    })
  }
}
