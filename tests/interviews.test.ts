import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ApplicationRepository,
  CompanyRepository,
  EventRepository,
  createDatabase
} from '../electron/main/db'
import { InterviewService } from '../electron/main/services/interviews'

const tempDirs: string[] = []

function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'jobflow-interview-'))
  tempDirs.push(directory)
  const context = createDatabase(join(directory, 'test.db'))
  const companies = new CompanyRepository(context.db)
  const applications = new ApplicationRepository(context.db)
  const company = companies.create({ name: '字节跳动' })
  const application = applications.create({
    companyId: company.id,
    jobTitle: 'AI Agent Engineer',
    status: '面试中'
  })

  return { context, application }
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('interview service', () => {
  it('creates, updates and deletes interviews with timeline events', () => {
    const { context, application } = setup()
    const service = new InterviewService(context.db)
    const events = new EventRepository(context.db)

    const created = service.create({
      applicationId: application.id,
      round: '一面',
      scheduledAt: '2026-10-01T10:00:00.000Z',
      format: '线上视频',
      result: '待面'
    })

    expect(created.companyName).toBe('字节跳动')
    expect(service.list()).toHaveLength(1)
    expect(events.listByApplication(application.id)[0]?.eventType).toBe('INTERVIEW_CREATED')

    const updated = service.update(created.id, {
      result: '通过',
      mainQuestions: 'RAG 与 Agent Memory',
      selfRating: 4,
      improvements: '补强评测指标'
    })

    expect(updated.result).toBe('通过')
    expect(updated.mainQuestions).toBe('RAG 与 Agent Memory')
    expect(updated.selfRating).toBe(4)
    expect(events.listByApplication(application.id)[0]?.eventType).toBe('INTERVIEW_UPDATED')

    service.delete(created.id)
    expect(service.list()).toHaveLength(0)
    expect(events.listByApplication(application.id)[0]?.title).toBe('面试已删除')

    context.sqlite.close()
  })
})
