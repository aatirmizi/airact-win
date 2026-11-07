import { app, BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let serverPort = Number(process.env.PORT) || 3000;

async function startBackend(): Promise<number> {
  // Boot the existing Express+WS server in-process.
  // server.ts reads PORT from env and listens on 0.0.0.0.
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(serverPort);
  await import('../server.ts');
  return serverPort;
}

function createHostWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Clik8 — Facilitator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(`http://127.0.0.1:${serverPort}/host`);
  return win;
}

function createProjectorWindow() {
  const displays = screen.getAllDisplays();
  const target = displays.length > 1 ? displays[1] : displays[0];
  const win = new BrowserWindow({
    x: target.bounds.x,
    y: target.bounds.y,
    width: target.bounds.width,
    height: target.bounds.height,
    title: 'Clik8 — Projector',
    fullscreen: displays.length > 1,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(`http://127.0.0.1:${serverPort}/projector`);
  return win;
}

app.whenReady().then(async () => {
  await startBackend();
  createHostWindow();
  createProjectorWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createHostWindow();
      createProjectorWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
