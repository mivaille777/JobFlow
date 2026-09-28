import type { JobFlowDatabase } from './client'

type SyncTransaction = <T>(work: (transaction: unknown) => T) => T

export function runInTransaction<T>(
  db: JobFlowDatabase,
  work: (transactionDb: JobFlowDatabase) => T
): T {
  const transaction = db.transaction.bind(db) as unknown as SyncTransaction
  return transaction((tx) => work(tx as JobFlowDatabase))
}
