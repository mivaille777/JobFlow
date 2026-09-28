import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createDatabase } from '../electron/main/db'
import { ApplicationService } from '../electron/main/services/applications'
import { InterviewService } from '../electron/main/services/interviews'
import { TodayService } from '../electron/main/services/today'

const tempDirs: string[] = []

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'jobflow-integration-'))
  tempDirs.push(directory)
  const context = createDatabase(join(directory, 'test.db'))
  return {
    context,
    applications: new ApplicationService(context.db),
    interviews: new InterviewService(context.db),
    today: new TodayService(context.db)
  }
}

describe('JobFlow integration workflows', () => {
  it('creates an application, changes status and generates Timeline history', () => {
    const { context, applications } = setup()
    const created = applications.create({
      companyName: 'Integration Labs',
      jobTitle: 'Agent Engineer',
      status: '待投递'
    })

    applications.update(created.id, {
      status: '已投递',
      stage: '简历筛选'
    })

    const events = applications.listEvents(created.id)
    expect(events.map((event) => event.eventType)).toEqual(
      expect.arrayContaining(['CREATED', 'STATUS_CHANGED', 'STAGE_CHANGED'])
    )

    context.sqlite.close()
  })

  it('creates an interview and makes it appear on Today', () => {
    const { context, applications, interviews, today } = setup()
    const created = applications.create({
      companyName: 'Today Labs',
      jobTitle: 'RAG Engineer',
      status: '面试中'
    })
    const now = new Date(2026, 8, 28, 8, 0, 0, 0)
    const scheduledAt = new Date(2026, 8, 28, 11, 0, 0, 0).toISOString()

    interviews.create({
      applicationId: created.id,
      round: '一面',
      scheduledAt,
      format: '线上视频',
      result: '待面'
    })

    const dashboard = today.getDashboard(now)
    expect(dashboard.todayInterviews).toHaveLength(1)
    expect(dashboard.todayInterviews[0]).toMatchObject({
      applicationId: created.id,
      companyName: 'Today Labs',
      round: '一面'
    })

    context.sqlite.close()
  })

  it('updates Next Action and makes the Today task list react immediately', () => {
    const { context, applications, today } = setup()
    const created = applications.create({
      companyName: 'Action Labs',
      jobTitle: 'LLM Engineer',
      status: '已投递'
    })

    applications.update(created.id, {
      nextAction: '准备笔试',
      nextActionDate: '2026-09-28'
    })

    const dashboard = today.getDashboard(new Date(2026, 8, 28, 8, 0, 0, 0))
    expect(dashboard.todayActions.map((item) => item.id)).toContain(created.id)
    expect(dashboard.todayActions.find((item) => item.id === created.id)?.nextAction).toBe(
      '准备笔试'
    )

    context.sqlite.close()
  })
})
