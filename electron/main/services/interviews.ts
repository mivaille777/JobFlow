import type {
  CreateInterviewRequest,
  InterviewPatch
} from '../../../src/shared/interview'
import type { JobFlowDatabase } from '../db/client'
import {
  ApplicationRepository,
  EventRepository,
  InterviewRepository
} from '../db/repositories'
import { runInTransaction } from '../db/transaction'

function describeInterview(round: string, scheduledAt: string, result?: string | null): string {
  const date = new Date(scheduledAt)
  const when = Number.isNaN(date.getTime())
    ? scheduledAt
    : new Intl.DateTimeFormat('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)

  return result ? `${round} · ${when} · ${result}` : `${round} · ${when}`
}

export class InterviewService {
  private readonly applications: ApplicationRepository
  private readonly interviews: InterviewRepository
  private readonly events: EventRepository

  constructor(private readonly db: JobFlowDatabase) {
    this.applications = new ApplicationRepository(db)
    this.interviews = new InterviewRepository(db)
    this.events = new EventRepository(db)
  }

  list() {
    return this.interviews.listWithApplication()
  }

  get(id: string) {
    const interview = this.interviews.getWithApplication(id)
    if (!interview) throw new Error('Interview not found.')
    return interview
  }

  create(input: CreateInterviewRequest) {
    const interviewId = runInTransaction(this.db, (transactionDb) => {
      const applications = new ApplicationRepository(transactionDb)
      const interviews = new InterviewRepository(transactionDb)
      const events = new EventRepository(transactionDb)
      const application = applications.getById(input.applicationId)
      if (!application) throw new Error('Application not found.')

      const interview = interviews.create(input)

      events.create({
        applicationId: application.id,
        eventType: 'INTERVIEW_CREATED',
        title: `${interview.round}已安排`,
        newValue: interview.scheduledAt,
        description: describeInterview(interview.round, interview.scheduledAt, interview.result)
      })

      return interview.id
    })

    return this.get(interviewId)
  }

  update(id: string, patch: InterviewPatch) {
    runInTransaction(this.db, (transactionDb) => {
      const interviews = new InterviewRepository(transactionDb)
      const events = new EventRepository(transactionDb)
      const before = interviews.getById(id)
      if (!before) throw new Error('Interview not found.')

      const updated = interviews.update(id, patch)
      if (!updated) throw new Error('Interview not found.')

      const meaningfulChange =
        patch.round !== undefined ||
        patch.scheduledAt !== undefined ||
        patch.result !== undefined

      if (meaningfulChange) {
        events.create({
          applicationId: before.applicationId,
          eventType: 'INTERVIEW_UPDATED',
          title: '面试更新',
          oldValue: before.result,
          newValue: updated.result,
          description: describeInterview(updated.round, updated.scheduledAt, updated.result)
        })
      }
    })

    return this.get(id)
  }

  delete(id: string): void {
    runInTransaction(this.db, (transactionDb) => {
      const interviews = new InterviewRepository(transactionDb)
      const events = new EventRepository(transactionDb)
      const before = interviews.getById(id)
      if (!before) throw new Error('Interview not found.')

      interviews.delete(id)

      events.create({
        applicationId: before.applicationId,
        eventType: 'INTERVIEW_UPDATED',
        title: '面试已删除',
        oldValue: describeInterview(before.round, before.scheduledAt, before.result),
        description: before.round
      })
    })
  }
}
