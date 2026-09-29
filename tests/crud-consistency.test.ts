import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createDatabase, EventRepository, InterviewRepository } from '../electron/main/db'
import { ApplicationService } from '../electron/main/services/applications'
import { InterviewService } from '../electron/main/services/interviews'
import { SettingsService } from '../electron/main/services/settings'

const tempDirs: string[] = []

function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'jobflow-crud-'))
  tempDirs.push(directory)
  const context = createDatabase(join(directory, 'jobflow.db'))
  return {
    context,
    applications: new ApplicationService(context.db),
    interviews: new InterviewService(context.db),
    settings: new SettingsService(context.db, join(directory, 'jobflow.db'))
  }
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('CRUD consistency across database and UI-facing services', () => {
  it('keeps application create/update/delete consistent and cascades dependent rows', () => {
    const { context, applications, interviews } = setup()

    const created = applications.create({
      companyName: 'Consistency Labs',
      jobTitle: 'Agent Engineer',
      direction: 'Agent Infra',
      recruitmentType: '实习',
      channel: '校园官网',
      status: '已投递'
    })

    expect(applications.list().find((item) => item.id === created.id)).toMatchObject({
      direction: 'Agent Infra',
      recruitmentType: '实习',
      channel: '校园官网',
      status: '已投递'
    })

    const updated = applications.update(created.id, {
      status: '面试中',
      stage: '一面待面',
      nextAction: '准备系统设计',
      nextActionDate: '2026-10-03'
    })

    expect(updated).toMatchObject({
      status: '面试中',
      stage: '一面待面',
      nextAction: '准备系统设计',
      nextActionDate: '2026-10-03'
    })
    expect(applications.listEvents(created.id).some((event) => event.eventType === 'STATUS_CHANGED')).toBe(true)
    expect(applications.listEvents(created.id).some((event) => event.eventType === 'STAGE_CHANGED')).toBe(true)

    const interview = interviews.create({
      applicationId: created.id,
      round: '一面',
      scheduledAt: '2026-10-03T02:00:00.000Z',
      format: '线上视频',
      result: '待面'
    })
    expect(interviews.get(interview.id).applicationId).toBe(created.id)

    applications.delete(created.id)

    expect(() => applications.get(created.id)).toThrow('Application not found.')
    expect(new InterviewRepository(context.db).getById(interview.id)).toBeUndefined()
    expect(new EventRepository(context.db).listByApplication(created.id)).toHaveLength(0)

    context.sqlite.close()
  })

  it('keeps interview updates visible and records deletion in the parent timeline', () => {
    const { context, applications, interviews } = setup()
    const application = applications.create({
      companyName: 'Flow Labs',
      jobTitle: 'LLM Engineer',
      status: '面试中'
    })

    const created = interviews.create({
      applicationId: application.id,
      round: '一面',
      scheduledAt: '2026-10-05T03:00:00.000Z',
      result: '待面'
    })

    const updated = interviews.update(created.id, {
      result: '通过',
      selfRating: 5,
      mainQuestions: 'RAG evaluation'
    })

    expect(updated).toMatchObject({
      result: '通过',
      selfRating: 5,
      mainQuestions: 'RAG evaluation'
    })
    expect(interviews.list().find((item) => item.id === created.id)?.result).toBe('通过')

    interviews.delete(created.id)
    expect(interviews.list().some((item) => item.id === created.id)).toBe(false)
    expect(applications.listEvents(application.id)[0]?.title).toBe('面试已删除')

    context.sqlite.close()
  })

  it('removing configurable options does not corrupt historical application values', () => {
    const { context, applications, settings } = setup()

    settings.update({
      directions: ['AI Agent', 'Agent Infra'],
      channels: ['官网', '校园官网']
    })
    const application = applications.create({
      companyName: 'History Labs',
      jobTitle: 'Agent Engineer',
      direction: 'Agent Infra',
      channel: '校园官网'
    })

    settings.update({
      directions: ['AI Agent'],
      channels: ['官网']
    })

    expect(settings.get()).toMatchObject({
      directions: ['AI Agent'],
      channels: ['官网']
    })
    expect(applications.get(application.id)).toMatchObject({
      direction: 'Agent Infra',
      channel: '校园官网'
    })

    context.sqlite.close()
  })
})
