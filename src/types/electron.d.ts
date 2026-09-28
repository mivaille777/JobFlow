import type { AnalyticsDashboardData } from '../shared/analytics'
import type {
  ApplicationDetail,
  ApplicationEvent,
  ApplicationListItem,
  ApplicationPatch,
  CreateApplicationRequest
} from '../shared/application'
import type {
  CreateInterviewRequest,
  InterviewDetail,
  InterviewListItem,
  InterviewPatch
} from '../shared/interview'
import type {
  JobFlowSettings,
  JobFlowSettingsPatch
} from '../shared/settings'
import type { TodayDashboardData } from '../shared/today'
import type {
  BackupRestoreResult,
  ExcelImportPreview,
  ExcelImportResult,
  FileOperationResult
} from '../shared/transfer'

export {}

declare global {
  interface Window {
    jobflow: {
      app: { getVersion: () => Promise<string> }
      analytics: { get: () => Promise<AnalyticsDashboardData> }
      today: { get: () => Promise<TodayDashboardData> }
      applications: {
        list: () => Promise<ApplicationListItem[]>
        get: (id: string) => Promise<ApplicationDetail>
        events: (id: string) => Promise<ApplicationEvent[]>
        create: (input: CreateApplicationRequest) => Promise<ApplicationDetail>
        update: (id: string, patch: ApplicationPatch) => Promise<ApplicationDetail>
      }
      interviews: {
        list: () => Promise<InterviewListItem[]>
        get: (id: string) => Promise<InterviewDetail>
        create: (input: CreateInterviewRequest) => Promise<InterviewDetail>
        update: (id: string, patch: InterviewPatch) => Promise<InterviewDetail>
        delete: (id: string) => Promise<void>
      }
      settings: {
        get: () => Promise<JobFlowSettings>
        update: (patch: JobFlowSettingsPatch) => Promise<JobFlowSettings>
      }
      transfer: {
        previewExcel: () => Promise<ExcelImportPreview | null>
        confirmExcelImport: (sessionId: string) => Promise<ExcelImportResult>
        exportExcel: () => Promise<FileOperationResult | null>
        exportBackup: () => Promise<FileOperationResult | null>
        importBackup: () => Promise<BackupRestoreResult | null>
      }
    }
  }
}
