import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerHttpHandlers } from './ipc/http-handler'
import { registerFsHandlers } from './ipc/fs-handler'
import { registerHistoryHandlers } from './ipc/history-handler'
import { registerImportHandlers } from './ipc/import-handler'
import { registerExportHandlers } from './ipc/export-handler'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerHttpHandlers()
  registerFsHandlers()
  registerHistoryHandlers()
  registerImportHandlers()
  registerExportHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
