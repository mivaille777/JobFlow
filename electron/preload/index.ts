import { contextBridge, ipcRenderer } from 'electron'
import type {
  ApplicationPatch,
  CreateApplicationRequest
} from '../../src/shared/application'

const jobflowApi = {
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('jobflow:app-version')
  },
  applications: {
    list: () => ipcRenderer.invoke('jobflow:applications:list'),
    get: (id: string) => ipcRenderer.invoke('jobflow:applications:get', id),
    create: (input: CreateApplicationRequest) =>
      ipcRenderer.invoke('jobflow:applications:create', input),
    update: (id: string, patch: ApplicationPatch) =>
      ipcRenderer.invoke('jobflow:applications:update', id, patch)
  }
}

contextBridge.exposeInMainWorld('jobflow', jobflowApi)
