import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ApplicationRepository,
  CompanyRepository,
  createDatabase
} from '../electron/main/db'

const tempDirs: string[] = []

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('ApplicationRepository', () => {
  it('creates, reads, updates and deletes a persisted application', () => {
    const directory = mkdtempSync(join(tmpdir(), 'jobflow-application-repo-'))
    tempDirs.push(directory)
    const context = createDatabase(join(directory, 'test.db'))
    const companies = new CompanyRepository(context.db)
    const applications = new ApplicationRepository(context.db)

    const company = companies.create({ name: 'Repository Labs' })
    const created = applications.create({
      companyId: company.id,
      jobTitle: 'Agent Engineer',
      priority: 'S',
      status: '已投递',
      direction: 'AI Agent'
    })

    expect(applications.getById(created.id)).toMatchObject({
      jobTitle: 'Agent Engineer',
      priority: 'S',
      status: '已投递'
    })
    expect(applications.getDetailWithCompany(created.id)?.companyName).toBe('Repository Labs')

    applications.update(created.id, {
      status: '面试中',
      stage: '一面'
    })
    expect(applications.getById(created.id)).toMatchObject({
      status: '面试中',
      stage: '一面'
    })

    applications.delete(created.id)
    expect(applications.getById(created.id)).toBeUndefined()

    context.sqlite.close()
  })
})
