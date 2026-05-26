import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerFileScannerHandlers } from './ipc/fileScanner';
import { registerStorageHandlers } from './ipc/storage';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env['VFX_DEV'] === 'true';

if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'VFX Audio Manager',
    backgroundColor: '#0d0f12',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    autoHideMenuBar: true,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Prevent navigation away from the app when files are dropped onto the window
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  if (isDev) {
    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; " +
                "style-src 'self' 'unsafe-inline' http://localhost:*; " +
                "media-src 'self' file: blob:; " +
                "img-src 'self' data: http://localhost:*; " +
                "connect-src 'self' http://localhost:* ws://localhost:*",
            ],
          },
        });
      },
    );

    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerFileScannerHandlers();
  registerStorageHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
