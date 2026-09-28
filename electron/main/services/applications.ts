import type {
  ApplicationPatch,
  CreateApplicationRequest
} from '../../../src/shared/application'
import type { JobFlowDatabase } from '../db/client'
import {
  ApplicationRepository,
  CompanyRepository,
  EventRepository
} from '../db/repositories'
import { runInTransaction } from '../db/transaction'

export class ApplicationService {
  private readonly companies: CompanyRepository
  private readonly applications: ApplicationRepository
  private readonly events: EventRepository

  constructor(private readonly db: JobFlowDatabase) {
    this.companies = new CompanyRepository(db)
    this.applications = new ApplicationRepository(db)
    this.events = new EventRepository(db)
  }

  list() {
    return this.applications.listWithCompany()
  }

  get(id: string) {
    const application = this.applications.getDetailWithCompany(id)
    if (!application) throw new Error('Application not found.')
    return application
  }

  listEvents(id: string) {
    this.get(id)
    return this.events.listByApplication(id)
  }

  create(input: CreateApplicationRequest) {
    const applicationId = runInTransaction(this.db, (transactionDb) => {
      const companies = new CompanyRepository(transactionDb)
      const applications = new ApplicationRepository(transactionDb)
      const events = new EventRepository(transactionDb)

      const company =
        companies.findByName(input.companyName) ??
        companies.create({ name: input.companyName })

      const application = applications.create({
        companyId: company.id,
        jobTitle: input.jobTitle,
        direction: input.direction,
        recruitmentType: input.recruitmentType,
        location: input.location,
        priority: input.priority,
        status: input.status,
        jobUrl: input.jobUrl,
        jobId: input.jobId,
        channel: input.channel,
        referral: input.referral,
        resumeVersion: input.resumeVersion,
        applicationDate: input.applicationDate,
        notes: input.notes
      })

      events.create({
        applicationId: application.id,
        eventType: 'CREATED',
        title: '创建岗位',
        newValue: application.status,
        description: `${company.name} · ${application.jobTitle}`
      })

      return application.id
    })

    return this.get(applicationId)
  }

  delete(id: string) {
    runInTransaction(this.db, (transactionDb) => {
      const applications = new ApplicationRepository(transactionDb)
      if (!applications.getById(id)) throw new Error('Application not found.')
      applications.delete(id)
    })
  }

  update(id: string, patch: ApplicationPatch) {
    runInTransaction(this.db, (transactionDb) => {
      const applications = new ApplicationRepository(transactionDb)
      const events = new EventRepository(transactionDb)
      const before = applications.getById(id)
      if (!before) throw new Error('Application not found.')

      const progressChanged =
        patch.status !== undefined ||
        patch.stage !== undefined ||
        patch.finalResult !== undefined

      applications.update(id, {
        ...patch,
        ...(progressChanged ? { lastProgressAt: new Date().toISOString() } : {})
      })

      if (patch.status !== undefined && patch.status !== before.status) {
        events.create({
          applicationId: id,
          eventType: 'STATUS_CHANGED',
          title: '状态更新',
          oldValue: before.status,
          newValue: patch.status
        })
      }

      if (patch.stage !== undefined && patch.stage !== before.stage) {
        events.create({
          applicationId: id,
          eventType: 'STAGE_CHANGED',
          title: '节点更新',
          oldValue: before.stage,
          newValue: patch.stage
        })
      }

      if (patch.finalResult !== undefined && patch.finalResult !== before.finalResult) {
        events.create({
          applicationId: id,
          eventType: 'FINAL_RESULT_CHANGED',
          title: '最终结果更新',
          oldValue: before.finalResult,
          newValue: patch.finalResult
        })
      }
    })

    return this.get(id)
  }
}
