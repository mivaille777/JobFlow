import { contextBridge, ipcRenderer } from 'electron'
import type {
  ApplicationPatch,
  CreateApplicationRequest
} from '../../src/shared/application'
import type {
  CreateInterviewRequest,
  InterviewPatch
} from '../../src/shared/interview'

const jobflowApi = {
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('jobflow:app-version')
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
  }
}

contextBridge.exposeInMainWorld('jobflow', jobflowApi)
