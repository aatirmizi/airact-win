const { app, BrowserWindow, screen, Menu, ipcMain } = require('electron');
Menu.setApplicationMenu(null);
const path = require('node:path');

let serverPort = Number(process.env.PORT) || 3000;

async function startBackend() {
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(serverPort);
  const { app } = require('electron');
  process.env.DATA_DIR = app.getPath('userData');
  process.env.BACKUPS_DIR = path.join(app.getPath('userData'), 'backups');
  require('../server.js');
  return serverPort;
}

function createHostWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, title: 'Clik8 — Facilitator',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false },
  });
  win.loadURL(`http://127.0.0.1:${serverPort}/host`);
  return win;
}

function createProjectorWindow() {
  const displays = screen.getAllDisplays();
  const target = displays.length > 1 ? displays[1] : displays[0];
  const win = new BrowserWindow({
    x: target.bounds.x, y: target.bounds.y,
    width: target.bounds.width, height: target.bounds.height,
    title: 'Clik8 — Projector', fullscreen: false, frame: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false },
  });
  win.loadURL(`http://127.0.0.1:${serverPort}/projector`);
  return win;
}

ipcMain.handle('open-projector', () => { createProjectorWindow(); });
ipcMain.handle('quit-app', () => { app.quit(); });

app.whenReady().then(async () => {
  await startBackend();
  createHostWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) { createHostWindow(); createProjectorWindow(); }
  });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
