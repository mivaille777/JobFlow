import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'node:path'
import { initializeAppDatabase } from './db'
import { registerAnalyticsIpc } from './ipc/analytics'
import { registerApplicationIpc } from './ipc/applications'
import { registerInterviewIpc } from './ipc/interviews'
import { registerSettingsIpc } from './ipc/settings'
import { registerTodayIpc } from './ipc/today'
import { registerTransferIpc } from './ipc/transfer'
import { desktopNotificationScheduler } from './services/notifications'

const customUserDataDirectory = process.env.JOBFLOW_USER_DATA_DIR
if (customUserDataDirectory) app.setPath('userData', customUserDataDirectory)

function createWindow(): void {
  const isMac = process.platform === 'darwin'
  const isWindows = process.platform === 'win32'

  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#f3f4f6',
    title: 'JobFlow',
    autoHideMenuBar: true,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac ? { trafficLightPosition: { x: 16, y: 16 } } : {}),
    ...(!isMac
      ? {
          titleBarOverlay: {
            color: '#00000000',
            symbolColor: '#667085',
            height: 44
          }
        }
      : {}),
    ...(isWindows ? { backgroundMaterial: 'mica' as const } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initializeAppDatabase()
  registerAnalyticsIpc()
  registerApplicationIpc()
  registerInterviewIpc()
  registerSettingsIpc()
  registerTodayIpc()
  registerTransferIpc()

  ipcMain.handle('jobflow:app-version', () => app.getVersion())
  createWindow()
  desktopNotificationScheduler.refresh()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  desktopNotificationScheduler.stop()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
