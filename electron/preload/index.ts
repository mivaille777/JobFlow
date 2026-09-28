import { contextBridge, ipcRenderer } from 'electron'

const jobflowApi = {
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('jobflow:app-version')
  }
}

contextBridge.exposeInMainWorld('jobflow', jobflowApi)
