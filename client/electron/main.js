import { app, BrowserWindow, shell, session, protocol, net, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'MOI BILL',
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadURL('app://index.html');
  }

  // Intercept external links and open in default browser safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('app://') || url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isLocal = url.startsWith('http://localhost') || url.startsWith('app://');
    if (!isLocal) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: false, corsEnabled: true } }
]);

app.whenReady().then(() => {
  const isDev = !app.isPackaged;
  
  protocol.handle('app', (request) => {
    const urlPath = request.url.slice('app://'.length);
    // Remove query params or hashes
    const cleanUrlPath = new URL(request.url).pathname.replace(/^\/+/, '');
    let resolvedPath = path.join(__dirname, '../dist', cleanUrlPath || 'index.html');
    
    // Fallback to index.html for SPA routing
    if (!fs.existsSync(resolvedPath)) {
      resolvedPath = path.join(__dirname, '../dist', 'index.html');
    }
    
    return net.fetch(pathToFileURL(resolvedPath).toString());
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    let csp = "default-src 'self' app:; script-src 'self' 'unsafe-inline' app:; style-src 'self' 'unsafe-inline' app:; img-src 'self' data: blob: app:; font-src 'self' data: app:; connect-src 'self' app: https://eventbill1.onrender.com http://localhost:5000;";
    if (isDev) {
      process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
      csp = "default-src 'self' 'unsafe-inline' data: http: ws: wss: app:; connect-src *;";
    }
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  ipcMain.handle('print-html', async (event, htmlContent) => {
    return new Promise((resolve) => {
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false
        }
      });

      printWindow.webContents.on('did-finish-load', () => {
        // Give time for images and fonts to render
        setTimeout(() => {
          printWindow.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
            resolve({ success, reason: failureReason });
            printWindow.close();
          });
        }, 800);
      });

      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    });
  });

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
