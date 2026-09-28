import { app } from 'electron'
import { join } from 'node:path'
import { createDatabase, type DatabaseContext } from './client'

let context: DatabaseContext | null = null

export function initializeAppDatabase(): DatabaseContext {
  if (context) return context

  const databasePath = join(app.getPath('userData'), 'jobflow.db')
  context = createDatabase(databasePath)
  return context
}

export function getAppDatabase(): DatabaseContext {
  if (!context) {
    throw new Error('JobFlow database has not been initialized.')
  }
  return context
}

export { createDatabase } from './client'
export * from './repositories'
export * from './schema'
