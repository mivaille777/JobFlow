import { ipcMain } from 'electron'
import { getAppDatabase } from '../db'
import { AnalyticsService } from '../services/analytics'

export function registerAnalyticsIpc(): void {
  ipcMain.handle('jobflow:analytics:get', () => {
    return new AnalyticsService(getAppDatabase().db).getDashboard()
  })
}
