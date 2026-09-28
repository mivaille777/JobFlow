import type { ApplicationPriority } from './application'

export const themePreferences = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof themePreferences)[number]

export const defaultJobDirections = [
  'AI Agent',
  'LLM算法',
  'AI应用开发',
  'RAG/检索',
  '多模态',
  '其他'
] as const

export interface JobFlowSettings {
  theme: ThemePreference
  defaultPriority: ApplicationPriority
  directions: string[]
  databasePath: string
}

export interface JobFlowSettingsPatch {
  theme?: ThemePreference
  defaultPriority?: ApplicationPriority
  directions?: string[]
}
