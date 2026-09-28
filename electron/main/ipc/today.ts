import { ipcMain } from 'electron'
import { getAppDatabase } from '../db'
import { TodayService } from '../services/today'

export function registerTodayIpc(): void {
  ipcMain.handle('jobflow:today:get', () => {
    return new TodayService(getAppDatabase().db).getDashboard()
  })
}
