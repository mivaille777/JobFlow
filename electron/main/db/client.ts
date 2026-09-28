import { drizzle } from 'drizzle-orm/node-sqlite'
import { DatabaseSync } from 'node:sqlite'
import { applyMigrations } from './migrations'
import { schema } from './schema'

function createDrizzleDatabase(sqlite: DatabaseSync) {
  return drizzle({ client: sqlite, schema })
}

export type JobFlowDatabase = ReturnType<typeof createDrizzleDatabase>

export interface DatabaseContext {
  sqlite: DatabaseSync
  db: JobFlowDatabase
}

export function createDatabase(path: string): DatabaseContext {
  const sqlite = new DatabaseSync(path)
  sqlite.exec('PRAGMA foreign_keys = ON;')
  sqlite.exec('PRAGMA journal_mode = WAL;')
  applyMigrations(sqlite)

  return {
    sqlite,
    db: createDrizzleDatabase(sqlite)
  }
}
