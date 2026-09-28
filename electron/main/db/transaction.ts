import type { JobFlowDatabase } from './client'

export function runInTransaction<T>(
  db: JobFlowDatabase,
  work: (transactionDb: JobFlowDatabase) => T
): T {
  return db.transaction((tx) => work(tx as unknown as JobFlowDatabase))
}
