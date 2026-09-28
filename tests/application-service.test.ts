import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createDatabase } from '../electron/main/db'
import { ApplicationService } from '../electron/main/services/applications'

const tempDirs: string[] = []

function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'jobflow-service-'))
  tempDirs.push(directory)
  const context = createDatabase(join(directory, 'test.db'))
  return { context, service: new ApplicationService(context.db) }
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('ApplicationService timeline', () => {
  it('records creation and meaningful workflow changes', () => {
    const { context, service } = setup()

    const created = service.create({
      companyName: 'OpenAI Labs',
      jobTitle: 'AI Agent Engineer',
      priority: 'S',
      status: '已投递'
    })

    expect(service.listEvents(created.id).map((event) => event.eventType)).toEqual([
      'CREATED'
    ])

    service.update(created.id, { status: '面试中' })
    service.update(created.id, { stage: '一面待面' })
    service.update(created.id, { finalResult: 'Offer' })

    const events = service.listEvents(created.id)
    expect(new Set(events.map((event) => event.eventType))).toEqual(
      new Set(['CREATED', 'STATUS_CHANGED', 'STAGE_CHANGED', 'FINAL_RESULT_CHANGED'])
    )

    const statusEvent = events.find((event) => event.eventType === 'STATUS_CHANGED')
    expect(statusEvent).toMatchObject({
      oldValue: '已投递',
      newValue: '面试中',
      title: '状态更新'
    })

    context.sqlite.close()
  })

  it('does not create duplicate timeline events when workflow value is unchanged', () => {
    const { context, service } = setup()
    const created = service.create({
      companyName: 'vivo',
      jobTitle: 'LLM Algorithm Engineer',
      status: '已投递'
    })

    service.update(created.id, { status: '已投递' })
    expect(service.listEvents(created.id)).toHaveLength(1)

    context.sqlite.close()
  })

  it('deletes an application together with its timeline events', () => {
    const { context, service } = setup()
    const created = service.create({
      companyName: 'Delete Labs',
      jobTitle: 'Intern Agent',
      recruitmentType: '实习'
    })

    expect(service.listEvents(created.id)).toHaveLength(1)
    service.delete(created.id)

    expect(() => service.get(created.id)).toThrow('Application not found.')
    const eventCount = context.sqlite
      .prepare('SELECT COUNT(*) AS count FROM application_events WHERE application_id = ?')
      .get(created.id) as { count: number }
    expect(eventCount.count).toBe(0)
    context.sqlite.close()
  })

  it('reuses an existing company for quick additions', () => {
    const { context, service } = setup()

    service.create({ companyName: 'ByteDance', jobTitle: 'Agent Engineer' })
    service.create({ companyName: 'ByteDance', jobTitle: 'LLM Engineer' })

    const count = context.sqlite
      .prepare('SELECT COUNT(*) AS count FROM companies WHERE name = ?')
      .get('ByteDance') as { count: number }

    expect(count.count).toBe(1)
    context.sqlite.close()
  })
})
