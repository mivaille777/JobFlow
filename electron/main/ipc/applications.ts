import { ipcMain } from 'electron'
import type { ApplicationPatch } from '../../../src/shared/application'
import { ApplicationRepository, getAppDatabase } from '../db'

function sanitizePatch(value: unknown): ApplicationPatch {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid application patch.')
  }

  const input = value as Record<string, unknown>
  const patch: ApplicationPatch = {}

  if ('priority' in input) {
    if (typeof input.priority !== 'string') throw new Error('Invalid priority.')
    patch.priority = input.priority
  }

  if ('status' in input) {
    if (typeof input.status !== 'string') throw new Error('Invalid status.')
    patch.status = input.status
  }

  if ('stage' in input) {
    if (input.stage !== null && typeof input.stage !== 'string') {
      throw new Error('Invalid stage.')
    }
    patch.stage = input.stage as string | null
  }

  if ('nextActionDate' in input) {
    if (input.nextActionDate !== null && typeof input.nextActionDate !== 'string') {
      throw new Error('Invalid next action date.')
    }
    patch.nextActionDate = input.nextActionDate as string | null
  }

  return patch
}

export function registerApplicationIpc(): void {
  ipcMain.handle('jobflow:applications:list', () => {
    const repository = new ApplicationRepository(getAppDatabase().db)
    return repository.listWithCompany()
  })

  ipcMain.handle('jobflow:applications:update', (_event, id: unknown, value: unknown) => {
    if (typeof id !== 'string' || !id) {
      throw new Error('Invalid application id.')
    }

    const patch = sanitizePatch(value)
    const repository = new ApplicationRepository(getAppDatabase().db)
    const progressChanged = patch.status !== undefined || patch.stage !== undefined

    repository.update(id, {
      ...patch,
      ...(progressChanged ? { lastProgressAt: new Date().toISOString() } : {})
    })

    const updated = repository.getWithCompany(id)
    if (!updated) throw new Error('Application not found.')
    return updated
  })
}
