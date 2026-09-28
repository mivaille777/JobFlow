import { ipcMain } from 'electron'
import {
  applicationPriorities,
  applicationStatuses,
  type ApplicationPatch,
  type CreateApplicationRequest
} from '../../../src/shared/application'
import {
  ApplicationRepository,
  CompanyRepository,
  getAppDatabase
} from '../db'

function optionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') throw new Error(`Invalid ${field}.`)
  const trimmed = value.trim()
  return trimmed || null
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required.`)
  }
  return value.trim()
}

function sanitizePatch(value: unknown): ApplicationPatch {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid application patch.')
  }

  const input = value as Record<string, unknown>
  const patch: ApplicationPatch = {}

  if ('priority' in input) {
    if (
      typeof input.priority !== 'string' ||
      !applicationPriorities.includes(input.priority as (typeof applicationPriorities)[number])
    ) {
      throw new Error('Invalid priority.')
    }
    patch.priority = input.priority
  }

  if ('status' in input) {
    if (
      typeof input.status !== 'string' ||
      !applicationStatuses.includes(input.status as (typeof applicationStatuses)[number])
    ) {
      throw new Error('Invalid status.')
    }
    patch.status = input.status
  }

  const nullableFields = [
    'stage',
    'nextAction',
    'nextActionDate',
    'direction',
    'location',
    'jobUrl',
    'jobId',
    'channel',
    'referral',
    'resumeVersion',
    'applicationDate',
    'finalResult',
    'notes'
  ] as const

  for (const field of nullableFields) {
    if (field in input) {
      const cleaned = optionalString(input[field], field)
      patch[field] = cleaned === undefined ? null : cleaned
    }
  }

  return patch
}

function sanitizeCreateRequest(value: unknown): CreateApplicationRequest {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid application request.')
  }

  const input = value as Record<string, unknown>
  const priority = input.priority ?? 'A'
  const status = input.status ?? '待投递'

  if (
    typeof priority !== 'string' ||
    !applicationPriorities.includes(priority as (typeof applicationPriorities)[number])
  ) {
    throw new Error('Invalid priority.')
  }

  if (
    typeof status !== 'string' ||
    !applicationStatuses.includes(status as (typeof applicationStatuses)[number])
  ) {
    throw new Error('Invalid status.')
  }

  return {
    companyName: requiredString(input.companyName, 'Company'),
    jobTitle: requiredString(input.jobTitle, 'Job title'),
    priority,
    status,
    direction: optionalString(input.direction, 'direction'),
    location: optionalString(input.location, 'location'),
    jobUrl: optionalString(input.jobUrl, 'jobUrl'),
    jobId: optionalString(input.jobId, 'jobId'),
    channel: optionalString(input.channel, 'channel'),
    referral: optionalString(input.referral, 'referral'),
    resumeVersion: optionalString(input.resumeVersion, 'resumeVersion'),
    applicationDate: optionalString(input.applicationDate, 'applicationDate'),
    notes: optionalString(input.notes, 'notes')
  }
}

export function registerApplicationIpc(): void {
  ipcMain.handle('jobflow:applications:list', () => {
    const repository = new ApplicationRepository(getAppDatabase().db)
    return repository.listWithCompany()
  })

  ipcMain.handle('jobflow:applications:get', (_event, id: unknown) => {
    if (typeof id !== 'string' || !id) throw new Error('Invalid application id.')
    const repository = new ApplicationRepository(getAppDatabase().db)
    const application = repository.getDetailWithCompany(id)
    if (!application) throw new Error('Application not found.')
    return application
  })

  ipcMain.handle('jobflow:applications:create', (_event, value: unknown) => {
    const input = sanitizeCreateRequest(value)
    const context = getAppDatabase()
    const companies = new CompanyRepository(context.db)
    const applications = new ApplicationRepository(context.db)

    const company =
      companies.findByName(input.companyName) ??
      companies.create({ name: input.companyName })

    const application = applications.create({
      companyId: company.id,
      jobTitle: input.jobTitle,
      direction: input.direction,
      location: input.location,
      priority: input.priority,
      status: input.status,
      jobUrl: input.jobUrl,
      jobId: input.jobId,
      channel: input.channel,
      referral: input.referral,
      resumeVersion: input.resumeVersion,
      applicationDate: input.applicationDate,
      notes: input.notes
    })

    return applications.getDetailWithCompany(application.id)
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

    const updated = repository.getDetailWithCompany(id)
    if (!updated) throw new Error('Application not found.')
    return updated
  })
}
