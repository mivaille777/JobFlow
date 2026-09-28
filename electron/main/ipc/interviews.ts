import { ipcMain } from 'electron'
import {
  interviewFormats,
  interviewResults,
  interviewRounds,
  type CreateInterviewRequest,
  type InterviewPatch
} from '../../../src/shared/interview'
import { getAppDatabase } from '../db'
import { InterviewService } from '../services/interviews'

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required.`)
  }
  return value.trim()
}

function optionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') throw new Error(`Invalid ${field}.`)
  const trimmed = value.trim()
  return trimmed || null
}

function validDate(value: unknown, field: string): string {
  const text = requiredString(value, field)
  if (Number.isNaN(Date.parse(text))) throw new Error(`Invalid ${field}.`)
  return text
}

function optionalInteger(
  value: unknown,
  field: string,
  min: number,
  max: number
): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid ${field}.`)
  }
  return value
}

function enumString(
  value: unknown,
  field: string,
  values: readonly string[],
  required = false
): string | null | undefined {
  if (value === undefined && !required) return undefined
  if (value === null && !required) return null
  if (typeof value !== 'string' || !values.includes(value)) {
    throw new Error(`Invalid ${field}.`)
  }
  return value
}

function sanitizeCreate(value: unknown): CreateInterviewRequest {
  if (!value || typeof value !== 'object') throw new Error('Invalid interview request.')
  const input = value as Record<string, unknown>

  return {
    applicationId: requiredString(input.applicationId, 'Application'),
    round: enumString(input.round, 'round', interviewRounds, true)!,
    scheduledAt: validDate(input.scheduledAt, 'scheduledAt'),
    format: enumString(input.format, 'format', interviewFormats),
    interviewer: optionalString(input.interviewer, 'interviewer'),
    department: optionalString(input.department, 'department'),
    durationMinutes: optionalInteger(input.durationMinutes, 'durationMinutes', 1, 1440),
    result: enumString(input.result ?? '待面', 'result', interviewResults)
  }
}

function sanitizePatch(value: unknown): InterviewPatch {
  if (!value || typeof value !== 'object') throw new Error('Invalid interview patch.')
  const input = value as Record<string, unknown>
  const patch: InterviewPatch = {}

  if ('round' in input) patch.round = enumString(input.round, 'round', interviewRounds, true)!
  if ('scheduledAt' in input) patch.scheduledAt = validDate(input.scheduledAt, 'scheduledAt')
  if ('format' in input) patch.format = enumString(input.format, 'format', interviewFormats)
  if ('result' in input) patch.result = enumString(input.result, 'result', interviewResults)
  if ('durationMinutes' in input) {
    patch.durationMinutes = optionalInteger(input.durationMinutes, 'durationMinutes', 1, 1440)
  }
  if ('selfRating' in input) {
    patch.selfRating = optionalInteger(input.selfRating, 'selfRating', 1, 5)
  }

  const textFields = [
    'interviewer',
    'department',
    'mainQuestions',
    'codingQuestions',
    'projectQuestions',
    'improvements',
    'nextRoundFocus'
  ] as const

  for (const field of textFields) {
    if (field in input) {
      const cleaned = optionalString(input[field], field)
      patch[field] = cleaned === undefined ? null : cleaned
    }
  }

  return patch
}

function service(): InterviewService {
  return new InterviewService(getAppDatabase().db)
}

export function registerInterviewIpc(): void {
  ipcMain.handle('jobflow:interviews:list', () => service().list())

  ipcMain.handle('jobflow:interviews:get', (_event, id: unknown) => {
    return service().get(requiredString(id, 'Interview id'))
  })

  ipcMain.handle('jobflow:interviews:create', (_event, input: unknown) => {
    return service().create(sanitizeCreate(input))
  })

  ipcMain.handle('jobflow:interviews:update', (_event, id: unknown, patch: unknown) => {
    return service().update(requiredString(id, 'Interview id'), sanitizePatch(patch))
  })

  ipcMain.handle('jobflow:interviews:delete', (_event, id: unknown) => {
    service().delete(requiredString(id, 'Interview id'))
  })
}
