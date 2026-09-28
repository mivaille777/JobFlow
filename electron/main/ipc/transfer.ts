import { app, dialog, ipcMain } from 'electron'
import { join } from 'node:path'
import { getAppDatabase } from '../db'
import { TransferService } from '../services/transfer'

function service(): TransferService {
  return new TransferService(getAppDatabase().db)
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

export function registerTransferIpc(): void {
  ipcMain.handle('jobflow:transfer:excel-preview', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
    })

    const filePath = result.filePaths[0]
    return result.canceled || !filePath ? null : service().previewExcel(filePath)
  })

  ipcMain.handle('jobflow:transfer:excel-confirm', (_event, sessionId: unknown) => {
    if (typeof sessionId !== 'string' || !sessionId) throw new Error('Invalid import session.')
    return service().confirmExcelImport(sessionId)
  })

  ipcMain.handle('jobflow:transfer:excel-export', async () => {
    const result = await dialog.showSaveDialog({
      defaultPath: join(app.getPath('documents'), `JobFlow-投递-${dateStamp()}.xlsx`),
      filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
    })

    return result.canceled || !result.filePath ? null : service().exportExcel(result.filePath)
  })

  ipcMain.handle('jobflow:transfer:backup-export', async () => {
    const result = await dialog.showSaveDialog({
      defaultPath: join(app.getPath('documents'), `JobFlow-backup-${dateStamp()}.json`),
      filters: [{ name: 'JobFlow Backup', extensions: ['json'] }]
    })

    return result.canceled || !result.filePath ? null : service().exportBackup(result.filePath)
  })

  ipcMain.handle('jobflow:transfer:backup-import', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JobFlow Backup', extensions: ['json'] }]
    })

    const filePath = result.filePaths[0]
    return result.canceled || !filePath ? null : service().importBackup(filePath)
  })
}
