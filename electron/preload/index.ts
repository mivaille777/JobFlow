import { contextBridge, ipcRenderer } from 'electron'
import type {
  ApplicationPatch,
  CreateApplicationRequest
} from '../../src/shared/application'
import type {
  CreateInterviewRequest,
  InterviewPatch
} from '../../src/shared/interview'
import type { JobFlowSettingsPatch } from '../../src/shared/settings'

const jobflowApi = {
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('jobflow:app-version')
  },
  analytics: {
    get: () => ipcRenderer.invoke('jobflow:analytics:get')
  },
  today: {
    get: () => ipcRenderer.invoke('jobflow:today:get')
  },
  applications: {
    list: () => ipcRenderer.invoke('jobflow:applications:list'),
    get: (id: string) => ipcRenderer.invoke('jobflow:applications:get', id),
    events: (id: string) => ipcRenderer.invoke('jobflow:applications:events', id),
    create: (input: CreateApplicationRequest) =>
      ipcRenderer.invoke('jobflow:applications:create', input),
    update: (id: string, patch: ApplicationPatch) =>
      ipcRenderer.invoke('jobflow:applications:update', id, patch)
  },
  interviews: {
    list: () => ipcRenderer.invoke('jobflow:interviews:list'),
    get: (id: string) => ipcRenderer.invoke('jobflow:interviews:get', id),
    create: (input: CreateInterviewRequest) =>
      ipcRenderer.invoke('jobflow:interviews:create', input),
    update: (id: string, patch: InterviewPatch) =>
      ipcRenderer.invoke('jobflow:interviews:update', id, patch),
    delete: (id: string) => ipcRenderer.invoke('jobflow:interviews:delete', id)
  },
  settings: {
    get: () => ipcRenderer.invoke('jobflow:settings:get'),
    update: (patch: JobFlowSettingsPatch) =>
      ipcRenderer.invoke('jobflow:settings:update', patch)
  },
  transfer: {
    previewExcel: () => ipcRenderer.invoke('jobflow:transfer:excel-preview'),
    confirmExcelImport: (sessionId: string) =>
      ipcRenderer.invoke('jobflow:transfer:excel-confirm', sessionId),
    exportExcel: () => ipcRenderer.invoke('jobflow:transfer:excel-export'),
    exportBackup: () => ipcRenderer.invoke('jobflow:transfer:backup-export'),
    importBackup: () => ipcRenderer.invoke('jobflow:transfer:backup-import')
  }
}

contextBridge.exposeInMainWorld('jobflow', jobflowApi)
