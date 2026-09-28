import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ApplicationRepository,
  CompanyRepository,
  EventRepository,
  InterviewRepository,
  SettingsRepository,
  createDatabase
} from '../electron/main/db'

const tempDirs: string[] = []

function createTestContext() {
  const directory = mkdtempSync(join(tmpdir(), 'jobflow-'))
  tempDirs.push(directory)
  return createDatabase(join(directory, 'test.db'))
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('database', () => {
  it('applies migrations idempotently', () => {
    const context = createTestContext()
    const rows = context.sqlite
      .prepare('SELECT version, name FROM schema_migrations ORDER BY version')
      .all() as Array<{ version: number; name: string }>

    expect(rows).toEqual([{ version: 1, name: 'initial_schema' }])

    context.sqlite.close()

    const reopened = createDatabase(join(tempDirs.at(-1)!, 'test.db'))
    const count = reopened.sqlite
      .prepare('SELECT COUNT(*) AS count FROM schema_migrations')
      .get() as { count: number }

    expect(count.count).toBe(1)
    reopened.sqlite.close()
  })

  it('supports application CRUD and related repositories', () => {
    const context = createTestContext()
    const companies = new CompanyRepository(context.db)
    const applications = new ApplicationRepository(context.db)
    const events = new EventRepository(context.db)
    const interviews = new InterviewRepository(context.db)
    const settings = new SettingsRepository(context.db)

    const company = companies.create({ name: 'JobFlow Labs' })
    const application = applications.create({
      companyId: company.id,
      jobTitle: 'AI Agent Engineer',
      direction: 'AI Agent',
      priority: 'S',
      status: '已投递',
      channel: '内推'
    })

    expect(applications.getById(application.id)?.jobTitle).toBe('AI Agent Engineer')

    const listItem = applications.listWithCompany()[0]
    expect(listItem).toMatchObject({
      id: application.id,
      companyName: 'JobFlow Labs',
      channel: '内推'
    })

    const updated = applications.update(application.id, {
      status: '面试中',
      stage: '一面待面'
    })
    expect(updated?.status).toBe('面试中')
    expect(applications.getWithCompany(application.id)?.stage).toBe('一面待面')

    events.create({
      applicationId: application.id,
      eventType: 'STATUS_CHANGED',
      title: '状态更新',
      oldValue: '已投递',
      newValue: '面试中'
    })
    expect(events.listByApplication(application.id)).toHaveLength(1)

    interviews.create({
      applicationId: application.id,
      round: '一面',
      scheduledAt: '2026-10-01T10:00:00.000Z'
    })
    expect(interviews.listByApplication(application.id)).toHaveLength(1)

    settings.set('theme', 'dark')
    expect(settings.get('theme')?.value).toBe('dark')

    applications.delete(application.id)
    expect(applications.getById(application.id)).toBeUndefined()
    expect(events.listByApplication(application.id)).toHaveLength(0)
    expect(interviews.listByApplication(application.id)).toHaveLength(0)

    context.sqlite.close()
  })
})
