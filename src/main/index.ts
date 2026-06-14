import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { setupIpc } from './ipc'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    backgroundColor: '#0b0f14',
    autoHideMenuBar: true,
    title: 'Projector',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  setupIpc(mainWindow)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Toggle fullscreen — handy for projector use (also bound to F11 in renderer).
  ipcMain.handle('window:toggle-fullscreen', () => {
    if (!mainWindow) return false
    const next = !mainWindow.isFullScreen()
    mainWindow.setFullScreen(next)
    return next
  })

  // electron-vite injects the dev server URL in development.
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
