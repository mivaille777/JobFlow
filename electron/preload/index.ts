import { contextBridge, ipcRenderer } from 'electron'
import type { ApplicationPatch } from '../../src/shared/application'

const jobflowApi = {
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('jobflow:app-version')
  },
  applications: {
    list: () => ipcRenderer.invoke('jobflow:applications:list'),
    update: (id: string, patch: ApplicationPatch) =>
      ipcRenderer.invoke('jobflow:applications:update', id, patch)
  }
}

contextBridge.exposeInMainWorld('jobflow', jobflowApi)
