import type {
  JobFlowSettings,
  JobFlowSettingsPatch,
  ThemePreference
} from '../../../src/shared/settings'
import {
  defaultApplicationChannels,
  defaultJobDirections
} from '../../../src/shared/settings'
import {
  applicationPriorities,
  type ApplicationPriority
} from '../../../src/shared/application'
import type { JobFlowDatabase } from '../db/client'
import { SettingsRepository } from '../db/repositories'

const THEME_KEY = 'appearance.theme'
const PRIORITY_KEY = 'applications.defaultPriority'
const DIRECTIONS_KEY = 'applications.directions'
const CHANNELS_KEY = 'applications.channels'

function themeValue(value: string | undefined): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

function priorityValue(value: string | undefined): ApplicationPriority {
  return applicationPriorities.includes(value as ApplicationPriority)
    ? (value as ApplicationPriority)
    : 'A'
}

function listValue(value: string | undefined, fallback: readonly string[]): string[] {
  if (!value) return [...fallback]

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return [...fallback]

    const values = parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)

    return values.length > 0 ? Array.from(new Set(values)) : [...fallback]
  } catch {
    return [...fallback]
  }
}

function normalizeOptions(values: string[], label: string): string[] {
  const normalized = Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))

  if (normalized.length === 0 || normalized.length > 20) {
    throw new Error(`${label}数量必须在 1–20 个之间。`)
  }

  if (normalized.some((item) => item.length > 40)) {
    throw new Error(`单个${label}不能超过 40 个字符。`)
  }

  return normalized
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
      directions: listValue(this.settings.get(DIRECTIONS_KEY)?.value, defaultJobDirections),
      channels: listValue(this.settings.get(CHANNELS_KEY)?.value, defaultApplicationChannels),
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
      this.settings.set(
        DIRECTIONS_KEY,
        JSON.stringify(normalizeOptions(patch.directions, '岗位方向'))
      )
    }

    if (patch.channels !== undefined) {
      this.settings.set(
        CHANNELS_KEY,
        JSON.stringify(normalizeOptions(patch.channels, '投递渠道'))
      )
    }

    return this.get()
  }
}
