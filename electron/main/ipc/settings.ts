import { app, ipcMain } from 'electron'
import { join } from 'node:path'
import {
  applicationPriorities,
  type ApplicationPriority
} from '../../../src/shared/application'
import {
  themePreferences,
  type JobFlowSettingsPatch,
  type ThemePreference
} from '../../../src/shared/settings'
import { getAppDatabase } from '../db'
import { SettingsService } from '../services/settings'

function service(): SettingsService {
  return new SettingsService(
    getAppDatabase().db,
    join(app.getPath('userData'), 'jobflow.db')
  )
}

function sanitizePatch(value: unknown): JobFlowSettingsPatch {
  if (!value || typeof value !== 'object') throw new Error('Invalid settings patch.')
  const input = value as Record<string, unknown>
  const patch: JobFlowSettingsPatch = {}

  if ('theme' in input) {
    if (
      typeof input.theme !== 'string' ||
      !themePreferences.includes(input.theme as ThemePreference)
    ) {
      throw new Error('Invalid theme.')
    }
    patch.theme = input.theme as ThemePreference
  }

  if ('defaultPriority' in input) {
    if (
      typeof input.defaultPriority !== 'string' ||
      !applicationPriorities.includes(input.defaultPriority as ApplicationPriority)
    ) {
      throw new Error('Invalid default priority.')
    }
    patch.defaultPriority = input.defaultPriority as ApplicationPriority
  }

  if ('directions' in input) {
    if (
      !Array.isArray(input.directions) ||
      input.directions.some((item) => typeof item !== 'string')
    ) {
      throw new Error('Invalid job directions.')
    }
    patch.directions = input.directions as string[]
  }

  return patch
}

export function registerSettingsIpc(): void {
  ipcMain.handle('jobflow:settings:get', () => service().get())

  ipcMain.handle('jobflow:settings:update', (_event, value: unknown) => {
    return service().update(sanitizePatch(value))
  })
}
