import type {
  JobFlowSettings,
  JobFlowSettingsPatch,
  ThemePreference
} from '../../../src/shared/settings'
import { defaultJobDirections } from '../../../src/shared/settings'
import {
  applicationPriorities,
  type ApplicationPriority
} from '../../../src/shared/application'
import type { JobFlowDatabase } from '../db/client'
import { SettingsRepository } from '../db/repositories'

const THEME_KEY = 'appearance.theme'
const PRIORITY_KEY = 'applications.defaultPriority'
const DIRECTIONS_KEY = 'applications.directions'

function themeValue(value: string | undefined): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

function priorityValue(value: string | undefined): ApplicationPriority {
  return applicationPriorities.includes(value as ApplicationPriority)
    ? (value as ApplicationPriority)
    : 'A'
}

function directionsValue(value: string | undefined): string[] {
  if (!value) return [...defaultJobDirections]

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return [...defaultJobDirections]

    const values = parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)

    return values.length > 0 ? Array.from(new Set(values)) : [...defaultJobDirections]
  } catch {
    return [...defaultJobDirections]
  }
}

export class SettingsService {
  private readonly settings: SettingsRepository

  constructor(
    db: JobFlowDatabase,
    private readonly databasePath: string
  ) {
    this.settings = new SettingsRepository(db)
  }

  get(): JobFlowSettings {
    return {
      theme: themeValue(this.settings.get(THEME_KEY)?.value),
      defaultPriority: priorityValue(this.settings.get(PRIORITY_KEY)?.value),
      directions: directionsValue(this.settings.get(DIRECTIONS_KEY)?.value),
      databasePath: this.databasePath
    }
  }

  update(patch: JobFlowSettingsPatch): JobFlowSettings {
    if (patch.theme !== undefined) {
      this.settings.set(THEME_KEY, patch.theme)
    }

    if (patch.defaultPriority !== undefined) {
      this.settings.set(PRIORITY_KEY, patch.defaultPriority)
    }

    if (patch.directions !== undefined) {
      const directions = Array.from(
        new Set(patch.directions.map((item) => item.trim()).filter(Boolean))
      )

      if (directions.length === 0 || directions.length > 20) {
        throw new Error('岗位方向数量必须在 1–20 个之间。')
      }

      if (directions.some((item) => item.length > 40)) {
        throw new Error('单个岗位方向不能超过 40 个字符。')
      }

      this.settings.set(DIRECTIONS_KEY, JSON.stringify(directions))
    }

    return this.get()
  }
}
