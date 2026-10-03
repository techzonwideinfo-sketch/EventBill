import { app, BrowserWindow, shell, session, protocol, net } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
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
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
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
    const resolvedPath = path.join(__dirname, '../dist', cleanUrlPath || 'index.html');
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
