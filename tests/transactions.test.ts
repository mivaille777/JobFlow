import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  CompanyRepository,
  createDatabase,
  runInTransaction
} from '../electron/main/db'

const tempDirs: string[] = []

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('database transactions', () => {
  it('rolls back grouped writes when a later write fails', () => {
    const directory = mkdtempSync(join(tmpdir(), 'jobflow-transaction-'))
    tempDirs.push(directory)
    const context = createDatabase(join(directory, 'test.db'))

    expect(() =>
      runInTransaction(context.db, (transactionDb) => {
        new CompanyRepository(transactionDb).create({ name: 'Should Roll Back' })
        throw new Error('simulated write failure')
      })
    ).toThrow('simulated write failure')

    expect(new CompanyRepository(context.db).list()).toHaveLength(0)
    context.sqlite.close()
  })
})
