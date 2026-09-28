import { ipcMain } from 'electron'
import {
  applicationPriorities,
  applicationRecruitmentTypes,
  applicationStatuses,
  type ApplicationPatch,
  type CreateApplicationRequest
} from '../../../src/shared/application'
import { getAppDatabase } from '../db'
import { ApplicationService } from '../services/applications'

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

  if ('recruitmentType' in input) {
    if (
      typeof input.recruitmentType !== 'string' ||
      !applicationRecruitmentTypes.includes(
        input.recruitmentType as (typeof applicationRecruitmentTypes)[number]
      )
    ) {
      throw new Error('Invalid recruitment type.')
    }
    patch.recruitmentType = input.recruitmentType
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
  const recruitmentType = input.recruitmentType ?? '校招'

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

  if (
    typeof recruitmentType !== 'string' ||
    !applicationRecruitmentTypes.includes(
      recruitmentType as (typeof applicationRecruitmentTypes)[number]
    )
  ) {
    throw new Error('Invalid recruitment type.')
  }

  return {
    companyName: requiredString(input.companyName, 'Company'),
    jobTitle: requiredString(input.jobTitle, 'Job title'),
    priority,
    status,
    recruitmentType,
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

function service(): ApplicationService {
  return new ApplicationService(getAppDatabase().db)
}

export function registerApplicationIpc(): void {
  ipcMain.handle('jobflow:applications:list', () => service().list())

  ipcMain.handle('jobflow:applications:get', (_event, id: unknown) => {
    if (typeof id !== 'string' || !id) throw new Error('Invalid application id.')
    return service().get(id)
  })

  ipcMain.handle('jobflow:applications:events', (_event, id: unknown) => {
    if (typeof id !== 'string' || !id) throw new Error('Invalid application id.')
    return service().listEvents(id)
  })

  ipcMain.handle('jobflow:applications:create', (_event, value: unknown) => {
    return service().create(sanitizeCreateRequest(value))
  })

  ipcMain.handle('jobflow:applications:update', (_event, id: unknown, value: unknown) => {
    if (typeof id !== 'string' || !id) {
      throw new Error('Invalid application id.')
    }
    return service().update(id, sanitizePatch(value))
  })

  ipcMain.handle('jobflow:applications:delete', (_event, id: unknown) => {
    if (typeof id !== 'string' || !id) {
      throw new Error('Invalid application id.')
    }
    service().delete(id)
  })
}
